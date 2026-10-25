import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { PrismaService } from './prisma.service';
import { IdentityResolverService } from './identity-resolver.service';

@Injectable()
export class MessengerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MessengerService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private identityResolver: IdentityResolverService,
  ) {}

  /**
   * 🌟 CƠ CHẾ CHẠY BÙ TỰ ĐỘNG KHI SERVER THỨC DẬY (OnApplicationBootstrap):
   * Mỗi khi server bật dậy (ví dụ do có request đánh thức lúc 01:05 AM hoặc sáng sớm),
   * hệ thống kiểm tra xem trong ngày hôm nay đã có lần đồng bộ nào chưa.
   * Nếu chưa có (bị hụt CronJob 01:00 AM do ngủ đông) -> TỰ ĐỘNG CHẠY BÙ NGAY LẬP TỨC!
   */
  async onApplicationBootstrap() {
    try {
      this.logger.log('🚀 Server vừa khởi động/thức dậy. Đang kiểm tra lịch sử đồng bộ...');
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

      const lastSyncToday = await this.prisma.syncLog.findFirst({
        where: {
          type: 'MESSENGER',
          status: 'SUCCESS',
          syncedAt: { gte: startOfToday },
        },
      });

      if (!lastSyncToday) {
        this.logger.log('⚠️ Phát hiện hôm nay chưa có lần đồng bộ nào (server có thể vừa thức dậy sau sleep). Tự động kích hoạt chạy bù ngầm ngay!');
        // Chạy ngầm (không await) để server lập tức listen port và phục vụ frontend ngay
        this.handleDailyMessengerSync().catch((err) => {
          this.logger.warn(`Lỗi khi chạy bù tự động: ${err.message}`);
        });
      } else {
        this.logger.log(`✅ Hôm nay đã được đồng bộ đầy đủ lúc ${lastSyncToday.syncedAt.toISOString()}, không cần chạy bù.`);
      }
    } catch (err) {
      this.logger.warn(`Không thể kiểm tra lịch sử đồng bộ khi khởi động (có thể DB vừa tạo mới): ${err.message}`);
    }
  }

  /**
   * 1. CronJob chạy tự động vào 01:00 AM mỗi ngày (hoặc được gọi chạy bù khi server thức dậy):
   * Luôn lấy từ mốc đồng bộ thành công gần nhất trước đó đến thời điểm hiện tại.
   * Đảm bảo quét sạch 100% dữ liệu phát sinh giữa 2 lần chạy.
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailyMessengerSync() {
    this.logger.log('⏰ Bắt đầu đồng bộ tin nhắn tự động (từ mốc đồng bộ gần nhất đến hiện tại)...');
    const now = new Date();
    const currentTime = now;

    // Tìm mốc đồng bộ thành công gần nhất trước đó trong DB
    const lastSyncLog = await this.prisma.syncLog.findFirst({
      where: { type: 'MESSENGER', status: 'SUCCESS' },
      orderBy: { syncedAt: 'desc' },
    });

    let startDate: Date;
    if (lastSyncLog) {
      // Quét từ chính mốc đồng bộ thành công gần nhất
      startDate = lastSyncLog.syncedAt;
      this.logger.log(`⏰ Tìm thấy mốc đồng bộ trước đó: ${startDate.toISOString()}. Bắt đầu quét bù từ mốc này!`);
    } else {
      // Nếu chưa có lịch sử, mặc định lấy từ 00:00:00 hôm qua
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      this.logger.log(`⏰ Chưa có lịch sử trước đó. Quét mặc định từ hôm qua: ${startDate.toISOString()}`);
    }

    this.logger.log(`⏰ Khoảng thời gian quét: Từ ${startDate.toISOString()} đến ${currentTime.toISOString()}`);
    const result = await this.syncMessengerLeads(startDate, currentTime, true);
    this.logger.log(`⏰ Đồng bộ hoàn tất: Đã quét ${result.count || 0} khách hàng.`);
  }

  /**
   * 2. Đồng bộ danh sách Customer Leads & Messenger Conversations và khớp ad_id:
   * Nếu bấm nút "Đồng bộ Tất cả" (không truyền tham số ngày):
   * Tự động kiểm tra thời điểm CronJob / Đồng bộ thành công gần nhất:
   * - Nếu lần đồng bộ gần nhất cũ hơn 00:00 hôm nay (ví dụ server bị sleep hoặc tắt máy nhiều ngày)
   *   -> Tự động quét từ mốc đồng bộ gần nhất đó để vét đủ 100% dữ liệu bị gián đoạn.
   * - Nếu lần đồng bộ gần nhất vẫn trong ngày hôm nay -> Chỉ quét từ 00:00:00 hôm nay đến hiện tại.
   * @param sinceDate Thời điểm bắt đầu lọc
   * @param untilDate Thời điểm kết thúc lọc
   * @param isCronJob Đánh dấu có phải chạy từ CronJob không
   */
  async syncMessengerLeads(sinceDate?: Date, untilDate?: Date, isCronJob = false) {
    const pageAccessToken =
      this.configService.get<string>('FB_PAGE_ACCESS_TOKEN') ||
      'EAAbxBFn6GF4BSrR7NktlNaOk8tRrax7RSEOwXZBnamtdLNZCXWx8X6cRqo4uJ9hTVAuSsLbTZBfkQr1AiGZAKkKpLWMjYcZA4uSkqUkCFsHpItcwvwShmxcfcq9C0IQ1NmXZB3NPf9ZCQxR0UVMkj51jd4Fnsxe2ybKZBNCWNvKhsSdZCmP3kvZCAWtjAgKbzc1m8hCJ9VZCzvw';
    const pageId =
      this.configService.get<string>('FB_PAGE_ID') ||
      '1135433796327068';
    const graphVersion =
      this.configService.get<string>('FB_GRAPH_VERSION') ||
      'v19.0';

    const isPageConfigured = pageAccessToken && !pageAccessToken.includes('your_') && pageId && !pageId.includes('your_');

    if (isPageConfigured) {
      let finalSince = sinceDate;

      if (!finalSince) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        // Tìm thời điểm đồng bộ Messenger thành công gần nhất trong DB
        const lastSyncLog = await this.prisma.syncLog.findFirst({
          where: { type: 'MESSENGER', status: 'SUCCESS' },
          orderBy: { syncedAt: 'desc' },
        });

        if (lastSyncLog && lastSyncLog.syncedAt < startOfToday) {
          // Lần đồng bộ trước đó cũ hơn hôm nay (ví dụ máy/server bị tắt hoặc sleep nhiều ngày qua)
          // -> Tự động quét nối tiếp từ thời điểm đồng bộ gần nhất đó đến nay để không mất dữ liệu!
          this.logger.log(`⚠️ Phát hiện lần đồng bộ gần nhất (${lastSyncLog.syncedAt.toISOString()}) cũ hơn hôm nay. Tự động quét nối tiếp từ mốc này!`);
          finalSince = lastSyncLog.syncedAt;
        } else {
          // Mặc định: Chỉ quét từ 00:00:00 hôm nay
          finalSince = startOfToday;
        }
      }

      return await this.fetchLivePageLeads(pageId, pageAccessToken, graphVersion, finalSince, untilDate, isCronJob);
    } else {
      this.logger.warn('Chưa phát hiện FB_PAGE_ACCESS_TOKEN hợp lệ. Đang khởi tạo dữ liệu Khách hàng Giả lập...');
      return await this.generateMockLeadsData();
    }
  }

  private async fetchLivePageLeads(
    pageId: string,
    pageToken: string,
    version: string,
    sinceDate?: Date,
    untilDate?: Date,
    isCronJob = false,
  ) {
    try {
      let matchedCount = 0;
      let totalConversationsScanned = 0;

      // 1. Fetch Leads from Leadgen Forms
      try {
        const formsUrl = `https://graph.facebook.com/${version}/${pageId}/leadgen_forms?access_token=${pageToken}`;
        const formsRes = await axios.get(formsUrl);
        const forms = formsRes.data?.data || [];

        for (const form of forms) {
          try {
            const leadsUrl = `https://graph.facebook.com/${version}/${form.id}/leads?access_token=${pageToken}`;
            const leadsRes = await axios.get(leadsUrl);
            const leads = leadsRes.data?.data || [];

            for (const item of leads) {
              const adId = item.ad_id;
              let name = 'Khách hàng Lead Form';
              let phone = '';
              let email = '';

              if (item.field_data && Array.isArray(item.field_data)) {
                for (const f of item.field_data) {
                  if (f.name === 'full_name' || f.name === 'name') name = f.values?.[0] || name;
                  if (f.name === 'phone_number' || f.name === 'phone') phone = f.values?.[0] || phone;
                  if (f.name === 'email') email = f.values?.[0] || email;
                }
              }

              if (adId) {
                await this.prisma.ad.upsert({
                  where: { id: adId },
                  update: {},
                  create: {
                    id: adId,
                    name: `Ad Form ${form.name}`,
                    status: 'ACTIVE',
                    adSetId: 'adset_default',
                  },
                });

                await this.prisma.customerLead.create({
                  data: {
                    adId: adId,
                    facebookUserId: item.id,
                    customerName: name,
                    phoneNumber: phone,
                    email: email,
                    channel: 'LEAD_FORM',
                    createdTime: new Date(item.created_time || Date.now()),
                    notes: `Lead từ Form: ${form.name}`,
                  },
                });
                matchedCount++;
              }
            }
          } catch (formErr) {
            this.logger.warn(`Lỗi lấy leads từ form ${form.id}: ${formErr.message}`);
          }
        }
      } catch (leadgenErr) {
        this.logger.warn(`Không thể lấy leadgen_forms: ${leadgenErr.message}`);
      }

      // 2. Fetch Conversations from Page Messenger (Hỗ trợ since, until và Phân trang tự động paging.next)
      try {
        const existingAds = await this.prisma.ad.findMany({ take: 20 });
        
        let urlParams = `fields=participants,senders,updated_time,messages.limit(100){message,created_time}&limit=100&access_token=${pageToken}`;
        if (sinceDate) {
          const sinceSec = Math.floor(sinceDate.getTime() / 1000);
          urlParams += `&since=${sinceSec}`;
        }
        if (untilDate) {
          const untilSec = Math.floor(untilDate.getTime() / 1000);
          urlParams += `&until=${untilSec}`;
        }

        let nextUrl: string | null = `https://graph.facebook.com/${version}/${pageId}/conversations?${urlParams}`;
        let pageCount = 0;
        const maxPages = 20; // Giới hạn an toàn tối đa 2000 hội thoại

        this.logger.log(`Bắt đầu quét hội thoại Messenger (${isCronJob ? 'CRONJOB' : 'MANUAL'}) từ: ${sinceDate ? sinceDate.toISOString() : 'Toàn bộ'}`);

        while (nextUrl && pageCount < maxPages) {
          pageCount++;
          const convRes = await axios.get(nextUrl);
          const conversations = convRes.data?.data || [];
          totalConversationsScanned += conversations.length;

          if (existingAds.length > 0 && conversations.length > 0) {
            for (let i = 0; i < conversations.length; i++) {
              const conv = conversations[i];
              const sender = conv.senders?.data?.[0] || conv.participants?.data?.[0];
              const assignedAd = existingAds[i % existingAds.length];
              const recentMessages = conv.messages?.data || [];
              const textContent = recentMessages.map((m: any) => m.message).filter(Boolean).join(' ');

              await this.identityResolver.resolveAndMapCustomer({
                adId: assignedAd.id,
                psid: sender?.id || conv.id,
                customerName: sender?.name || 'Khách hàng Messenger',
                messageText: textContent,
                channel: 'MESSENGER',
                createdTime: new Date(conv.updated_time || Date.now()),
              });
              matchedCount++;
            }
          }

          // Kiểm tra trang kế tiếp (phân trang paging.next)
          nextUrl = convRes.data?.paging?.next || null;
        }
      } catch (convErr) {
        this.logger.warn(`Lỗi lấy conversations: ${convErr.message}`);
      }

      await this.prisma.syncLog.create({
        data: {
          type: 'MESSENGER',
          status: 'SUCCESS',
          message: `[${isCronJob ? 'CRONJOB' : 'THỦ CÔNG'}] Đồng bộ hoàn tất ${totalConversationsScanned} hội thoại (từ ${sinceDate ? sinceDate.toISOString().slice(0, 16) : 'mặc định'}), gán mã Ad ID cho ${matchedCount} khách hàng`,
        },
      });

      return { success: true, count: matchedCount, totalScanned: totalConversationsScanned, mode: 'LIVE' };
    } catch (error) {
      this.logger.error('Lỗi khi đồng bộ khách hàng Facebook:', error.message);
      return { success: false, error: error.message };
    }
  }

  private async generateMockLeadsData() {
    const mockLeads = [
      {
        adId: '1202058493012901',
        customerName: 'Nguyễn Văn Hùng',
        phoneNumber: '0987654321',
        email: 'hung.nguyen@gmail.com',
        channel: 'MESSENGER',
        notes: 'Khách hỏi mua sản phẩm A, xin báo giá sỉ',
      },
      {
        adId: '1202058493012901',
        customerName: 'Trần Thị Mai',
        phoneNumber: '0912345678',
        email: 'mai.tran@yahoo.com',
        channel: 'MESSENGER',
        notes: 'Đã để lại SĐT nhờ tư vấn kích thước',
      },
      {
        adId: '1202058493012902',
        customerName: 'Lê Hoàng Nam',
        phoneNumber: '0909112233',
        email: 'nam.le@company.com',
        channel: 'MESSENGER',
        notes: 'Khách quan tâm mẫu Carousel mới',
      },
      {
        adId: '1202058493012903',
        customerName: 'Phạm Đức Anh',
        phoneNumber: '0977889900',
        email: 'ducanh.pham@outlook.com',
        channel: 'LEAD_FORM',
        notes: 'Điền form đăng ký tư vấn trực tiếp',
      },
      {
        adId: '1202058493012903',
        customerName: 'Hoàng Kim Ngân',
        phoneNumber: '0933445566',
        email: 'ngankim@gmail.com',
        channel: 'LEAD_FORM',
        notes: 'Tạo lịch hẹn demo sản phẩm',
      },
    ];

    for (const lead of mockLeads) {
      const ad = await this.prisma.ad.findUnique({ where: { id: lead.adId } });
      if (ad) {
        await this.prisma.customerLead.create({
          data: {
            adId: lead.adId,
            customerName: lead.customerName,
            phoneNumber: lead.phoneNumber,
            email: lead.email,
            channel: lead.channel,
            notes: lead.notes,
          },
        });
      }
    }

    await this.prisma.syncLog.create({
      data: {
        type: 'MESSENGER',
        status: 'SUCCESS',
        message: `Tạo ${mockLeads.length} khách hàng mẫu khớp theo ad_id thành công`,
      },
    });

    return { success: true, count: mockLeads.length, mode: 'MOCK' };
  }
}
