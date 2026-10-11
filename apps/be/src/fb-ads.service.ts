import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from './prisma.service';
import { TrackingParserService } from './tracking-parser.service';

@Injectable()
export class FbAdsService {
  private readonly logger = new Logger(FbAdsService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private trackingParser: TrackingParserService,
  ) {}

  /**
   * Đồng bộ dữ liệu Ads từ Facebook Graph API (hoặc Mock Data nếu chưa điền Token)
   */
  async syncFbAdsData() {
    const accessToken = this.configService.get<string>('FB_ACCESS_TOKEN');
    const adAccountId = this.configService.get<string>('FB_AD_ACCOUNT_ID');
    const graphVersion = this.configService.get<string>('FB_GRAPH_VERSION', 'v19.0');

    const isTokenConfigured = accessToken && !accessToken.includes('your_') && adAccountId && !adAccountId.includes('your_');

    if (isTokenConfigured) {
      return await this.fetchLiveFacebookAds(adAccountId, accessToken, graphVersion);
    } else {
      this.logger.warn('Chưa phát hiện FB_ACCESS_TOKEN hợp lệ trong .env. Đang kích hoạt chế độ Giả lập (Mock Data Engine)...');
      return await this.generateMockAdsData();
    }
  }

  private async fetchLiveFacebookAds(adAccountId: string, accessToken: string, version: string) {
    try {
      const formattedAccount = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
      
      // 1. Fetch Account Info
      const accountUrl = `https://graph.facebook.com/${version}/${formattedAccount}?fields=name,account_status,currency&access_token=${accessToken}`;
      const accountRes = await axios.get(accountUrl);
      const accData = accountRes.data;

      await this.prisma.adAccount.upsert({
        where: { id: formattedAccount },
        update: { name: accData.name, currency: accData.currency },
        create: {
          id: formattedAccount,
          name: accData.name,
          currency: accData.currency || 'VND',
        },
      });

      // 2. Fetch Campaigns & Ads Insights
      const insightsUrl = `https://graph.facebook.com/${version}/${formattedAccount}/insights?fields=ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,impressions,clicks,spend,cpc,ctr,reach,actions&date_preset=maximum&level=ad&access_token=${accessToken}`;
      const insightsRes = await axios.get(insightsUrl);
      const insightsList = insightsRes.data?.data || [];

      for (const item of insightsList) {
        const parsedTags = this.trackingParser.parseCampaignName(item.campaign_name);

        // Upsert Campaign
        await this.prisma.campaign.upsert({
          where: { id: item.campaign_id },
          update: {
            name: item.campaign_name,
            status: 'ACTIVE',
            brand: parsedTags.brand,
            target: parsedTags.target,
            format: parsedTags.format,
            dateTag: parsedTags.dateTag,
          },
          create: {
            id: item.campaign_id,
            name: item.campaign_name,
            status: 'ACTIVE',
            adAccountId: formattedAccount,
            brand: parsedTags.brand,
            target: parsedTags.target,
            format: parsedTags.format,
            dateTag: parsedTags.dateTag,
          },
        });

        // Upsert AdSet
        await this.prisma.adSet.upsert({
          where: { id: item.adset_id },
          update: { name: item.adset_name, status: 'ACTIVE' },
          create: {
            id: item.adset_id,
            name: item.adset_name,
            status: 'ACTIVE',
            campaignId: item.campaign_id,
          },
        });

        // Upsert Ad
        await this.prisma.ad.upsert({
          where: { id: item.ad_id },
          update: { name: item.ad_name, status: 'ACTIVE' },
          create: {
            id: item.ad_id,
            name: item.ad_name,
            status: 'ACTIVE',
            adSetId: item.adset_id,
          },
        });

        // Calculate Messaging Conversations & Leads
        let msgs = 0;
        let leads = 0;
        if (item.actions && Array.isArray(item.actions)) {
          for (const act of item.actions) {
            if (act.action_type === 'onsite_conversion.messaging_conversation_started_7d') msgs += parseInt(act.value || '0', 10);
            if (act.action_type === 'lead') leads += parseInt(act.value || '0', 10);
          }
        }

        const today = new Date().toISOString().split('T')[0];
        await this.prisma.adInsight.upsert({
          where: { adId_date: { adId: item.ad_id, date: today } },
          update: {
            impressions: parseInt(item.impressions || '0', 10),
            clicks: parseInt(item.clicks || '0', 10),
            spend: parseFloat(item.spend || '0'),
            cpc: parseFloat(item.cpc || '0'),
            ctr: parseFloat(item.ctr || '0'),
            reach: parseInt(item.reach || '0', 10),
            messagingConversions: msgs,
            leads: leads,
          },
          create: {
            adId: item.ad_id,
            date: today,
            impressions: parseInt(item.impressions || '0', 10),
            clicks: parseInt(item.clicks || '0', 10),
            spend: parseFloat(item.spend || '0'),
            cpc: parseFloat(item.cpc || '0'),
            ctr: parseFloat(item.ctr || '0'),
            reach: parseInt(item.reach || '0', 10),
            messagingConversions: msgs,
            leads: leads,
          },
        });
      }

      await this.prisma.syncLog.create({
        data: {
          type: 'ADS',
          status: 'SUCCESS',
          message: `Đồng bộ thành công ${insightsList.length} quảng cáo từ Facebook Live API`,
        },
      });

      return { success: true, count: insightsList.length, mode: 'LIVE' };
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      this.logger.error('Lỗi kết nối Facebook Live API (Token có thể đã hết hạn):', errorMsg);
      await this.prisma.syncLog.create({
        data: {
          type: 'ADS',
          status: 'FAILED',
          message: `Lỗi đồng bộ: ${errorMsg}`,
        },
      });
      return { success: false, error: errorMsg, mode: 'FALLBACK_CACHED' };
    }
  }

