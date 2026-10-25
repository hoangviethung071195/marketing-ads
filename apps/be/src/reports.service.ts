import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TrackingParserService } from './tracking-parser.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private trackingParser: TrackingParserService,
  ) {}

  async getSummaryMetrics(tuNgay?: string, denNgay?: string) {
    const insightWhere: any = {};
    if (tuNgay || denNgay) {
      insightWhere.date = {};
      if (tuNgay) insightWhere.date.gte = tuNgay;
      if (denNgay) insightWhere.date.lte = denNgay;
    }

    const leadWhere: any = {};
    if (tuNgay || denNgay) {
      leadWhere.createdTime = {};
      if (tuNgay) leadWhere.createdTime.gte = new Date(tuNgay);
      if (denNgay) leadWhere.createdTime.lte = new Date(denNgay + 'T23:59:59.999Z');
    }

    const insights = await this.prisma.adInsight.findMany({ where: insightWhere });
    const leads = await this.prisma.customerLead.findMany({ where: leadWhere });

    const totalSpend = insights.reduce((acc, cur) => acc + cur.spend, 0);
    const totalImpressions = insights.reduce((acc, cur) => acc + cur.impressions, 0);
    const totalClicks = insights.reduce((acc, cur) => acc + cur.clicks, 0);
    const totalMessages = insights.reduce((acc, cur) => acc + cur.messagingConversions, 0);
    const totalFormLeads = insights.reduce((acc, cur) => acc + cur.leads, 0);
    const totalMatchedLeads = leads.length;

    const avgCpl = totalMatchedLeads > 0 ? Math.round(totalSpend / totalMatchedLeads) : 0;
    const avgCtr = totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
    const avgCpc = totalClicks > 0 ? Math.round(totalSpend / totalClicks) : 0;

    return {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalMessages,
      totalFormLeads,
      totalMatchedLeads,
      avgCpl,
      avgCtr,
      avgCpc,
    };
  }

  async getAdPerformanceList(tuNgay?: string, denNgay?: string) {
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

    const leadWhere: any = {};
    if (tuNgay || denNgay) {
      leadWhere.createdTime = {};
      if (tuNgay) leadWhere.createdTime.gte = new Date(tuNgay);
      if (denNgay) leadWhere.createdTime.lte = new Date(denNgay + 'T23:59:59.999Z');
    }

    const ads = await this.prisma.ad.findMany({
      include: {
        adSet: { include: { campaign: true } },
        insights: { where: insightWhere },
        matchedLeads: { where: leadWhere },
        orders: { where: orderWhere },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ads.map((ad) => {
      const spend = ad.insights.reduce((sum, cur) => sum + cur.spend, 0);
      const impressions = ad.insights.reduce((sum, cur) => sum + cur.impressions, 0);
      const clicks = ad.insights.reduce((sum, cur) => sum + cur.clicks, 0);
      const messagingConversions = ad.insights.reduce((sum, cur) => sum + cur.messagingConversions, 0);
      const leads = ad.insights.reduce((sum, cur) => sum + cur.leads, 0);
      const ctr = impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0;
      const cpc = clicks > 0 ? Math.round(spend / clicks) : 0;

      const matchedCount = ad.matchedLeads.length;
      const cpl = matchedCount > 0 ? Math.round(spend / matchedCount) : 0;
      const validOrders = ad.orders.filter((o) => o.status !== 'CANCELLED');
      const totalRevenue = validOrders.reduce((sum, o) => sum + o.revenue, 0);
      const roas = spend > 0 ? parseFloat((totalRevenue / spend).toFixed(2)) : 0;

      // Bóc tách động nhãn cho từng mẫu Ad
      const parsedCamp = this.trackingParser.parseCampaignName(ad.adSet?.campaign?.name || '');
      const parsedAdSet = this.trackingParser.parseCampaignName(ad.adSet?.name || '');
      const creativeFormat = this.trackingParser.parseAdCreativeFormat(ad.name, parsedCamp.format);
      const resolvedTarget = (parsedAdSet.target && parsedAdSet.target !== 'Đại trà (No Target)')
        ? parsedAdSet.target
        : (parsedCamp.target || 'Đại trà (No Target)');
      const resolvedBrand = parsedCamp.brand || ad.adSet?.campaign?.brand || 'Khác';

      return {
        id: ad.id,
        name: ad.name,
        status: ad.status,
        campaignName: ad.adSet?.campaign?.name || 'N/A',
        brand: resolvedBrand,
        target: resolvedTarget,
        format: creativeFormat,
        dateTag: parsedCamp.dateTag || ad.adSet?.campaign?.dateTag || '-',
        adSetName: ad.adSet?.name || 'N/A',
        spend,
        impressions,
        clicks,
        ctr,
        cpc,
        messagingConversions,
        leads,
        matchedLeadsCount: matchedCount,
        cpl: cpl,
        orderCount: validOrders.length,
        totalRevenue: totalRevenue,
        roas: roas,
      };
    });
  }

  async getMatchedLeadsList(tuNgay?: string, denNgay?: string) {
    const leadWhere: any = {};
    if (tuNgay || denNgay) {
      leadWhere.createdTime = {};
      if (tuNgay) leadWhere.createdTime.gte = new Date(tuNgay);
      if (denNgay) leadWhere.createdTime.lte = new Date(denNgay + 'T23:59:59.999Z');
    }

    return await this.prisma.customerLead.findMany({
      where: leadWhere,
      include: {
        ad: {
          select: { id: true, name: true },
        },
        orders: true,
      },
      orderBy: { createdTime: 'desc' },
    });
  }

  async getCampaignPerformanceList(tuNgay?: string, denNgay?: string) {
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

    const leadWhere: any = {};
    if (tuNgay || denNgay) {
      leadWhere.createdTime = {};
      if (tuNgay) leadWhere.createdTime.gte = new Date(tuNgay);
      if (denNgay) leadWhere.createdTime.lte = new Date(denNgay + 'T23:59:59.999Z');
    }

    const campaigns = await this.prisma.campaign.findMany({
      include: {
        adSets: {
          include: {
            ads: {
              include: {
                insights: { where: insightWhere },
                matchedLeads: { where: leadWhere },
                orders: { where: orderWhere },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map((camp) => {
      let spend = 0;
      let impressions = 0;
      let clicks = 0;
      let messagingConversions = 0;
      let leads = 0;
      let matchedLeadsCount = 0;
      let totalRevenue = 0;
      let orderCount = 0;

      for (const adset of camp.adSets) {
        for (const ad of adset.ads) {
          const adSpend = ad.insights.reduce((s, cur) => s + (cur.spend || 0), 0);
          const adImpressions = ad.insights.reduce((s, cur) => s + (cur.impressions || 0), 0);
          const adClicks = ad.insights.reduce((s, cur) => s + (cur.clicks || 0), 0);
          const adMessaging = ad.insights.reduce((s, cur) => s + (cur.messagingConversions || 0), 0);
          const adLeads = ad.insights.reduce((s, cur) => s + (cur.leads || 0), 0);

          spend += adSpend;
          impressions += adImpressions;
          clicks += adClicks;
          messagingConversions += adMessaging;
          leads += adLeads;
          matchedLeadsCount += ad.matchedLeads?.length || 0;

          const validOrders = ad.orders?.filter((o) => o.status !== 'CANCELLED') || [];
          orderCount += validOrders.length;
          totalRevenue += validOrders.reduce((s, o) => s + (o.revenue || 0), 0);
        }
      }

      const ctr = impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0;
      const cpc = clicks > 0 ? Math.round(spend / clicks) : 0;
      const cpl = matchedLeadsCount > 0 ? Math.round(spend / matchedLeadsCount) : 0;
      const roas = spend > 0 ? parseFloat((totalRevenue / spend).toFixed(2)) : 0;
      const cpa = orderCount > 0 ? Math.round(spend / orderCount) : 0;

      const parsedCamp = this.trackingParser.parseCampaignName(camp.name || '');

      return {
        id: camp.id,
        name: camp.name,
        status: camp.status,
        brand: parsedCamp.brand || camp.brand || 'Khác',
        target: parsedCamp.target || camp.target || 'Đại trà (No Target)',
        format: parsedCamp.format || camp.format || 'Ảnh',
        dateTag: parsedCamp.dateTag || camp.dateTag || '-',
        adSetCount: camp.adSets.length,
        spend,
        impressions,
        clicks,
        ctr,
        cpc,
        messagingConversions,
        leads,
        matchedLeadsCount,
        cpl,
        orderCount,
        totalRevenue,
        roas,
        cpa,
      };
    });
  }

  async getAdSetPerformanceList(tuNgay?: string, denNgay?: string) {
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

    const leadWhere: any = {};
    if (tuNgay || denNgay) {
      leadWhere.createdTime = {};
      if (tuNgay) leadWhere.createdTime.gte = new Date(tuNgay);
      if (denNgay) leadWhere.createdTime.lte = new Date(denNgay + 'T23:59:59.999Z');
    }

    const adSets = await this.prisma.adSet.findMany({
      include: {
        campaign: true,
        ads: {
          include: {
            insights: { where: insightWhere },
            matchedLeads: { where: leadWhere },
            orders: { where: orderWhere },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return adSets.map((adset) => {
      let spend = 0;
      let impressions = 0;
      let clicks = 0;
      let messagingConversions = 0;
      let leads = 0;
      let matchedLeadsCount = 0;
      let totalRevenue = 0;
      let orderCount = 0;

      for (const ad of adset.ads) {
        const adSpend = ad.insights.reduce((s, cur) => s + (cur.spend || 0), 0);
        const adImpressions = ad.insights.reduce((s, cur) => s + (cur.impressions || 0), 0);
        const adClicks = ad.insights.reduce((s, cur) => s + (cur.clicks || 0), 0);
        const adMessaging = ad.insights.reduce((s, cur) => s + (cur.messagingConversions || 0), 0);
        const adLeads = ad.insights.reduce((s, cur) => s + (cur.leads || 0), 0);

        spend += adSpend;
        impressions += adImpressions;
        clicks += adClicks;
        messagingConversions += adMessaging;
        leads += adLeads;
        matchedLeadsCount += ad.matchedLeads?.length || 0;

        const validOrders = ad.orders?.filter((o) => o.status !== 'CANCELLED') || [];
        orderCount += validOrders.length;
        totalRevenue += validOrders.reduce((s, o) => s + (o.revenue || 0), 0);
      }

      const ctr = impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0;
      const cpc = clicks > 0 ? Math.round(spend / clicks) : 0;
      const cpl = matchedLeadsCount > 0 ? Math.round(spend / matchedLeadsCount) : 0;
      const roas = spend > 0 ? parseFloat((totalRevenue / spend).toFixed(2)) : 0;
      const cpa = orderCount > 0 ? Math.round(spend / orderCount) : 0;

      const parsedCamp = this.trackingParser.parseCampaignName(adset.campaign?.name || '');
      const parsedAdSet = this.trackingParser.parseCampaignName(adset.name || '');
      const resolvedTarget = (parsedAdSet.target && parsedAdSet.target !== 'Đại trà (No Target)')
        ? parsedAdSet.target
        : (parsedCamp.target || 'Đại trà (No Target)');

      return {
        id: adset.id,
        name: adset.name,
        status: adset.status,
        campaignName: adset.campaign?.name || 'N/A',
        brand: parsedCamp.brand || adset.campaign?.brand || 'Khác',
        target: resolvedTarget,
        format: parsedCamp.format || adset.campaign?.format || 'Ảnh',
        adCount: adset.ads.length,
        spend,
        impressions,
        clicks,
        ctr,
        cpc,
        messagingConversions,
        leads,
        matchedLeadsCount,
        cpl,
        orderCount,
        totalRevenue,
        roas,
        cpa,
      };
    });
  }

  async getSyncLogs() {
    return await this.prisma.syncLog.findMany({
      take: 20,
      orderBy: { syncedAt: 'desc' },
    });
  }
}
