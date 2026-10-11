import { Controller, Get, Post, Query, Body, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { IdentityResolverService } from './identity-resolver.service';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private identityResolver: IdentityResolverService) {}

  /**
   * Endpoint xác minh Webhook của Facebook (Webhook Verification)
   * Facebook gọi GET /webhook với hub.mode, hub.verify_token, hub.challenge
   */
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: any,
  ) {
    const verifyToken = process.env.FB_WEBHOOK_VERIFY_TOKEN || 'marketing_report_secret_token';

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('✅ Facebook Webhook Verified Successfully!');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden: Token mismatch');
  }

  /**
   * Endpoint nhận sự kiện realtime từ Facebook (Click-to-Messenger, Referral, Lead, Chat)
   */
  @Post()
  async handleWebhookPayload(@Body() body: any, @Res() res: any) {
    // Trả 200 OK ngay lập tức theo chuẩn Meta để không bị ngắt kết nối
    res.status(200).send('EVENT_RECEIVED');

    try {
      if (body.object === 'page' && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          const pageId = entry.id;

          // Xử lý sự kiện tin nhắn Messenger
          if (Array.isArray(entry.messaging)) {
            for (const event of entry.messaging) {
              const psid = event.sender?.id;
              const messageText = event.message?.text || '';
              
              // Bắt Referral Ad ID (khi khách click quảng cáo bấm "Gửi tin nhắn")
              const referralAdId = event.referral?.ad_id || event.postback?.referral?.ad_id || null;

              if (psid) {
                await this.identityResolver.resolveAndMapCustomer({
                  adId: referralAdId || 'UNKNOWN_OR_ORGANIC',
                  psid: psid,
                  messageText: messageText,
                  channel: 'MESSENGER',
                  createdTime: new Date(event.timestamp || Date.now()),
                });
                this.logger.log(`📥 Nhận tin nhắn từ PSID ${psid} | Referral Ad ID: ${referralAdId || 'N/A'}`);
              }
            }
          }
        }
      }
    } catch (err) {
      this.logger.error('Lỗi xử lý webhook event:', err.message);
    }
  }
}
