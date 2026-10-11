# Marketing Report & Attribution Engine - Project Knowledge

## 1. Tổng quan Dự án
Tool Báo cáo Marketing tự động hóa toàn diện luồng dữ liệu quảng cáo theo sơ đồ kiến trúc:
**Facebook Ads (Insights) + Facebook Messenger (Referral) + CRM Đơn hàng $\longrightarrow$ Báo cáo Doanh thu & ROAS theo Campaign / Ad / Ad ID**.

## 2. Kiến trúc & Công nghệ (Tech Stack)
- **Backend (BE)**: NestJS (TypeScript), chạy tại cổng `3001`.
- **Database (DB)**: SQLite (`dev.db`) qua Prisma ORM, sẵn sàng di chuyển sang PostgreSQL khi cần.
- **Frontend (FE)**: Nuxt 3 (Vue 3, JetBrains Mono, Plus Jakarta Sans, Dark Mode Dashboard), chạy tại cổng `3000`.
- **Facebook Credentials**:
  - App ID: `1953850851989598` (Chat Bot Dong A Haus)
  - Fanpage: `1135433796327068` (Đông A Haus - Tinh Hoa Gia Dụng Đức & Châu Âu)
  - Ad Account ID: `act_37100244396233479` (DAH002)
  - Token: System User Token **VĨNH VIỄN** (`expires_at = 0`, không bao giờ hết hạn).

## 3. Các Phân Hệ Đã Triển Khai (Core Modules - Hoạt Động 100%)
1. **Marketing API Insights Connector (`FbAdsService`)**:
   - Kéo trực tiếp dữ liệu chiến dịch thật từ tài khoản `DAH002`: Chi phí Ads, Lượt hiển thị, Clicks, CPC, CTR, Tin nhắn Messenger theo từng Ad ID.
2. **Tracking Code Parser (`TrackingParserService`)**:
   - Tự động bóc tách quy ước đặt tên (Naming Convention) theo link Google Sheet của anh Tuấn thành các chiều báo cáo:
     - **Nhãn hàng (Brand)**: Smeg, WMF, Megasun, Đông Á, Patado, MT...
     - **Mục tiêu (Target)**: Lookalike (LAL), Tiếng Anh Giao Tiếp, Độ tuổi 18-40, Khu vực Châu Âu, Nhật Bản...
     - **Định dạng (Format)**: Messenger, Video, Chuyển Đổi (CVS), Lead Form, Bài Viết...
     - **Ngày lên camp**: Chuẩn hóa từ chuỗi 6 số (VD: `091026` $\rightarrow$ `09/10/2026`).
3. **Identity Resolver (`IdentityResolverService`)**:
   - Quét ngược lịch sử trò chuyện (độ sâu 100 tin nhắn) để bóc tách Số Điện Thoại Việt Nam (đầu 03, 05, 07, 08, 09, +84).
   - Chuẩn hóa về E.164 (`84...`) và nội địa (`0...`).
   - Thiết lập ánh xạ 3 chiều: $\text{Ad ID (từ Referral)} \longleftrightarrow \text{PSID} \longleftrightarrow \text{Số Điện Thoại}$.
4. **Attribution Engine (`AttributionEngineService`)**:
   - Cung cấp API `POST /api/crm/orders` để nạp đơn hàng CRM theo Số Điện Thoại.
   - Gán doanh thu đơn hàng vào đúng mẫu quảng cáo (`Ad ID`).
   - Tính toán chỉ số tài chính: **ROAS** (Doanh thu / Chi phí Ads) và **CPA** (Chi phí trên mỗi đơn hàng thành công).
5. **Facebook Webhook Receiver (`WebhookController`)**:
   - Dựng sẵn endpoint `/webhook` chuẩn Meta:
     - `GET /webhook`: Xác thực `hub.challenge` khi kết nối Webhook.
     - `POST /webhook`: Bắt sự kiện realtime khi khách click quảng cáo vào nhắn tin (`referral.ad_id`).
6. **Xuất Báo Cáo Excel Đa Chiều (`ExportService`)**:
   - File `.xlsx` chuẩn 2 Sheet:
     - *Sheet 1*: Báo cáo Quảng cáo đa chiều (Ad ID, Brand, Target, Format, Chi phí, Doanh thu, ROAS).
     - *Sheet 2*: Danh sách Khách hàng khớp Ad ID và Số Điện Thoại.
7. **Giao Diện Dashboard Nuxt 3 (`app.vue`)**:
   - 4 Thẻ KPI Realtime.
   - Bảng 1: Hiệu suất Quảng cáo & Naming Tags.
   - Bảng 2: Báo cáo Doanh thu & ROAS theo Ad ID (Attribution).
   - Bảng 3: Danh sách Khách hàng khớp SĐT & Ad ID (Ưu tiên khách có SĐT lên đầu).
   - Bảng 4: Lịch sử đồng bộ Facebook API.

---

## 4. Những Tính Năng Cần Hoàn Thiện Để Đáp Ứng 100% Thực Tế Vận Hành

Theo sơ đồ kiến trúc, để hệ thống vận hành hoàn toàn tự động trong sản xuất, còn 3 tính năng sau:

### ⚠️ 1. Nạp Dữ Liệu Đơn Hàng Thực Tế Từ CRM Nội Bộ (CRM Sync)
- **Mục tiêu**: Thay thế dữ liệu đơn hàng mô phỏng bằng đơn hàng thật của bên anh Tuấn để tính doanh thu và ROAS thực tế.
- **Giải pháp**:
  - Cách 1: Thêm tính năng **"Upload file Excel / CSV Đơn Hàng"** trực tiếp trên Web Dashboard.
  - Cách 2: Kết nối tự động qua API của hệ thống CRM bên anh Tuấn (KiotViet, Pancake Pos, Haravan, Nhanh.vn...) hoặc đồng bộ qua Google Sheet đơn hàng.

### ⚠️ 2. Kích Hoạt Webhook Facebook Realtime (Thay Vì Bấm Đồng Bộ Thủ Công)
- **Mục tiêu**: Bắt tin nhắn và gán mã `referral.ad_id` ngay trong 1 giây khi khách vừa nhắn tin, không cần chờ quét định kỳ.
- **Yêu cầu triển khai**:
  - Khi deploy app lên server (Cloud Run / VPS) hoặc dùng đường hầm HTTPS (`ngrok / Cloudflare Tunnel`), dán URL `https://your-domain/webhook` vào App Facebook Developers (mục Messenger Webhooks).

### ⚠️ 3. Tự Động Kéo Dữ Liệu Định Kỳ (Scheduler / Cronjob)
- **Mục tiêu**: Tự động chạy ngầm mỗi 15 phút hoặc 1 giờ để cập nhật chi phí Ads và tin nhắn mới nhất, không cần người dùng phải bấm nút "Đồng bộ Facebook Ads" thủ công.
