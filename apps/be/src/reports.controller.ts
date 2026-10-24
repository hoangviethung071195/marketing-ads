import { Controller, Get, Post, Body, Res, Query } from '@nestjs/common';
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
  async getSummary(
    @Query('tu_ngay') tuNgay?: string,
    @Query('den_ngay') denNgay?: string,
  ) {
    return await this.reportsService.getSummaryMetrics(tuNgay, denNgay);
  }

  @Get('reports/campaigns')
  async getCampaigns(
    @Query('tu_ngay') tuNgay?: string,
    @Query('den_ngay') denNgay?: string,
  ) {
    return await this.reportsService.getCampaignPerformanceList(tuNgay, denNgay);
  }

  @Get('reports/adsets')
  async getAdSets(
    @Query('tu_ngay') tuNgay?: string,
    @Query('den_ngay') denNgay?: string,
  ) {
    return await this.reportsService.getAdSetPerformanceList(tuNgay, denNgay);
  }

  @Get('reports/ads')
  async getAds(
    @Query('tu_ngay') tuNgay?: string,
    @Query('den_ngay') denNgay?: string,
  ) {
    return await this.reportsService.getAdPerformanceList(tuNgay, denNgay);
  }

  @Get('reports/leads')
  async getLeads(
    @Query('tu_ngay') tuNgay?: string,
    @Query('den_ngay') denNgay?: string,
  ) {
    return await this.reportsService.getMatchedLeadsList(tuNgay, denNgay);
  }

  @Get('reports/sync-logs')
  async getSyncLogs() {
    return await this.reportsService.getSyncLogs();
  }

  @Post('sync/ads')
  async triggerAdsSync() {
    const result = await this.fbAdsService.syncFbAdsData();
    return {
      success: true,
      message: 'Đã hoàn thành đồng bộ dữ liệu Ads!',
      result,
    };
  }

  @Post('sync/all')
  async triggerFullSync() {
    const adsResult = await this.fbAdsService.syncFbAdsData();
    const crmResult = await this.dongaCrmService.syncDongaOrders();
    // Chạy quét messenger nền để không bị timeout HTTP
    this.messengerService.syncMessengerLeads().catch(() => {});
    return {
      success: true,
      message: 'Đã kích hoạt đồng bộ dữ liệu Facebook Ads, CRM và Messenger nền!',
      ads: adsResult,
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
  async getAttribution(
    @Query('tu_ngay') tuNgay?: string,
    @Query('den_ngay') denNgay?: string,
    @Query('model') model?: string,
  ) {
    return await this.attributionEngine.getAdAttributionReport(tuNgay, denNgay, model);
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
