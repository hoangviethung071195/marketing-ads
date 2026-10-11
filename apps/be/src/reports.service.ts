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

  async getSyncLogs() {
    return await this.prisma.syncLog.findMany({
      take: 15,
      orderBy: { syncedAt: 'desc' },
    });
  }
}
