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
   * Bóc tách tên chiến dịch / AdSet / Ad theo quy ước Naming Convention chuẩn Patado
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

    // 2. Nhận diện Format (Hình thức chạy / Creative Format)
    // Ưu tiên các định dạng sáng tạo nội dung: Video, Ảnh, Carousel, Only Text
    if (upper.includes('CAROUSEL') || upper.includes('BO_SUU_TAP')) {
      result.format = 'Carousel';
    } else if (upper.includes('VIDEO') || upper.includes('VID') || upper.includes('CLIP') || upper.includes('REEL') || upper.includes('REELS') || upper.includes('LIVESTREAM')) {
      result.format = 'Video';
    } else if (upper.includes('IMAGE') || upper.includes('IMAGES') || upper.includes('ANH') || upper.includes('BANNER') || upper.includes('PHOTO') || upper.includes('ALBUM') || upper.includes('HINHANH')) {
      result.format = 'Ảnh';
    } else if (upper.includes('ONLY TEXT') || upper.includes('TEXT') || upper.includes('STATUS') || upper.includes('BAIVIET') || upper.includes('POST')) {
      result.format = 'Only Text';
    } else if (upper.includes('MESS') || upper.includes('MES') || upper.includes('INBOX')) {
      result.format = 'Messenger';
    } else if (upper.includes('CVS') || upper.includes('PURCHASE')) {
      result.format = 'Chuyển Đổi (CVS)';
    } else if (upper.includes('LEAD') || upper.includes('FORM') || upper.includes('LEA')) {
      result.format = 'Lead Form';
    } else {
      result.format = 'Ảnh'; // Mặc định các mẫu quảng cáo thường là ảnh bài post
    }

    // 3. Nhận diện Ngày tháng (ddmmyy - 6 chữ số)
    const dateMatch = cleanName.match(/(\d{6})/);
    if (dateMatch) {
      const rawDate = dateMatch[1];
      result.dateTag = `${rawDate.slice(0, 2)}/${rawDate.slice(2, 4)}/20${rawDate.slice(4, 6)}`;
    }

    // 4. Nhận diện Target / Tập đối tượng theo bảng mã Patado Tracking Code
    // NON / ALL / NO TARGET -> Đại trà (Broad / Không Target)
    // LAL -> Tệp Lookalike (LAL)
    // RMK / RETARGET -> Tiếp thị lại (Remarketing)
    // NEW -> Tệp Sở thích mới (Interest)
    if (upper.includes('RMK') || upper.includes('RETARGET') || upper.includes('RE-TARGET')) {
      result.target = 'Tiếp thị lại (Remarketing)';
    } else if (upper.includes('LAL') || upper.includes('LOOKALIKE')) {
      result.target = 'Lookalike (LAL)';
    } else if (upper.includes('NEW') || upper.includes('TARGETNEW') || upper.includes('INTEREST')) {
      result.target = 'Sở thích mới (Interest)';
    } else if (upper.includes('NO TARGET') || upper.includes('NOTARGET') || upper.includes('NON') || upper.includes('ALL')) {
      result.target = 'Đại trà (No Target)';
    } else if (upper.includes('GIAOTIEP')) {
      result.target = 'Tiếng Anh Giao Tiếp';
    } else if (upper.includes('1840')) {
      result.target = 'Độ tuổi 18-40';
    } else if (upper.includes('EUROPE')) {
      result.target = 'Khu vực Europe';
    } else if (upper.includes('JAPAN')) {
      result.target = 'Khu vực Japan';
    } else {
      result.target = 'Đại trà (No Target)';
    }

    // 5. Nhận diện Marketer / Người phụ trách
    if (upper.includes('TUANTQ') || upper.includes('TUAN')) result.agent = 'Tuấn TQ';
    else if (upper.includes('NAMNH') || upper.includes('NAM')) result.agent = 'Nam NH';
    else if (upper.includes('LINH') || upper.includes('LINHNM')) result.agent = 'Linh NM';
    else if (upper.includes('THANHPT')) result.agent = 'Thanh PT';
    else if (upper.includes('HUYNV') || upper.includes('HUYTC') || upper.includes('HUYLG')) result.agent = 'Huy';
    else result.agent = 'Chung';

    // 6. Nhận diện Content Tag
    const parts = cleanName.split(/[_|\-]+/).map(p => p.trim()).filter(Boolean);
    if (parts.length > 2) {
      result.contentTag = parts[parts.length - 1];
    }

    return result;
  }

  /**
   * Bóc tách riêng cho Mẫu Ads dựa trên tên Ad và Campaign liên quan
   */
  parseAdCreativeFormat(adName: string, campaignFormat?: string): string {
    if (!adName) return campaignFormat || 'Ảnh';
    const upper = adName.toUpperCase();

    if (upper.includes('CAROUSEL') || upper.includes('BO_SUU_TAP')) return 'Carousel';
    if (upper.includes('VIDEO') || upper.includes('VID') || upper.includes('CLIP') || upper.includes('REEL') || upper.includes('REELS') || upper.includes('LIVESTREAM')) return 'Video';
    if (upper.includes('BANNER') || upper.includes('IMAGE') || upper.includes('IMAGES') || upper.includes('ANH') || upper.includes('PHOTO') || upper.includes('ALBUM') || upper.includes('HINHANH')) return 'Ảnh';
    if (upper.includes('ONLY TEXT') || upper.includes('TEXT') || upper.includes('STATUS')) return 'Only Text';

    // Nếu tên Ad không chứa từ khóa creative, kế thừa từ Campaign format hoặc mặc định là Ảnh
    if (campaignFormat === 'Video') return 'Video';
    if (campaignFormat === 'Only Text') return 'Only Text';
    if (campaignFormat === 'Carousel') return 'Carousel';
    return 'Ảnh';
  }
}

