import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from './prisma.service';
import { TrackingParserService } from './tracking-parser.service';

@Injectable()
export class ExportService {
  constructor(
    private prisma: PrismaService,
    private trackingParser: TrackingParserService,
  ) {}

  /**
   * Tạo file Excel báo cáo tổng hợp 3 Sheet: Campaign, Ads và Khách hàng
   */
  async generateMarketingReportExcel(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Bizmind Tool Marketing';
    workbook.created = new Date();

    const headerFillNavy: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Dark slate
    };
    const headerFillTeal: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F766E' }, // Teal
    };
    const headerFillIndigo: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF312E81' }, // Indigo
    };

    const headerFont: Partial<ExcelJS.Font> = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };

    // -------------------------------------------------------------
    // SHEET 1: Báo cáo Theo Chiến Dịch (Campaigns Level)
    // -------------------------------------------------------------
    const sheetCamp = workbook.addWorksheet('Báo Cáo Theo Chiến Dịch');
    sheetCamp.columns = [
      { header: 'Mã Chiến Dịch', key: 'id', width: 24 },
      { header: 'Tên Chiến Dịch', key: 'name', width: 34 },
      { header: 'Nhãn Hàng', key: 'brand', width: 16 },
      { header: 'Định Dạng', key: 'format', width: 16 },
      { header: 'Target', key: 'target', width: 20 },
      { header: 'Số Nhóm (AdSets)', key: 'adSetCount', width: 16 },
      { header: 'Chi Phí (VND)', key: 'spend', width: 18 },
      { header: 'Hiển Thị', key: 'impressions', width: 14 },
      { header: 'Clicks', key: 'clicks', width: 12 },
      { header: 'CTR (%)', key: 'ctr', width: 12 },
      { header: 'Tin Nhắn', key: 'messages', width: 14 },
      { header: 'Khách Khớp SĐT', key: 'matchedLeads', width: 16 },
      { header: 'Số Đơn CRM', key: 'orderCount', width: 14 },
      { header: 'Doanh Thu (VND)', key: 'revenue', width: 20 },
      { header: 'ROAS', key: 'roas', width: 12 },
    ];

    sheetCamp.getRow(1).height = 28;
    sheetCamp.getRow(1).eachCell((cell) => {
      cell.fill = headerFillIndigo;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const campaigns = await this.prisma.campaign.findMany({
      include: {
        adSets: {
          include: {
            ads: {
              include: {
                insights: true,
                matchedLeads: true,
                orders: true,
              },
            },
          },
        },
      },
    });

    let totalCampSpend = 0;
    let totalCampOrders = 0;
    let totalCampRevenue = 0;

    for (const camp of campaigns) {
      let spend = 0;
      let impressions = 0;
      let clicks = 0;
      let messagingConversions = 0;
      let matchedLeadsCount = 0;
      let totalRevenue = 0;
      let orderCount = 0;

      for (const adset of camp.adSets) {
        for (const ad of adset.ads) {
          const insight = ad.insights[0] || { spend: 0, impressions: 0, clicks: 0, messagingConversions: 0 };
          spend += insight.spend || 0;
          impressions += insight.impressions || 0;
          clicks += insight.clicks || 0;
          messagingConversions += insight.messagingConversions || 0;
          matchedLeadsCount += ad.matchedLeads?.length || 0;

          const validOrders = ad.orders?.filter((o) => o.status !== 'CANCELLED') || [];
          orderCount += validOrders.length;
          totalRevenue += validOrders.reduce((s, o) => s + (o.revenue || 0), 0);
        }
      }

      const ctr = impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0;
      const roas = spend > 0 ? parseFloat((totalRevenue / spend).toFixed(2)) : 0;

      totalCampSpend += spend;
      totalCampOrders += orderCount;
      totalCampRevenue += totalRevenue;

      const parsedCamp = this.trackingParser.parseCampaignName(camp.name || '');

      const r = sheetCamp.addRow({
        id: camp.id,
        name: camp.name,
        brand: parsedCamp.brand || camp.brand || 'Khác',
        format: parsedCamp.format || camp.format || 'Ảnh',
        target: parsedCamp.target || camp.target || 'Đại trà (No Target)',
        adSetCount: camp.adSets.length,
        spend,
        impressions,
        clicks,
        ctr: `${ctr}%`,
        messages: messagingConversions,
        matchedLeads: matchedLeadsCount,
        orderCount,
        revenue: totalRevenue,
        roas: roas > 0 ? `${roas}x` : '0x',
      });
      r.height = 22;
      r.getCell('spend').numFmt = '#,##0 "VND"';
      r.getCell('revenue').numFmt = '#,##0 "VND"';
    }

    // -------------------------------------------------------------
    // SHEET 2: Báo cáo Chi Tiết Mẫu Ads & Content
    // -------------------------------------------------------------
    const sheetAds = workbook.addWorksheet('Báo Cáo Chi Tiết Quảng Cáo');
    sheetAds.columns = [
      { header: 'Mã Ads (Ad ID)', key: 'adId', width: 22 },
      { header: 'Tên Quảng Cáo', key: 'adName', width: 32 },
      { header: 'Chiến Dịch', key: 'campaignName', width: 30 },
      { header: 'Nhãn Hàng', key: 'brand', width: 16 },
      { header: 'Mục Tiêu', key: 'target', width: 18 },
      { header: 'Định Dạng', key: 'format', width: 16 },
      { header: 'Chi Phí (VND)', key: 'spend', width: 18 },
      { header: 'Hiển Thị', key: 'impressions', width: 14 },
      { header: 'Clicks', key: 'clicks', width: 12 },
      { header: 'CTR (%)', key: 'ctr', width: 12 },
      { header: 'Tin Nhắn', key: 'messages', width: 14 },
      { header: 'Khách Khớp SĐT', key: 'matchedLeads', width: 16 },
      { header: 'Số Đơn CRM', key: 'orderCount', width: 14 },
      { header: 'Doanh Thu Thật', key: 'revenue', width: 20 },
      { header: 'ROAS Thật', key: 'roas', width: 12 },
    ];

    sheetAds.getRow(1).height = 28;
    sheetAds.getRow(1).eachCell((cell) => {
      cell.fill = headerFillNavy;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const ads = await this.prisma.ad.findMany({
      include: {
        adSet: { include: { campaign: true } },
        insights: true,
        matchedLeads: true,
        orders: true,
      },
    });

    for (const ad of ads) {
      const insight = ad.insights[0] || {
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        messagingConversions: 0,
      };

      const matchedCount = ad.matchedLeads.length;
      const validOrders = ad.orders.filter((o) => o.status !== 'CANCELLED');
      const adRevenue = validOrders.reduce((sum, o) => sum + o.revenue, 0);
      const roas = insight.spend > 0 ? parseFloat((adRevenue / insight.spend).toFixed(2)) : 0;

      const parsedCamp = this.trackingParser.parseCampaignName(ad.adSet?.campaign?.name || '');
      const parsedAdSet = this.trackingParser.parseCampaignName(ad.adSet?.name || '');
      const creativeFormat = this.trackingParser.parseAdCreativeFormat(ad.name, parsedCamp.format);
      const resolvedTarget = (parsedAdSet.target && parsedAdSet.target !== 'Đại trà (No Target)')
        ? parsedAdSet.target
        : (parsedCamp.target || 'Đại trà (No Target)');

      const row = sheetAds.addRow({
        adId: ad.id,
        adName: ad.name,
        campaignName: ad.adSet?.campaign?.name || 'N/A',
        brand: parsedCamp.brand || ad.adSet?.campaign?.brand || 'Khác',
        target: resolvedTarget,
        format: creativeFormat,
        spend: insight.spend,
        impressions: insight.impressions,
        clicks: insight.clicks,
        ctr: `${insight.ctr}%`,
        messages: insight.messagingConversions,
        matchedLeads: matchedCount,
        orderCount: validOrders.length,
        revenue: adRevenue,
        roas: roas > 0 ? `${roas}x` : '0x',
      });

      row.height = 22;
      row.getCell('spend').numFmt = '#,##0 "VND"';
      row.getCell('revenue').numFmt = '#,##0 "VND"';
    }

    // -------------------------------------------------------------
    // SHEET 3: Danh Sách Khách Hàng Khớp Số Điện Thoại & Đơn Hàng CRM
    // -------------------------------------------------------------
    const sheetLeads = workbook.addWorksheet('Khách Hàng Khớp SĐT & CRM');
    sheetLeads.columns = [
      { header: 'Mã Ad ID Khớp', key: 'adId', width: 22 },
      { header: 'Tên Quảng Cáo Khớp', key: 'adName', width: 32 },
      { header: 'Họ Tên Khách Hàng', key: 'customerName', width: 26 },
      { header: 'Số Điện Thoại', key: 'phoneNumber', width: 18 },
      { header: 'Kênh Tiếp Cận', key: 'channel', width: 16 },
      { header: 'Thời Gian Nhắn', key: 'createdTime', width: 20 },
      { header: 'Số Đơn Chốt CRM', key: 'orderCount', width: 16 },
      { header: 'Tổng Doanh Thu (VND)', key: 'revenue', width: 22 },
    ];

    sheetLeads.getRow(1).height = 28;
    sheetLeads.getRow(1).eachCell((cell) => {
      cell.fill = headerFillTeal;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const leads = await this.prisma.customerLead.findMany({
      include: { ad: true, orders: true },
      orderBy: { createdTime: 'desc' },
    });

    for (const lead of leads) {
      const validOrders = lead.orders?.filter((o) => o.status !== 'CANCELLED') || [];
      const leadRevenue = validOrders.reduce((sum, o) => sum + o.revenue, 0);

      const row = sheetLeads.addRow({
        adId: lead.adId,
        adName: lead.ad?.name || 'N/A',
        customerName: lead.customerName,
        phoneNumber: lead.phoneNumber || 'N/A',
        channel: lead.channel,
        createdTime: new Date(lead.createdTime).toLocaleString('vi-VN'),
        orderCount: validOrders.length,
        revenue: leadRevenue,
      });
      row.height = 22;
      row.getCell('revenue').numFmt = '#,##0 "VND"';
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
