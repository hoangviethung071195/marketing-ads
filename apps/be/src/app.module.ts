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
export class AppModule {}
