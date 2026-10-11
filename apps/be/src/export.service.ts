import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from './prisma.service';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo file Excel báo cáo tổng hợp chi tiết theo Ad ID và Khách hàng
   */
  async generateMarketingReportExcel(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Bizmind Tool Marketing';
    workbook.created = new Date();

    // Font family & style standards
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Dark slate
    };
    const headerFont: Partial<ExcelJS.Font> = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };

    // -------------------------------------------------------------
    // SHEET 1: Báo cáo Tổng quan Quảng cáo & Bóc Tách Naming Convention
    // -------------------------------------------------------------
    const sheet1 = workbook.addWorksheet('Báo Cáo Quảng Cáo Facebook');
    sheet1.columns = [
      { header: 'Mã Ads (Ad ID)', key: 'adId', width: 22 },
      { header: 'Tên Quảng Cáo', key: 'adName', width: 32 },
      { header: 'Chiến Dịch', key: 'campaignName', width: 30 },
      { header: 'Nhãn Hàng (Brand)', key: 'brand', width: 18 },
      { header: 'Mục Tiêu / Target', key: 'target', width: 20 },
      { header: 'Định Dạng (Format)', key: 'format', width: 18 },
      { header: 'Ngày Lên Camp', key: 'dateTag', width: 14 },
      { header: 'Chi Phí (VND)', key: 'spend', width: 18 },
      { header: 'Hiển Thị', key: 'impressions', width: 14 },
      { header: 'Clicks', key: 'clicks', width: 12 },
      { header: 'CTR (%)', key: 'ctr', width: 12 },
      { header: 'Tin Nhắn / Form', key: 'messages', width: 18 },
      { header: 'Khách Khớp SĐT', key: 'matchedLeads', width: 16 },
      { header: 'Số Đơn CRM', key: 'orderCount', width: 14 },
      { header: 'Doanh Thu (VND)', key: 'revenue', width: 20 },
      { header: 'ROAS', key: 'roas', width: 12 },
    ];

    // Style Header Row
    sheet1.getRow(1).height = 28;
    sheet1.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
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

    let totalSpend = 0;
    let totalMessages = 0;
    let totalLeads = 0;
    let totalMatched = 0;
    let totalOrders = 0;
    let totalRevenue = 0;

    for (const ad of ads) {
      const insight = ad.insights[0] || {
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        messagingConversions: 0,
        leads: 0,
      };

      const matchedCount = ad.matchedLeads.length;
      const validOrders = ad.orders.filter((o) => o.status !== 'CANCELLED');
      const adRevenue = validOrders.reduce((sum, o) => sum + o.revenue, 0);
      const roas = insight.spend > 0 ? parseFloat((adRevenue / insight.spend).toFixed(2)) : 0;

      totalSpend += insight.spend;
      totalMessages += insight.messagingConversions;
      totalLeads += insight.leads;
      totalMatched += matchedCount;
      totalOrders += validOrders.length;
      totalRevenue += adRevenue;

      const row = sheet1.addRow({
        adId: ad.id,
        adName: ad.name,
        campaignName: ad.adSet?.campaign?.name || 'N/A',
        brand: ad.adSet?.campaign?.brand || 'Khác',
        target: ad.adSet?.campaign?.target || 'ALL',
        format: ad.adSet?.campaign?.format || 'MESS',
        dateTag: ad.adSet?.campaign?.dateTag || '-',
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

    // Add Summary Row
    const summaryRow = sheet1.addRow({
      adId: 'TỔNG CỘNG',
      adName: '-',
      campaignName: '-',
      brand: '-',
      target: '-',
      format: '-',
      dateTag: '-',
      spend: totalSpend,
      messages: totalMessages,
      matchedLeads: totalMatched,
      orderCount: totalOrders,
      revenue: totalRevenue,
      roas: totalSpend > 0 ? `${(totalRevenue / totalSpend).toFixed(2)}x` : '0x',
    });
    summaryRow.font = { bold: true, name: 'Segoe UI' };
    summaryRow.getCell('spend').numFmt = '#,##0 "VND"';
    summaryRow.getCell('revenue').numFmt = '#,##0 "VND"';

    // -------------------------------------------------------------
    // SHEET 2: Danh sách Khách hàng khớp Ad ID (Customer Leads Matched)
    // -------------------------------------------------------------
    const sheet2 = workbook.addWorksheet('Danh Sách Khách Hàng theo Ad ID');
    sheet2.columns = [
      { header: 'Mã Ad (Ad ID)', key: 'adId', width: 22 },
      { header: 'Tên Quảng Cáo Khớp', key: 'adName', width: 32 },
      { header: 'Họ và Tên Khách Hàng', key: 'customerName', width: 26 },
      { header: 'Số Điện Thoại', key: 'phoneNumber', width: 18 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Kênh Tiếp Cận', key: 'channel', width: 16 },
      { header: 'Ngày Tạo Lead', key: 'createdTime', width: 20 },
      { header: 'Ghi Chú / Nhu Cầu', key: 'notes', width: 35 },
    ];

    sheet2.getRow(1).height = 28;
    sheet2.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Teal color
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const leads = await this.prisma.customerLead.findMany({
      include: { ad: true },
      orderBy: { createdTime: 'desc' },
    });

    for (const lead of leads) {
      const row = sheet2.addRow({
        adId: lead.adId,
        adName: lead.ad?.name || 'N/A',
        customerName: lead.customerName,
        phoneNumber: lead.phoneNumber || 'N/A',
        email: lead.email || 'N/A',
        channel: lead.channel,
        createdTime: new Date(lead.createdTime).toLocaleString('vi-VN'),
        notes: lead.notes || '',
      });
      row.height = 22;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
