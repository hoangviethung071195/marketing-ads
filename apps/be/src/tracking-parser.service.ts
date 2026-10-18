import { Injectable, Logger } from '@nestjs/common';

export interface ParsedNamingTags {
  brand?: string;       // Nhãn hàng: SMEG, WMF, MEGASUN, DONGA...
  target?: string;      // Mục tiêu / Tập: giaotiep, LAL, 1840...
  format?: string;      // Định dạng: MESS, CVS, VIDEO, POST...
  dateTag?: string;     // Ngày tạo: 091026, 031026...
  agent?: string;       // Marketer chạy: Tuấn TQ, Nam NH, Linh...
  contentTag?: string;  // Nhãn content / angle
}

@Injectable()
export class TrackingParserService {
  private readonly logger = new Logger(TrackingParserService.name);

  /**
   * Bóc tách tên chiến dịch / AdSet / Ad theo quy ước Naming Convention Ver 2
   */
  parseCampaignName(name: string): ParsedNamingTags {
    if (!name) return {};

    const cleanName = name.trim();
    const result: ParsedNamingTags = {};
    const upper = cleanName.toUpperCase();

    // 1. Nhận diện Brand
    if (upper.includes('SMEG')) result.brand = 'Smeg';
    else if (upper.includes('WMF')) result.brand = 'WMF';
    else if (upper.includes('MEGASUN')) result.brand = 'Megasun';
    else if (upper.includes('DONGA') || upper.includes('DONG A') || upper.includes('ĐÔNG Á')) result.brand = 'Đông Á';
    else if (upper.includes('GIAOTIEP') || upper.includes('PATADO')) result.brand = 'Patado';
    else if (upper.includes('MICHEANGELO') || upper.includes('MICHELANGELO')) result.brand = 'Michelangelo';
    else {
      const parts = cleanName.split(/[_.\s-]+/);
      if (parts.length > 0 && parts[0] !== 'DAH' && parts[0] !== 'BRAND') result.brand = parts[0];
      else result.brand = 'Khác';
    }

    // 2. Nhận diện Format (Hình thức chạy)
    if (upper.includes('MESS') || upper.includes('MES') || upper.includes('INBOX')) result.format = 'Messenger';
    else if (upper.includes('VIDEO')) result.format = 'Video';
    else if (upper.includes('CVS') || upper.includes('PURCHASE')) result.format = 'Chuyển Đổi (CVS)';
    else if (upper.includes('LEAD') || upper.includes('FORM')) result.format = 'Lead Form';
    else if (upper.includes('POST') || upper.includes('BAIVIET') || upper.includes('LLTT')) result.format = 'Bài Viết';
    else result.format = 'Khác';

    // 3. Nhận diện Ngày tháng (ddmmyy - 6 chữ số)
    const dateMatch = cleanName.match(/(\d{6})/);
    if (dateMatch) {
      const rawDate = dateMatch[1];
      result.dateTag = `${rawDate.slice(0, 2)}/${rawDate.slice(2, 4)}/20${rawDate.slice(4, 6)}`;
    }

    // 4. Nhận diện Target / Tập đối tượng
    if (upper.includes('LAL')) result.target = 'Lookalike (LAL)';
    else if (upper.includes('GIAOTIEP')) result.target = 'Tiếng Anh Giao Tiếp';
    else if (upper.includes('1840')) result.target = 'Độ tuổi 18-40';
    else if (upper.includes('EUROPE')) result.target = 'Khu vực Europe';
    else if (upper.includes('JAPAN')) result.target = 'Khu vực Japan';
    else result.target = 'Đại trà (ALL)';

    // 5. Nhận diện Marketer / Người phụ trách
    if (upper.includes('TUANTQ') || upper.includes('TUAN')) result.agent = 'Tuấn TQ';
    else if (upper.includes('NAMNH') || upper.includes('NAM')) result.agent = 'Nam NH';
    else if (upper.includes('LINH') || upper.includes('LINHNM')) result.agent = 'Linh NM';
    else result.agent = 'Chung';

    // 6. Nhận diện Content Tag
    const parts = cleanName.split(/[_|\-]+/).map(p => p.trim()).filter(Boolean);
    if (parts.length > 2) {
      result.contentTag = parts[parts.length - 1];
    }

    return result;
  }
}

