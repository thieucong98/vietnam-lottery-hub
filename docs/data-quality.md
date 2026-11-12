# Vận hành và chất lượng dữ liệu

## Cảnh báo crawler lỗi / thiếu kỳ

Bước cuối của `daily-crawler.yml` chạy `python -m engine.monitoring.health_check` sau mỗi lần cron (kể cả khi bước trước lỗi). Các kiểm tra:

| Kiểm tra | Điều kiện báo |
|---|---|
| Thiếu kỳ mới | Kỳ quay gần nhất theo lịch đã qua giờ chốt (21:00 giờ VN, Keno 22:30) mà chưa có trong `data/` |
| Kỳ thiếu gần đây | `MissingDetector` còn thấy kỳ thiếu sau khi cào bù, trong 45 ngày gần nhất (XSMB) hoặc 60 kỳ gần nhất (Vietlott, Keno 300 kỳ) |
| Dữ liệu xuất bản lệch | `summary.json` không khớp kỳ mới nhất trong `data/` |
| Pipeline lỗi | Một bước trong `scripts/run_pipeline.py` báo lỗi, hoặc một bước CI (pytest, schema, budget, build, deploy) thất bại |

Lịch quay và ngày nghỉ Tết nằm trong `engine/monitoring/health_check.py` (`PRODUCTS`, `NO_DRAW_DATES`). Cập nhật `NO_DRAW_DATES` theo thông báo nghỉ Tết chính thức mỗi năm.

Kênh gửi:

- **GitHub issue** nhãn `data-alert` (dùng `GITHUB_TOKEN` sẵn có của Actions, quyền `issues: write`). Mỗi trạng thái sự cố có một fingerprint: cùng sự cố thì không bình luận lặp; sự cố đổi thì cập nhật issue; dữ liệu bình thường trở lại thì issue tự đóng.
- **Telegram admin** (tùy chọn): thêm secret `TELEGRAM_ADMIN_CHAT_ID` (chat riêng của quản trị viên, khác `TELEGRAM_CHAT_ID` công khai). Bot dùng lại `TELEGRAM_BOT_TOKEN`. Chỉ nhắn khi mở, đổi hoặc đóng sự cố.

Token chỉ đọc từ biến môi trường và được che (`***`) trong mọi thông báo lỗi.

Chạy thử:

```bash
uv run python -m engine.monitoring.health_check --dry-run
uv run python -m engine.monitoring.health_check --simulate-missing xsmb --dry-run
uv run python -m engine.monitoring.health_check --now 2026-11-12T22:40 --dry-run
```

## Kiểm tra schema JSON

`scripts/validate_data_schema.py` kiểm tra mọi tệp trong `web/public/data` theo `schemas/data/*.schema.json` (JSON Schema 2020-12), đủ bộ tệp `history/`, các tệp mà `web/src` gọi `fetch`, và kỳ mới nhất khớp giữa `summary.json` với các chỉ mục. `ml_insights.json` phải là schema v2 (`sample_picks`, có `disclaimer` và `jackpot_odds`).

Trong `daily-crawler.yml` bước này chạy trước bước commit, nên dữ liệu sai schema không được commit hay deploy. Khi đổi cấu trúc JSON ở `engine/`, cập nhật schema tương ứng trong cùng PR.

## Budget kích thước

`scripts/check_size_budget.py` đọc ngưỡng trong `size-budget.json`:

- `max_raw` / `max_gzip`: vượt là CI fail.
- `target_raw`: chỉ cảnh báo. Mục tiêu dữ liệu tải lúc mở trang < 100 KB sau Phase 1.

"Dữ liệu lúc mở trang" là các `fetch('./data/*.json')` cố định trong `web/src/App.tsx`. Ngưỡng hiện tại bằng kích thước ngày 2026-11-12 cộng khoảng 10%. Khi Phase 1 tách dữ liệu theo màn hình, hạ `max_raw` của `initial_data` xuống gần kích thước mới.

```bash
python scripts/check_size_budget.py --only data
cd web && npm run build && cd .. && python scripts/check_size_budget.py --only bundle
```
