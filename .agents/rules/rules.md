# Tool Marketing - Project Rules

Dự án "Tool Marketing" là hệ thống tự động hóa kéo dữ liệu quảng cáo từ Facebook Ads Manager (Graph API) và Facebook Messenger, khớp dữ liệu khách hàng theo `ad_id` và xuất báo cáo ra Excel / Google Sheets.

## Kiến trúc Hệ thống (Architecture)
- **Backend (BE)**: NestJS (TypeScript), PostgreSQL (Prisma ORM).
- **Frontend (FE)**: Nuxt 3 (TypeScript), TailwindCSS / UI Components.
- **External Integration**: Facebook Graph API (v19.0+), ExcelJS, Google Sheets API.

## Quy chuẩn Code & Phát triển
1. **NestJS Backend**:
   - Tuân thủ nguyên lý SOLID.
   - Module hóa rõ ràng: `fb-ads`, `messenger`, `matching`, `reports`, `export`.
   - Xử lý lỗi tập trung và log chi tiết khi tương tác với FB Graph API (xử lý Rate Limit, Token hết hạn).
2. **Frontend Nuxt**:
   - Giao diện đẹp mắt, trực quan, hỗ trợ chế độ Dark/Light Mode.
   - Tránh tràn màn hình, tối ưu hóa hiển thị bảng báo cáo đa thiết bị.
3. **Quy trình Kiểm soát định kỳ (Cronjob)**:
   - Cho phép đặt lịch đồng bộ tự động dữ liệu FB Ads theo giờ/ngày.
