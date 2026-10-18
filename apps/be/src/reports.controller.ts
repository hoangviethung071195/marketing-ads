import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { FbAdsService } from './fb-ads.service';
import { MessengerService } from './messenger.service';
import { ExportService } from './export.service';
import { AttributionEngineService } from './attribution-engine.service';
import { DongaCrmService } from './donga-crm.service';

@Controller('api')
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private fbAdsService: FbAdsService,
    private messengerService: MessengerService,
    private exportService: ExportService,
    private attributionEngine: AttributionEngineService,
    private dongaCrmService: DongaCrmService,
  ) {}

  @Get('reports/summary')
  async getSummary() {
    return await this.reportsService.getSummaryMetrics();
  }

  @Get('reports/campaigns')
  async getCampaigns() {
    return await this.reportsService.getCampaignPerformanceList();
  }

  @Get('reports/adsets')
  async getAdSets() {
    return await this.reportsService.getAdSetPerformanceList();
  }

  @Get('reports/ads')
  async getAds() {
    return await this.reportsService.getAdPerformanceList();
  }

  @Get('reports/leads')
  async getLeads() {
    return await this.reportsService.getMatchedLeadsList();
  }

  @Get('reports/sync-logs')
  async getSyncLogs() {
    return await this.reportsService.getSyncLogs();
  }

  @Post('sync/all')
  async triggerFullSync() {
    const adsResult = await this.fbAdsService.syncFbAdsData();
    const messengerResult = await this.messengerService.syncMessengerLeads();
    const crmResult = await this.dongaCrmService.syncDongaOrders();
    return {
      success: true,
      message: 'Đã hoàn thành kích hoạt đồng bộ dữ liệu Facebook Ads, Messenger và Đơn hàng Đông Á',
      ads: adsResult,
      messenger: messengerResult,
      crm: crmResult,
    };
  }

  @Post('sync/crm')
  async triggerCrmSync() {
    const result = await this.dongaCrmService.syncDongaOrders();
    return {
      success: true,
      message: 'Đã hoàn thành đồng bộ đơn hàng từ Hệ thống Quản trị Đông Á!',
      result,
    };
  }

  @Get('reports/attribution')
  async getAttribution() {
    return await this.attributionEngine.getAdAttributionReport();
  }

  @Post('crm/orders')
  async ingestOrders(@Body() orders: any[]) {
    return await this.attributionEngine.ingestCrmOrders(orders);
  }


  @Get('export/excel')
  async downloadExcelReport(@Res() res: any) {
    const buffer = await this.exportService.generateMarketingReportExcel();
    
    const filename = `FB_Ads_Marketing_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
