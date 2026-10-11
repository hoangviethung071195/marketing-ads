import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class IdentityResolverService {
  private readonly logger = new Logger(IdentityResolverService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Trích xuất và chuẩn hóa số điện thoại Việt Nam từ văn bản bất kỳ
   * Hỗ trợ các định dạng:
   * 0987654321, 0987.654.321, 0987 654 321, +84987654321, 84987654321
   * Chuẩn hóa về E.164 (VD: 84987654321) và dạng nội địa (0987654321)
   */
  extractPhoneNumbers(text: string): { e164: string; national: string }[] {
    if (!text) return [];

    // 1. Loại bỏ các URL để tránh nhầm ID bài viết / comment với SĐT
    const cleanText = text.replace(/https?:\/\/[^\s]+/g, '');

    // 2. Regex quét SĐT Việt Nam: bắt đầu bằng 0 hoặc 84 hoặc +84, theo sau là 3, 5, 7, 8, 9 và 8 chữ số
    const phoneRegex = /(?:(?:\+?84)|0)(?:3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}\b/g;
    const matches = cleanText.match(phoneRegex) || [];

    const results: { e164: string; national: string }[] = [];
    for (const raw of matches) {
      const digitsOnly = raw.replace(/\D/g, '');
      let national = '';
      let e164 = '';

      if (digitsOnly.startsWith('84')) {
        e164 = digitsOnly;
        national = '0' + digitsOnly.slice(2);
      } else if (digitsOnly.startsWith('0')) {
        national = digitsOnly;
        e164 = '84' + digitsOnly.slice(1);
      }

      if (national.length === 10) {
        results.push({ e164, national });
      }
    }

    return results;
  }

  /**
   * Lưu hoặc cập nhật CustomerLead dựa trên PSID và SĐT bóc tách
   */
  async resolveAndMapCustomer(params: {
    adId: string;
    psid?: string;
    customerName?: string;
    messageText?: string;
    channel?: string;
    createdTime?: Date;
  }) {
    const { adId, psid, customerName = 'Khách hàng Messenger', messageText = '', channel = 'MESSENGER', createdTime = new Date() } = params;

    const phones = this.extractPhoneNumbers(messageText);
    const primaryPhone = phones[0]?.national || null;
    const e164Phone = phones[0]?.e164 || null;

    // Tìm xem khách đã có theo PSID hoặc SĐT chưa
    let existingLead: any = null;
    if (psid) {
      existingLead = await this.prisma.customerLead.findFirst({
        where: { psid },
      });
    }

    if (!existingLead && primaryPhone) {
      existingLead = await this.prisma.customerLead.findFirst({
        where: { phoneNumber: primaryPhone },
      });
    }

    if (existingLead) {
      // Cập nhật SĐT nếu phát hiện mới
      return await this.prisma.customerLead.update({
        where: { id: existingLead.id },
        data: {
          adId,
          phoneNumber: existingLead.phoneNumber || primaryPhone,
          rawPhone: primaryPhone || existingLead.rawPhone,
          notes: messageText ? `${existingLead.notes || ''}\n[${createdTime.toISOString().slice(0, 10)}] ${messageText}`.trim() : existingLead.notes,
        },
      });
    } else {
      // Tạo Lead mới
      return await this.prisma.customerLead.create({
        data: {
          adId,
          psid,
          customerName,
          phoneNumber: primaryPhone,
          rawPhone: primaryPhone,
          channel,
          createdTime,
          notes: messageText ? `Tin nhắn: "${messageText}"` : undefined,
        },
      });
    }
  }
}
