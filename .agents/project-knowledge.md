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

### 5. Tích Hợp Đơn Hàng Thật Từ CRM Đông Á (`DongaCrmService` - Hoạt Động 100%)
- **Hệ thống nguồn**: `https://donga-hethong-production.up.railway.app/api/v1/don-hang`
- **Xác thực**: `X-API-Key: dak_sv0mjACmnhlRFlz7zpwOtYiOBc9fxytenk63Zttow80`
- **Cơ chế đối soát**:
  - Dữ liệu khách hàng từ API Đông Á được băm bằng thuật toán SHA-256 (`khach.ph`).
  - Hệ thống tự động băm số điện thoại của Leads Facebook thu thập từ Messenger và Form sang SHA-256 (cả chuẩn quốc tế E.164 `84xxxxxxxxx` và nội địa `0xxxxxxxxx`).
  - Đối soát khớp 100% không để lộ SĐT thật, gán trực tiếp doanh thu vào Ad ID và tính ROAS thực tế.

### 6. Báo Cáo Đa Cấp Độ (Multi-level Reporting)
- Hỗ trợ 3 tầng phân tích:
  - **Campaign Level**: Gom nhóm chi phí, hiển thị, clicks, số đơn và doanh thu theo Chiến dịch (`/api/reports/campaigns`).
  - **AdSet Level**: Gom nhóm theo Nhóm quảng cáo (`/api/reports/adsets`).
  - **Ad / Content Level**: Chi tiết từng mẫu bài viết, hình ảnh, video kèm Naming Convention (`/api/reports/ads`).
- **Giao diện Web**: Dashboard Nuxt 3 tại `http://localhost:3000` với tab chuyển đổi tức thì, tích hợp nút "Đồng bộ Đơn Đông Á" trực tiếp.


### ⚠️ 2. Kích Hoạt Webhook Facebook Realtime (Thay Vì Bấm Đồng Bộ Thủ Công)
- **Mục tiêu**: Bắt tin nhắn và gán mã `referral.ad_id` ngay trong 1 giây khi khách vừa nhắn tin, không cần chờ quét định kỳ.
- **Yêu cầu triển khai**:
  - Khi deploy app lên server (Cloud Run / VPS) hoặc dùng đường hầm HTTPS (`ngrok / Cloudflare Tunnel`), dán URL `https://your-domain/webhook` vào App Facebook Developers (mục Messenger Webhooks).

### ⚠️ 3. Tự Động Kéo Dữ Liệu Định Kỳ (Scheduler / Cronjob)
- **Mục tiêu**: Tự động chạy ngầm mỗi 15 phút hoặc 1 giờ để cập nhật chi phí Ads và tin nhắn mới nhất, không cần người dùng phải bấm nút "Đồng bộ Facebook Ads" thủ công.
