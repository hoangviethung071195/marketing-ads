import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import * as crypto from 'crypto';

export interface DongaOrderItem {
  ma: string;
  ngay: string;
  kenh_ban: string;
  trang_thai: string;
  doanh_thu: number;
  tien_tra_hang: number;
  tien_te: string;
  ma_nb?: string;
  khach?: {
    co_khach: boolean;
    nguon?: string;
    phuong_tien?: string;
    ph?: string; // SHA-256 hash của số điện thoại (E.164)
    em?: string;
    fn?: string;
    ln?: string;
  };
}

@Injectable()
export class DongaCrmService {
  private readonly logger = new Logger(DongaCrmService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.apiUrl =
      this.configService.get<string>('DONGA_CRM_API_URL') ||
      'https://donga-hethong-production.up.railway.app';
    this.apiKey =
      this.configService.get<string>('DONGA_CRM_API_KEY') ||
      'dak_sv0mjACmnhlRFlz7zpwOtYiOBc9fxytenk63Zttow80';
  }

  /**
   * Băm số điện thoại sang SHA-256 theo chuẩn E.164 (84xxxxxxxxx) và dạng 0xxxxxxxxx
   */
  private getPhoneHashes(phone: string): { e164Hash: string; zeroHash: string } {
    const digits = phone.replace(/\D/g, '');
    const e164 = digits.startsWith('84') ? digits : '84' + (digits.startsWith('0') ? digits.slice(1) : digits);
    const zero = digits.startsWith('84') ? '0' + digits.slice(2) : digits;

    const e164Hash = crypto.createHash('sha256').update(e164).digest('hex');
    const zeroHash = crypto.createHash('sha256').update(zero).digest('hex');

    return { e164Hash, zeroHash };
  }

  /**
   * Gọi API Đông Á lấy danh sách đơn hàng thực tế
   */
  async fetchDongaOrders(tuNgay?: string, denNgay?: string): Promise<DongaOrderItem[]> {
    // Mặc định lấy trong 90 ngày gần nhất nếu không truyền tham số
    const toDate = denNgay ? new Date(denNgay) : new Date();
    const fromDate = tuNgay
      ? new Date(tuNgay)
      : new Date(toDate.getTime() - 90 * 24 * 60 * 60 * 1000);

    const formatStr = (d: Date) => d.toISOString().slice(0, 10);
    const tu_ngay = formatStr(fromDate);
    const den_ngay = formatStr(toDate);

    const url = `${this.apiUrl}/api/v1/don-hang?tu_ngay=${tu_ngay}&den_ngay=${den_ngay}&page_size=500`;

    this.logger.log(`Đang kéo đơn hàng Đông Á: ${url}`);
    const response = await fetch(url, {
      headers: {
        'X-API-Key': this.apiKey,
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Lỗi gọi API Đông Á (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Đồng bộ và đối soát tự động đơn hàng Đông Á với các Leads Facebook (Attribution Matching)
   */
  async syncDongaOrders() {
    this.logger.log('Bắt đầu đồng bộ đơn hàng Đông Á và đối soát Attribution...');
    const orders = await this.fetchDongaOrders();

    // Lấy tất cả leads có số điện thoại, sắp xếp theo tương tác gần nhất trước
    const leads = await this.prisma.customerLead.findMany({
      where: { phoneNumber: { not: null } },
      orderBy: { createdTime: 'desc' },
      include: { ad: true },
    });

    // Tạo bản đồ hash SĐT -> Lead (ưu tiên lead mới nhất)
    const hashToLeadMap = new Map<string, typeof leads[0]>();
    for (const lead of leads) {
      if (lead.phoneNumber) {
        const { e164Hash, zeroHash } = this.getPhoneHashes(lead.phoneNumber);
        if (!hashToLeadMap.has(e164Hash)) hashToLeadMap.set(e164Hash, lead);
        if (!hashToLeadMap.has(zeroHash)) hashToLeadMap.set(zeroHash, lead);
      }
    }

    let matchedCount = 0;
    let totalRevenueMatched = 0;

    for (const ord of orders) {
      const phHash = ord.khach?.ph;
      const matchedLead = phHash ? hashToLeadMap.get(phHash) : undefined;
      const adId = matchedLead?.adId || null;

      // Net revenue sau khi trừ tiền trả hàng
      const netRevenue = Math.max(0, (ord.doanh_thu || 0) - (ord.tien_tra_hang || 0));

      await this.prisma.crmOrder.upsert({
        where: { orderCode: ord.ma },
        update: {
          customerPhone: matchedLead?.phoneNumber || (phHash ? `HASH:${phHash.slice(0, 10)}...` : 'N/A'),
          revenue: netRevenue,
          status: ord.trang_thai === 'hoan_thanh' ? 'SUCCESS' : ord.trang_thai,
          productName: `Kênh: ${ord.kenh_ban || 'N/A'}`,
          customerLeadId: matchedLead?.id || null,
          adId: adId,
          orderDate: ord.ngay ? new Date(ord.ngay) : new Date(),
        },
        create: {
          orderCode: ord.ma,
          customerPhone: matchedLead?.phoneNumber || (phHash ? `HASH:${phHash.slice(0, 10)}...` : 'N/A'),
          revenue: netRevenue,
          status: ord.trang_thai === 'hoan_thanh' ? 'SUCCESS' : ord.trang_thai,
          productName: `Kênh: ${ord.kenh_ban || 'N/A'}`,
          customerLeadId: matchedLead?.id || null,
          adId: adId,
          orderDate: ord.ngay ? new Date(ord.ngay) : new Date(),
        },
      });

      if (adId && ord.trang_thai !== 'huy') {
        matchedCount++;
        totalRevenueMatched += netRevenue;
      }
    }

    await this.prisma.syncLog.create({
      data: {
        type: 'CRM',
        status: 'SUCCESS',
        message: `Đã nạp ${orders.length} đơn hàng Đông Á thực tế, đối soát khớp thành công ${matchedCount} đơn vào mã Ad ID (Doanh thu thực: ${totalRevenueMatched.toLocaleString('vi-VN')} VND)`,
      },
    });

    this.logger.log(
      `✅ Đồng bộ đơn hàng Đông Á hoàn tất: ${orders.length} đơn, ${matchedCount} đơn khớp Ads, Doanh thu: ${totalRevenueMatched.toLocaleString('vi-VN')} VND`,
    );

    return {
      totalOrders: orders.length,
      matchedOrders: matchedCount,
      totalRevenueMatched,
    };
  }
}
