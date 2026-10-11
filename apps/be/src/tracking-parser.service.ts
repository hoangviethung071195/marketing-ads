import { Injectable, Logger } from '@nestjs/common';

export interface ParsedNamingTags {
  brand?: string;       // Nhãn hàng: SMEG, WMF, MEGASUN, DONGA...
  target?: string;      // Mục tiêu / Tập: giaotiep, LAL, 1840...
  format?: string;      // Định dạng: MESS, CVS, VIDEO, POST...
  dateTag?: string;     // Ngày tạo: 091026, 031026...
  agent?: string;       // Nhân sự chạy: TuanTQ, NamNH...
}

@Injectable()
export class TrackingParserService {
  private readonly logger = new Logger(TrackingParserService.name);

  /**
   * Bóc tách tên chiến dịch / AdSet / Ad theo quy ước Naming Convention
   * Ví dụ:
   * - DAH_FA_ML_Smeg_091026_Mess_3 -> Brand: Smeg, Date: 091026, Format: Mess
   * - SMEG_TuanTQ_MESS_DATHGHD -> Brand: SMEG, Agent: TuanTQ, Format: MESS
   * - DAH_FA_ML_Kho WMF_031026_Mess_1 -> Brand: WMF, Date: 031026, Format: Mess
   * - BRAND_DONGA_VIDEO_DongA -> Brand: DONGA, Format: VIDEO
   * - ALL.giaotiep.M748xM749_16917_MES_NamNH_021026 -> Target: giaotiep, Format: MES, Agent: NamNH, Date: 021026
   */
  parseCampaignName(name: string): ParsedNamingTags {
    if (!name) return {};

    const cleanName = name.trim();
    const result: ParsedNamingTags = {};

    // 1. Nhận diện Brand
    const upper = cleanName.toUpperCase();
    if (upper.includes('SMEG')) result.brand = 'Smeg';
    else if (upper.includes('WMF')) result.brand = 'WMF';
    else if (upper.includes('MEGASUN')) result.brand = 'Megasun';
    else if (upper.includes('DONGA') || upper.includes('DONG A')) result.brand = 'Đông Á';
    else if (upper.includes('GIAOTIEP') || upper.includes('PATADO')) result.brand = 'Patado';
    else {
      // Tách tự động từ prefix đầu tiên nếu có
      const parts = cleanName.split(/[_.\s-]+/);
      if (parts.length > 0 && parts[0] !== 'DAH') result.brand = parts[0];
    }

    // 2. Nhận diện Format (Hình thức chạy)
    if (upper.includes('MESS') || upper.includes('MES')) result.format = 'Messenger';
    else if (upper.includes('VIDEO')) result.format = 'Video';
    else if (upper.includes('CVS')) result.format = 'Chuyển Đổi (CVS)';
    else if (upper.includes('LEAD')) result.format = 'Lead Form';
    else if (upper.includes('POST') || upper.includes('BAIVIET')) result.format = 'Bài Viết';
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

    // 5. Nhận diện Nhân sự phụ trách (Agent)
    if (upper.includes('TUANTQ')) result.agent = 'Tuấn TQ';
    else if (upper.includes('NAMNH')) result.agent = 'Nam NH';

    return result;
  }
}
