import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { FbAdsService } from './fb-ads.service';
import { MessengerService } from './messenger.service';
import { AttributionEngineService } from './attribution-engine.service';
import { DongaCrmService } from './donga-crm.service';

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
    const dongaCrmService = app.get(DongaCrmService);

    await fbAdsService.syncFbAdsData();
    await messengerService.syncMessengerLeads();
    await dongaCrmService.syncDongaOrders();
    logger.log('✅ Khởi tạo đồng bộ dữ liệu Ads, Messenger & Đơn hàng Đông Á ban đầu thành công!');
  } catch (err) {
    logger.warn(`Lỗi đồng bộ ban đầu: ${err.message}`);
  }
}
bootstrap();
