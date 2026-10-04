# KẾ HOẠCH THỰC THI TOÀN BỘ LỘ TRÌNH NÂNG CẤP (FULL SYSTEM COOKING ROADMAP)

## 1. Mục Tiêu & Phạm Vi (Scope)
Hiện thực hóa 3 trụ cột tính năng cao cấp cho nền tảng Vietnam Lottery & Vietlott:
1. **Trụ cột 1: Telegram Bot 2 chiều (Interactive Bot Commands)**:
   - Tra cứu tức thì qua chat: `/xsmb`, `/vietlott`, `/check <số hoặc bộ số>`, `/gan`, `/bacnho`, `/hot`.
   - Chạy ở chế độ Polling hoặc Webhook, sẵn sàng deploy VPS/Serverless hoặc local daemon.
2. **Trụ cột 2: Vietlott Smart Filter & Bộ Tạo Dàn Vé Thông Minh**:
   - Tích hợp vào `SmartFilterAndChecker.tsx`.
   - Lọc theo phân phối chuẩn Gauss (Tổng điểm 120-180), tỷ lệ Chẵn/Lẻ (3/3, 4/2), tỷ lệ Đầu/Đuôi, và ép theo cặp Co-occurrence.
   - Sinh dàn vé tối ưu và 1-click nạp sang kiểm tra lịch sử.
3. **Trụ cột 3: Mô Phỏng Chiến Lược Nuôi Vé & Backtesting (Historical & Monte Carlo)**:
   - So sánh 3 chiến lược: Nuôi bộ số cố định, Mua vé theo cặp hot, và Random ngẫu nhiên.
   - Biểu đồ tăng trưởng dòng tiền (PnL Cumulative Curve) và tỷ lệ ROI thực nghiệm.

---

## 2. Kế Hoạch Triển Khai Từng Giai Đoạn (Phased Execution)

### Giai đoạn 1: Telegram Bot Tương Tác 2 Chiều
- File: `engine/notifications/telegram_bot.py`, `scripts/run_telegram_bot.py`
- Triển khai handler xử lý tin nhắn & command Telegram API qua HTTP requests (`httpx` / `urllib`).
- Thêm kiểm thử tự động trong `tests/test_telegram_bot.py`.

### Giai đoạn 2: Vietlott Smart Filter & Dàn Số Thông Minh
- File: `web/src/components/SmartFilterAndChecker.tsx`
- Thêm tab chọn "Vietlott Power 6/55 & Mega 6/45".
- Các tiêu chí lọc: Tổng điểm (Sum Range), Chẵn / Lẻ, Khoảng bóng (Low/High), Loại trừ số Gan cao, Ưu tiên Cặp số Co-occurrence.
- Xuất danh sách vé gợi ý (Vé đơn 6 số, Vé bao 7-10 số).

### Giai đoạn 3: Chiến Lược Nuôi Vé & Backtesting
- File: `web/src/components/VietlottCombinationHub.tsx`
- Nâng cấp bộ giả lập tài chính thành công cụ Backtesting đa kỳ với biểu đồ lợi nhuận trực quan.

### Giai đoạn 4: Kiểm Thử Toàn Diện & Triển Khai
- `uv run pytest` kiểm thử 100% backend.
- `npm run build` kiểm thử frontend TypeScript.
- Git commit, push và GitHub Actions auto-deploy lên GitHub Pages.
