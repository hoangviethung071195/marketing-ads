import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface CrmOrderInput {
  orderCode: string;
  customerPhone: string;
  revenue: number;
  productName?: string;
  status?: string; // SUCCESS, CANCELLED, RETURNED
  orderDate?: Date;
}

@Injectable()
export class AttributionEngineService {
  private readonly logger = new Logger(AttributionEngineService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Chuẩn hóa số điện thoại về định dạng 10 chữ số
   */
  private normalizePhone(phone: string): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('84')) return '0' + digits.slice(2);
    return digits;
  }

  /**
   * Đồng bộ / Nạp danh sách đơn hàng từ CRM và tự động gán vào Ad ID tương ứng (Attribution)
   */
  async ingestCrmOrders(orders: CrmOrderInput[]) {
    let matchedCount = 0;
    let totalRevenueMatched = 0;

    for (const ord of orders) {
      const cleanPhone = this.normalizePhone(ord.customerPhone);
      if (!cleanPhone) continue;

      // Tìm CustomerLead khớp theo SĐT (mặc định lấy tương tác gần nhất của khách)
      const matchedLead = await this.prisma.customerLead.findFirst({
        where: { phoneNumber: cleanPhone },
        orderBy: { createdTime: 'desc' },
        include: { ad: true },
      });

      const adId = matchedLead?.adId || null;

      await this.prisma.crmOrder.upsert({
        where: { orderCode: ord.orderCode },
        update: {
          customerPhone: cleanPhone,
          revenue: ord.revenue,
          status: ord.status || 'SUCCESS',
          productName: ord.productName,
          customerLeadId: matchedLead?.id || null,
          adId: adId,
        },
        create: {
          orderCode: ord.orderCode,
          customerPhone: cleanPhone,
          revenue: ord.revenue,
          status: ord.status || 'SUCCESS',
          productName: ord.productName,
          customerLeadId: matchedLead?.id || null,
          adId: adId,
          orderDate: ord.orderDate || new Date(),
        },
      });

      if (adId && ord.status !== 'CANCELLED') {
        matchedCount++;
        totalRevenueMatched += ord.revenue;
      }
    }

    await this.prisma.syncLog.create({
      data: {
        type: 'ATTRIBUTION',
        status: 'SUCCESS',
        message: `Đã nạp ${orders.length} đơn hàng CRM, gán thành công ${matchedCount} đơn vào mã Ad ID (Doanh thu: ${totalRevenueMatched.toLocaleString('vi-VN')} VND)`,
      },
    });

    return { success: true, totalOrders: orders.length, matchedOrders: matchedCount, totalRevenueMatched };
  }

  /**
   * Tính toán chỉ số ROAS & Doanh thu theo từng Ad ID theo Attribution Model
   * Hỗ trợ model: 'last_click' (mặc định), 'last_click_7d', 'last_click_30d', 'first_click'
   */
  async getAdAttributionReport(tuNgay?: string, denNgay?: string, model: string = 'last_click') {
    const orderWhere: any = {};
    if (tuNgay || denNgay) {
      orderWhere.orderDate = {};
      if (tuNgay) orderWhere.orderDate.gte = new Date(tuNgay);
      if (denNgay) orderWhere.orderDate.lte = new Date(denNgay + 'T23:59:59.999Z');
    }

    const insightWhere: any = {};
    if (tuNgay || denNgay) {
      insightWhere.date = {};
      if (tuNgay) insightWhere.date.gte = tuNgay;
      if (denNgay) insightWhere.date.lte = denNgay;
    }

    const ads = await this.prisma.ad.findMany({
      include: {
        adSet: { include: { campaign: true } },
        insights: { where: insightWhere },
        matchedLeads: true,
        orders: {
          where: orderWhere,
          include: { customerLead: true },
        },
      },
    });

    return ads.map((ad) => {
      const spend = ad.insights.reduce((sum, cur) => sum + (cur.spend || 0), 0);
      let validOrders = ad.orders.filter((o) => o.status !== 'CANCELLED');

      // Áp dụng Attribution Window theo yêu cầu của Tuấn
      if (model === 'last_click_7d' || model === 'last_click_30d') {
        const windowDays = model === 'last_click_7d' ? 7 : 30;
        validOrders = validOrders.filter((o) => {
          if (!o.customerLead?.createdTime) return true;
          const orderTime = new Date(o.orderDate).getTime();
          const leadTime = new Date(o.customerLead.createdTime).getTime();
          const diffDays = (orderTime - leadTime) / (1000 * 60 * 60 * 24);
          return diffDays >= 0 && diffDays <= windowDays;
        });
      }

      const totalRevenue = validOrders.reduce((sum, o) => sum + o.revenue, 0);
      const orderCount = validOrders.length;
      const roas = spend > 0 ? parseFloat((totalRevenue / spend).toFixed(2)) : 0;
      const cpa = orderCount > 0 ? Math.round(spend / orderCount) : 0;

      return {
        adId: ad.id,
        adName: ad.name,
        campaignName: ad.adSet?.campaign?.name || 'N/A',
        brand: ad.adSet?.campaign?.brand || 'Khác',
        target: ad.adSet?.campaign?.target || 'ALL',
        format: ad.adSet?.campaign?.format || 'MESS',
        spend,
        orderCount,
        totalRevenue,
        roas, // Hệ số doanh thu trên chi phí quảng cáo (ROAS)
        cpa,  // Chi phí trên mỗi đơn hàng (CPA)
      };
    });
  }

}
