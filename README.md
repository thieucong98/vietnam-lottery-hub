# Vietnam Lottery & Vietlott Analytics Platform (vietnam-lottery-hub)

[![Daily Pipeline](https://github.com/thieucong98/vietnam-lottery-hub/actions/workflows/daily-crawler.yml/badge.svg)](https://github.com/thieucong98/vietnam-lottery-hub/actions/workflows/daily-crawler.yml)
[![Deploy GitHub Pages](https://github.com/thieucong98/vietnam-lottery-hub/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/thieucong98/vietnam-lottery-hub/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Legal Compliance](https://img.shields.io/badge/Compliance-Legal%20Disclaimer%20%26%2018%2B-emerald.svg)](LEGAL_DISCLAIMER.md)

> 🌐 **Live Web Demo:** [https://thieucong98.github.io/vietnam-lottery-hub/](https://thieucong98.github.io/vietnam-lottery-hub/)  
> **Cập nhật tự động lần cuối:** 06/10/2026 02:26:08 (Giờ Việt Nam)  
> **Nguồn dữ liệu:** Cào tự động và lưu trữ lịch sử hơn 20 năm (2005 - nay).

---

## 🏆 KẾT QUẢ XSMB MỚI NHẤT (2026-10-05)

| Xổ Số Kiến Thiết Miền Bắc | Thống Kê Đầu - Đuôi Lô Tô |
| :--- | :--- |
| <table><tr><td><strong>Ngày quay</strong></td><td><strong>2026-10-05</strong></td></tr><tr><td><strong>Giải Đặc Biệt</strong></td><td><strong style="color:red; font-size:1.15em;">19654</strong></td></tr><tr><td>Giải Nhất</td><td><strong>62219</strong></td></tr><tr><td>Giải Nhì</td><td>92501, 22795</td></tr><tr><td>Giải Ba</td><td>67752, 15062, 61353<br>69038, 81889, 00945</td></tr><tr><td>Giải Tư</td><td>0166, 4647, 0994, 1272</td></tr><tr><td>Giải Năm</td><td>1025, 6151, 9374<br>9380, 4735, 9347</td></tr><tr><td>Giải Sáu</td><td>553, 648, 231</td></tr><tr><td>Giải Bảy</td><td>44, 70, 72, 15</td></tr></table> | <table><tr><th>Đầu</th><th>Đuôi Lô Tô</th></tr><tr><td><strong>0</strong></td><td>1</td></tr><tr><td><strong>1</strong></td><td>5, 9</td></tr><tr><td><strong>2</strong></td><td>5</td></tr><tr><td><strong>3</strong></td><td>1, 5, 8</td></tr><tr><td><strong>4</strong></td><td>4, 5, 7, 7, 8</td></tr><tr><td><strong>5</strong></td><td>1, 2, 3, 3, 4</td></tr><tr><td><strong>6</strong></td><td>2, 6</td></tr><tr><td><strong>7</strong></td><td>0, 2, 2, 4</td></tr><tr><td><strong>8</strong></td><td>0, 9</td></tr><tr><td><strong>9</strong></td><td>4, 5</td></tr></table> |

---

## 🎯 KẾT QUẢ VIETLOTT MỚI NHẤT

### 1. Vietlott Power 6/55 (Kỳ #01406 - Ngày 2026-10-03)
`[07]` `[11]` `[13]` `[16]` `[18]` `[54]` | `★ [41]` (Số Đặc Biệt)

### 2. Vietlott Mega 6/45 (Kỳ #01568 - Ngày 2026-09-27)
`[02]` `[04]` `[13]` `[25]` `[31]` `[39]`

---

## 🚀 TÍNH NĂNG NỔI BẬT

1. **Tra Cứu Lịch Sử Siêu Tốc (Zero-Latency Instant Lookup)**:
   - Tra cứu tức thì bất kỳ số nào: **XSMB (00-99)**, **Vietlott Power 6/55 (01-55)**, **Vietlott Mega 6/45 (01-45)**.
   - Thống kê **Ngày đầu tiên xuất hiện (First Seen)**, **Kỳ quay gần nhất (Last Seen - cách đây bao nhiêu ngày)**.
   - Tổng số lần về trong 20 năm, số lần trúng Giải Đặc Biệt (Đề).
   - Biểu đồ phân bố xuất hiện theo từng năm (2005 - 2026).
   - Tra cứu dòng thời gian toàn bộ các ngày đã về kèm chi tiết giải thưởng và bộ lọc Năm.
   - **Xuất file CSV** toàn bộ ngày xuất hiện để phân tích bằng Excel/Sheets.
   - **Tra cứu Cặp Lô Xiên (Xiên 2)**: Kiểm tra xem 2 số đã từng cùng về ngày nào chưa, tần suất xuất hiện và ngày về gần nhất.
   - **Phím tắt toàn cục:** Bấm `Ctrl + K` (hoặc `Cmd + K`) hoặc phím `/` để mở ngay ô tra cứu.

2. **Bạc Nhớ Ma Trận 20 Năm (Data-Driven Bac Nho Engine)**:
   - Dựa trên ma trận 7,500+ kỳ quay XSMB từ năm 2005 đến nay.
   - Thống kê xác suất có điều kiện chính xác: *Khi hôm trước về số X (hoặc Đề về Y), thì hôm sau con số nào nổ nhiều nhất và tần suất bao nhiêu %*.
   - Đánh giá tín hiệu chu kỳ hiện tại (Đang có nhịp vs Cảnh báo lô gan).
   - Nút 1-click sao chép Top 10 số bạc nhớ tiềm năng.

3. **Bộ Lọc Dàn Số Thông Minh & Trình So Vé Hàng Loạt (XSMB & Vietlott)**:
   - **Bộ lọc dàn đề XSMB:** Lọc theo Chạm (0-9), Tổng (0-9), Tổng Chẵn/Lẻ, Tổng Lớn/Bé, Kép bằng, và tự động loại trừ các số Lô Gan > 10 ngày hoặc > 15 ngày.
   - **Tạo dàn vé Vietlott chuẩn Gauss:** Tự động sinh 5 vé đơn 6 số hoặc vé bao 7-8 thỏa mãn đồng thời: Khoảng tổng điểm chuẩn Gauss (120-180), Tỷ lệ Chẵn/Lẻ 3-3, Tỷ lệ Nhỏ/Lớn 3-3, loại trừ số gan và ưu tiên cặp số đồng xuất hiện cao nhất.
   - **Trình so vé hàng loạt:** Dán bất kỳ dàn số nào (10 - 64 số), hệ thống đối soát ngay lập tức với kỳ quay mới nhất (hoặc kỳ đã chọn), hiển thị chi tiết số nháy ăn và cảnh báo trúng Giải Đặc Biệt.

4. **Tra Cứu Bộ Số & Vé Bao Vietlott (Tổ Hợp 2 - 18 Bóng)**:
   - Hỗ trợ cả **Power 6/55** và **Mega 6/45**.
   - Bảng chọn bóng trực quan 55 bóng / 45 bóng, chọn nhanh 6 số ngẫu nhiên hoặc bộ số kỳ gần nhất.
   - Đối soát tức thì toàn bộ 1,400+ kỳ quay lịch sử (<2ms): Đếm chính xác số lần từng trúng **Jackpot 1 (6/6)**, **Jackpot 2 (5+1)**, **Giải Nhất (5/6)**, **Giải Nhì (4/6)**, **Giải Ba (3/6)**.
   - **Mô phỏng chiến lược nuôi vé & Backtest PnL:** So sánh đối đầu giữa 3 chiến lược: *Nuôi bộ số cố định* vs *Nuôi theo cặp số hot Co-occurrence* vs *Mua ngẫu nhiên máy chọn (Quick Pick)* qua 100 kỳ, 1 năm, 3 năm hoặc toàn bộ lịch sử.
   - **Ma trận Cặp số & Bộ ba thường về cùng nhau:** Top 20 cặp số và top 20 bộ ba số xuất hiện nhiều nhất lịch sử Vietlott.

5. **Tự Động Hóa 100% Bằng GitHub Actions & Telegram Bot 2 Chiều**:
   - Tự động cào kết quả hàng ngày lúc **18:35** (XSMB) và **18:45** (Vietlott).
   - Tự động cập nhật ma trận thưa, chỉ mục JSON và commit lại repository.
   - Tự động render bảng kết quả mới nhất vào `README.md`.
   - Tự động deploy Web App lên GitHub Pages hoàn toàn miễn phí.
   - **Telegram Bot Tương Tác 2 Chiều:**
     - Tự động phát thông báo kết quả hàng ngày qua `TELEGRAM_BOT_TOKEN`.
     - Hỗ trợ chat tra cứu tức thì: `/xsmb`, `/power`, `/mega`, `/check <bộ số>`, `/gan`, `/bacnho <số>`, `/hot`.
     - Chạy daemon: `uv run python scripts/run_telegram_bot.py`.

---

## 🛠 HƯỚNG DẪN CÀI ĐẶT & CHẠY LOCAL

### 1. Chạy Python Engine & Telegram Bot
```bash
# Cài đặt thư viện với uv hoặc pip
uv sync

# Chạy toàn bộ pipeline (cào dữ liệu, xử lý ma trận, tạo chỉ mục, render README)
uv run python scripts/run_pipeline.py

# Khởi động Telegram Bot tương tác 2 chiều (Long Polling)
uv run python scripts/run_telegram_bot.py

# Hoặc dùng CLI chuyên dụng
uv run lottery sync-xsmb
uv run lottery sync-vietlott --product all
uv run lottery build-index
```

### 2. Chạy Ứng Dụng Web React
```bash
cd web
npm install
npm run dev
```

---

## ⚖️ TUYÊN BỐ PHÁP LÝ & CHƠI CÓ TRÁCH NHIỆM (LEGAL COMPLIANCE & 18+)

> [!IMPORTANT]
> **Về ranh giới pháp lý tại Việt Nam:**
> 1. **Xổ số Nhà nước là hợp pháp:** Hoạt động kinh doanh Xổ số kiến thiết truyền thống và Xổ số điện toán Vietlott là ngành nghề kinh doanh có điều kiện, hoàn toàn hợp pháp do Nhà nước quản lý theo **Nghị định 30/2007/NĐ-CP**, **Thông tư 75/2013/TT-BTC** và **Quyết định 1108/QĐ-TTg** của Thủ tướng Chính phủ, nhằm tạo nguồn thu xây dựng các công trình phúc lợi, y tế và giáo dục cộng đồng.
> 2. **Lô đề ngầm là bất hợp pháp:** Các hoạt động đánh bạc bằng hình thức "lô đề" tự phát ăn tiền là hành vi vi phạm pháp luật nghiêm trọng, bị xử phạt hành chính theo **Nghị định 144/2021/NĐ-CP** hoặc truy cứu trách nhiệm hình sự theo **Điều 321, 322 Bộ luật Hình sự 2015 (sửa đổi 2017)**.

### Mục Đích & Nguyên Tắc Dự Án:
- **Nghiên cứu khoa học dữ liệu & học thuật thuần túy:** Dự án được xây dựng phục vụ nghiên cứu xác suất thống kê, mô hình chuỗi thời gian, kiến trúc dữ liệu ma trận thưa và tự động hóa pipeline CI/CD mã nguồn mở.
- **Nghiêm cấm cờ bạc & lô đề:** Tác giả và cộng đồng phát triển **kiên quyết phản đối và nghiêm cấm** việc sử dụng mã nguồn, dữ liệu, trang web, Telegram Bot hay tài liệu của dự án vào các hoạt động cờ bạc, cá cược, tổ chức đánh bạc hoặc bất kỳ hành vi vi phạm pháp luật nào.
- **Biến cố ngẫu nhiên độc lập:** Về mặt toán học xác suất, mỗi kỳ quay là một biến cố ngẫu nhiên độc lập. Mọi phân tích thống kê chỉ mang tính chất mô tả quá khứ, **KHÔNG CÓ GIÁ TRỊ CAM KẾT** hay bảo đảm bất kỳ kết quả nào trong tương lai.
- **Chơi có trách nhiệm (18+):** Chỉ dành cho công dân từ đủ 18 tuổi trở lên. Tuyệt đối không vay mượn, không xem xổ số là hình thức đầu tư kiếm tiền hay làm giàu.

👉 **Đọc toàn văn Chính Sách & Tuyên Bố Pháp Lý Đầy Đủ Tại Đây:** [LEGAL_DISCLAIMER.md](LEGAL_DISCLAIMER.md)
