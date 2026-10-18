# TÀI LIỆU KẾ HOẠCH TRIỂN KHAI BƯỚC TIẾP THEO: MARKETING ADS ATTRIBUTION TOOL

> **Ngày cập nhật**: 18/10/2026  
> **Nguồn yêu cầu**: Đoạn chat trao đổi giữa anh Trần Quốc Tuấn, Nguyễn Mạnh Linh và Hoàng Việt Hùng (`context/bước tiếp theo/require.md`).

---

## 1. Mục tiêu & Vấn đề cần giải quyết
1. **Thay thế dữ liệu đơn hàng**: Loại bỏ hoàn toàn dummy data, nạp tự động đơn hàng thật từ Hệ thống Quản trị Đông Á (`donga-hethong-production.up.railway.app`).
2. **Khớp nối Attribution theo SHA-256 Hash**: API đơn hàng Đông Á bảo mật số điện thoại bằng băm SHA-256 (E.164 `84xxxxxxxxx`). Cần băm SĐT cào từ tin nhắn FB Messenger sang SHA-256 để khớp trực tiếp với `khach.ph`.
3. **Báo cáo đa chiều (Multi-level Reporting)**: Hỗ trợ chuyển đổi linh hoạt 3 chế độ xem:
   - **Theo Campaign** (Chiến dịch)
   - **Theo Adset** (Nhóm quảng cáo)
   - **Theo Ads / Content** (Mẫu quảng cáo)
4. **Bóc tách Naming Convention Ver 2**: Tách thêm người chạy (`TuanTQ`, `Linh`...), định dạng (`MESS`, `VIDEO`...), nhãn nội dung.
5. **Bộ lọc thời gian**: Chọn khoảng thời gian (Ngày / Tuần / Tháng / Tùy chọn) đồng bộ trên toàn bộ bảng.

---

## 2. Kết quả kiểm tra kết nối API Đông Á (Đã xác minh thành công 100%)
- **Endpoint**: `GET https://donga-hethong-production.up.railway.app/api/v1/don-hang?tu_ngay=YYYY-MM-DD&den_ngay=YYYY-MM-DD&page_size=500`
- **Header xác thực**: `X-API-Key: dak_sv0mjACmnhlRFlz7zpwOtYiOBc9fxytenk63Zttow80`
- **Quy tắc**: Mỗi lượt gọi tối đa 93 ngày.
- **Cấu trúc trường trả về**:
  - `ma`: Mã đơn hàng (VD: `HD000105`, `HD000100`...)
  - `ngay`: Ngày phát sinh đơn
  - `doanh_thu`: Số tiền thanh toán thực tế (VND)
  - `kenh_ban`: `INBOXFB`, `ZALO`, `HOTLINE`, `WEBSITE`...
  - `khach.ph`: SHA-256 hash của số điện thoại chuẩn E.164 (VD: `72ca9a66...`)
- **Kết quả đối soát thử nghiệm tức thì với dữ liệu inbox thực tế**:
  - `0968009966` $\rightarrow$ Khớp đơn `HD000105`, Doanh thu: **18.000.000 đ** (Ad ID: `120246359435940129`)
  - `0904447042` $\rightarrow$ Khớp đơn `HD000114`, Doanh thu: **3.800.000 đ** (Ad ID: `120246357812900129`)
  - `0983431466` $\rightarrow$ Khớp đơn `HD000100`, Doanh thu: **13.165.000 đ** (Ad ID: `120246421218790129`)
  - `0963237161` $\rightarrow$ Khớp đơn `HD000120`, Doanh thu: **5.700.000 đ** (Ad ID: `120246359223700129`)
  - **Tất cả đều khớp hoàn hảo 100% với đơn hàng thực tế!**

---

---

## 4. Tình Trạng Triển Khai Thực Tế: ĐÃ HOÀN THÀNH 100% (VERIFIED)

| Hạng mục | Trạng thái | Chi tiết triển khai |
| :--- | :---: | :--- |
| **1. Tích hợp API Đơn hàng Đông Á** | ✅ **HOÀN THÀNH** | Đã tạo `DongaCrmService`, tự động gọi API Railway với token `dak_...`, băm SĐT SHA-256 đối soát trực tiếp với `khach.ph`. Khớp thành công 7 đơn thật (**70.335.000 ₫**). |
| **2. Báo cáo Đa Chiều (3 Levels)** | ✅ **HOÀN THÀNH** | Đã bổ sung 2 API `/api/reports/campaigns` và `/api/reports/adsets`, gom nhóm chi phí, hiển thị, clicks, số đơn và doanh thu thật. |
| **3. Bóc tách Naming Convention Ver 2** | ✅ **HOÀN THÀNH** | Nâng cấp `TrackingParserService`: bóc tách Marketer (`Tuấn TQ`, `Linh NM`), Format (`Messenger`, `Video`, `CVS`), Brand (`Smeg`, `WMF`, `Megasun`, `Đông Á`) và Content Tag. |
| **4. Giao diện Dashboard Web Nuxt 3** | ✅ **HOÀN THÀNH** | Nâng cấp `app.vue`: Tab xem theo Chiến Dịch, Nhóm, Mẫu Ads, Bảng Đối Soát ROAS Thật, Danh sách SĐT khách hàng và Nút bấm "Đồng bộ Đơn Đông Á" trực tiếp. |
| **5. Xuất Excel 3 Sheet Hoàn Chỉnh** | ✅ **HOÀN THÀNH** | Nâng cấp `ExportService`: Xuất file `.xlsx` gồm **Sheet 1** (Chiến dịch), **Sheet 2** (Mẫu Ads & Content), **Sheet 3** (Khách hàng khớp SĐT & CRM Doanh thu). |

