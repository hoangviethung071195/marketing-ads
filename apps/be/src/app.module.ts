import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
import { FbAdsService } from './fb-ads.service';
import { MessengerService } from './messenger.service';
import { ExportService } from './export.service';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TrackingParserService } from './tracking-parser.service';
import { IdentityResolverService } from './identity-resolver.service';
import { AttributionEngineService } from './attribution-engine.service';
import { WebhookController } from './webhook.controller';

import { OnApplicationBootstrap, Logger } from '@nestjs/common';
import { DongaCrmService } from './donga-crm.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [ReportsController, WebhookController],
  providers: [
    PrismaService,
    TrackingParserService,
    IdentityResolverService,
    AttributionEngineService,
    DongaCrmService,
    FbAdsService,
    MessengerService,
    ExportService,
    ReportsService,
  ],
})
export class AppModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppModule.name);

  constructor(
    private prisma: PrismaService,
    private fbAdsService: FbAdsService,
    private messengerService: MessengerService,
    private dongaCrmService: DongaCrmService,
  ) {}

  async onApplicationBootstrap() {
    // Chạy ngầm sau khi server đã lắng nghe cổng để không bị chậm khởi động
    setTimeout(async () => {
      try {
        const leadCount = await this.prisma.customerLead.count();
        if (leadCount === 0) {
          this.logger.log('🌱 Phát hiện cơ sở dữ liệu chưa có Khách hàng Leads. Đang tự động nạp Ads, Quét Messenger và Đối soát CRM...');
          await this.fbAdsService.syncFbAdsData();
          await this.messengerService.syncMessengerLeads();
          await this.dongaCrmService.syncDongaOrders();
          this.logger.log('✅ Khởi tạo và khớp nối dữ liệu Ads ↔ Khách Messenger ↔ Đơn hàng CRM thành công!');
        } else {
          // Nếu đã có leads nhưng chưa đối soát CRM đơn hàng, tự động kích hoạt đối soát
          const matchedOrders = await this.prisma.crmOrder.count({
            where: { customerLeadId: { not: null } },
          });
          if (matchedOrders === 0) {
            this.logger.log('🔄 Đã có Leads nhưng chưa có liên kết Đơn hàng CRM. Đang tự động đối soát CRM...');
            await this.dongaCrmService.syncDongaOrders();
          }
        }
      } catch (err) {
        this.logger.error(`Lỗi khi tự động khởi tạo dữ liệu ban đầu: ${err.message}`);
      }
    }, 2000);
  }
}
