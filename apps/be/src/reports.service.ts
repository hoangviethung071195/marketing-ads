import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSummaryMetrics() {
    const insights = await this.prisma.adInsight.findMany();
    const leads = await this.prisma.customerLead.findMany();

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

  async getAdPerformanceList() {
    const ads = await this.prisma.ad.findMany({
      include: {
        adSet: { include: { campaign: true } },
        insights: true,
        matchedLeads: true,
        orders: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return ads.map((ad) => {
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
      const cpl = matchedCount > 0 ? Math.round(insight.spend / matchedCount) : 0;
      const validOrders = ad.orders.filter((o) => o.status !== 'CANCELLED');
      const totalRevenue = validOrders.reduce((sum, o) => sum + o.revenue, 0);
      const roas = insight.spend > 0 ? parseFloat((totalRevenue / insight.spend).toFixed(2)) : 0;

      return {
        id: ad.id,
        name: ad.name,
        status: ad.status,
        campaignName: ad.adSet?.campaign?.name || 'N/A',
        brand: ad.adSet?.campaign?.brand || 'Khác',
        target: ad.adSet?.campaign?.target || 'ALL',
        format: ad.adSet?.campaign?.format || 'MESS',
        dateTag: ad.adSet?.campaign?.dateTag || '-',
        adSetName: ad.adSet?.name || 'N/A',
        spend: insight.spend,
        impressions: insight.impressions,
        clicks: insight.clicks,
        ctr: insight.ctr,
        cpc: insight.cpc,
        messagingConversions: insight.messagingConversions,
        leads: insight.leads,
        matchedLeadsCount: matchedCount,
        cpl: cpl,
        orderCount: validOrders.length,
        totalRevenue: totalRevenue,
        roas: roas,
      };
    });
  }

  async getMatchedLeadsList() {
    return await this.prisma.customerLead.findMany({
      include: {
        ad: {
          select: { id: true, name: true },
        },
        orders: true,
      },
      orderBy: { createdTime: 'desc' },
    });
  }

  async getCampaignPerformanceList() {
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
          const insight = ad.insights[0] || { spend: 0, impressions: 0, clicks: 0, messagingConversions: 0, leads: 0 };
          spend += insight.spend || 0;
          impressions += insight.impressions || 0;
          clicks += insight.clicks || 0;
          messagingConversions += insight.messagingConversions || 0;
          leads += insight.leads || 0;
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

      return {
        id: camp.id,
        name: camp.name,
        status: camp.status,
        brand: camp.brand || 'Khác',
        target: camp.target || 'ALL',
        format: camp.format || 'MESS',
        dateTag: camp.dateTag || '-',
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

  async getAdSetPerformanceList() {
    const adSets = await this.prisma.adSet.findMany({
      include: {
        campaign: true,
        ads: {
          include: {
            insights: true,
            matchedLeads: true,
            orders: true,
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
        const insight = ad.insights[0] || { spend: 0, impressions: 0, clicks: 0, messagingConversions: 0, leads: 0 };
        spend += insight.spend || 0;
        impressions += insight.impressions || 0;
        clicks += insight.clicks || 0;
        messagingConversions += insight.messagingConversions || 0;
        leads += insight.leads || 0;
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

      return {
        id: adset.id,
        name: adset.name,
        status: adset.status,
        campaignName: adset.campaign?.name || 'N/A',
        brand: adset.campaign?.brand || 'Khác',
        target: adset.campaign?.target || 'ALL',
        format: adset.campaign?.format || 'MESS',
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