  private async generateMockAdsData() {
    const mockAccountId = 'act_888999000';
    await this.prisma.adAccount.upsert({
      where: { id: mockAccountId },
      update: { name: 'Tài khoản Ads Doanh Nghiệp (Demo)' },
      create: { id: mockAccountId, name: 'Tài khoản Ads Doanh Nghiệp (Demo)', currency: 'VND' },
    });

    const mockCampaigns = [
      { id: 'camp_001', name: 'Chiến dịch Khuyến Mãi Tháng 10 - Messenger' },
      { id: 'camp_002', name: 'Chiến dịch Lead Form Sản Phẩm Mới' },
    ];

    for (const c of mockCampaigns) {
      await this.prisma.campaign.upsert({
        where: { id: c.id },
        update: { name: c.name },
        create: { id: c.id, name: c.name, status: 'ACTIVE', adAccountId: mockAccountId },
      });
    }

    const mockAdSets = [
      { id: 'adset_101', campaignId: 'camp_001', name: 'Tập Khách Hàng Hà Nội & TP.HCM' },
      { id: 'adset_102', campaignId: 'camp_002', name: 'Tập Khách Hàng Thích Công Nghệ' },
    ];

    for (const s of mockAdSets) {
      await this.prisma.adSet.upsert({
        where: { id: s.id },
        update: { name: s.name },
        create: { id: s.id, name: s.name, status: 'ACTIVE', campaignId: s.campaignId },
      });
    }

    const mockAds = [
      { id: '1202058493012901', adSetId: 'adset_101', name: 'Ad Video Intro Sản phẩm A - Off 20%' },
      { id: '1202058493012902', adSetId: 'adset_101', name: 'Ad Banner Carousel Mẫu Mới 2026' },
      { id: '1202058493012903', adSetId: 'adset_102', name: 'Ad Story Lead Form Nhận Tư Vấn' },
    ];

    for (const a of mockAds) {
      await this.prisma.ad.upsert({
        where: { id: a.id },
        update: { name: a.name },
        create: { id: a.id, name: a.name, status: 'ACTIVE', adSetId: a.adSetId },
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const mockInsights = [
      { adId: '1202058493012901', impressions: 45200, clicks: 1850, spend: 3500000, reach: 38000, messagingConversions: 42, leads: 15 },
      { adId: '1202058493012902', impressions: 28000, clicks: 920, spend: 2100000, reach: 22000, messagingConversions: 25, leads: 8 },
      { adId: '1202058493012903', impressions: 61000, clicks: 2400, spend: 4800000, reach: 50000, messagingConversions: 68, leads: 32 },
    ];

    for (const ins of mockInsights) {
      const ctr = parseFloat(((ins.clicks / ins.impressions) * 100).toFixed(2));
      const cpc = parseFloat((ins.spend / ins.clicks).toFixed(0));

      await this.prisma.adInsight.upsert({
        where: { adId_date: { adId: ins.adId, date: today } },
        update: {
          impressions: ins.impressions,
          clicks: ins.clicks,
          spend: ins.spend,
          cpc: cpc,
          ctr: ctr,
          reach: ins.reach,
          messagingConversions: ins.messagingConversions,
          leads: ins.leads,
        },
        create: {
          adId: ins.adId,
          date: today,
          impressions: ins.impressions,
          clicks: ins.clicks,
          spend: ins.spend,
          cpc: cpc,
          ctr: ctr,
          reach: ins.reach,
          messagingConversions: ins.messagingConversions,
          leads: ins.leads,
        },
      });
    }

    await this.prisma.syncLog.create({
      data: {
        type: 'ADS',
        status: 'SUCCESS',
        message: `Khởi tạo thành công ${mockAds.length} quảng cáo mẫu cho chế độ chạy thử`,
      },
    });

    return { success: true, count: mockAds.length, mode: 'MOCK' };
  }
}
