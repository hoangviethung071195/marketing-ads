import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { FbAdsService } from './fb-ads.service';
import { MessengerService } from './messenger.service';
import { AttributionEngineService } from './attribution-engine.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 Marketing Tool Backend running on: http://localhost:${port}`);

  // Run initial sync on startup
  try {
    const fbAdsService = app.get(FbAdsService);
    const messengerService = app.get(MessengerService);
    const attributionEngine = app.get(AttributionEngineService);

    await fbAdsService.syncFbAdsData();
    await messengerService.syncMessengerLeads();
    await attributionEngine.seedSampleCrmOrders();
    logger.log('✅ Khởi tạo đồng bộ dữ liệu Ads, Khớp SĐT & Doanh thu CRM ban đầu thành công!');
  } catch (err) {
    logger.warn(`Lỗi đồng bộ ban đầu: ${err.message}`);
  }
}
bootstrap();
