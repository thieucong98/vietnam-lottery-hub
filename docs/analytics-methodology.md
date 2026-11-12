# Phương pháp phân tích minh bạch (Phase 4)

Mọi con số trên các màn hình phân tích là thống kê mô tả dữ liệu lịch sử. Các kỳ quay độc lập, nên không phép tính nào ở đây cho biết trước kết quả kỳ sau hay làm tăng xác suất trúng. Công thức nằm trong `engine/analytics/stats.py` (hàm thuần, test trong `tests/test_stats.py`).

## Mô hình quay

| Trò chơi | Mô hình | Xác suất một số có mặt mỗi kỳ |
| --- | --- | --- |
| Power 6/55 | 6 số khác nhau từ 1-55 (không hoàn lại) | 6/55 ≈ 10,9% |
| Mega 6/45 | 6 số khác nhau từ 1-45 (không hoàn lại) | 6/45 ≈ 13,3% |
| XSMB | 2 số cuối của 27 giải, mỗi giải một số 00-99 độc lập (có hoàn lại) | 1 - 0,99²⁷ ≈ 23,8% |

## Tệp dữ liệu và nơi tạo

| Tệp | Tạo bởi | Màn hình |
| --- | --- | --- |
| `stats_report.json` | `engine/analytics/transparency.py` | `/#/phan-tich` |
| `ml_insights.json` (v3) | `engine/ml/render_insights.py`, `engine/ml/backtest.py` | `/#/thuat-toan` |
| `bac_nho.json` (v2) | `engine/analytics/bac_nho_analyzer.py` | `/#/bac-nho`, lệnh `/bacnho` của bot |

Cả ba chạy trong `scripts/run_pipeline.py` và `lottery build-index`. Seed của backtest cố định nên dữ liệu chỉ đổi khi có kỳ mới.

## Thống kê mô tả

- **Tần suất từng số**: tỷ lệ = số lần về / số kỳ (Vietlott) hoặc / số lượt giải (XSMB). Khoảng tin cậy 95% Wilson. Hiển thị số lượng số nằm ngoài khoảng tin cậy so với mức kỳ vọng do ngẫu nhiên (5% số lượng số). Có bản toàn bộ lịch sử và 100 kỳ gần nhất.
- **Khoảng cách giữa các lần về**: số kỳ vắng liên tiếp. Nếu ngẫu nhiên, khoảng cách theo phân bố hình học với P(vắng ≥ g kỳ) = (1 - q)^g, trung bình (1 - q)/q. Số vắng lâu nhất kèm xác suất có ít nhất một số vắng lâu như vậy (xấp xỉ coi các số độc lập).
- **Phân bố tổng**: phân bố chính xác của tổng k số khác nhau từ 1..N (quy hoạch động) hoặc tổng 27 số 00-99 (tích chập). Trung bình quan sát kèm khoảng tin cậy 95%.
- **Chẵn/lẻ**: số lượng số chẵn mỗi kỳ so với phân bố siêu bội (Vietlott) hoặc nhị thức p = 1/2 (XSMB).

## Kiểm định

| Kiểm định | Dùng cho | Ghi chú |
| --- | --- | --- |
| Chi-square đồng đều | Tần suất từng số | Vietlott: nhân thống kê Pearson với (N - 1)/(N - k) vì 6 số mỗi kỳ loại trừ nhau; đã kiểm tra bằng mô phỏng (tỷ lệ p < 0,05 khoảng 5% với dữ liệu ngẫu nhiên). |
| Chi-square phù hợp phân bố | Khoảng cách, tổng, chẵn/lẻ | Gộp ô có kỳ vọng < 5 vào ô kề. |
| Runs test (Wald-Wolfowitz) | Dãy có mặt/vắng của từng số; dãy tổng trên/dưới trung bình | Xấp xỉ chuẩn, hai phía. |
| Nhị thức chính xác | Thống kê có điều kiện so với tần suất nền | p-value nhân 100 (Bonferroni) vì mỗi điều kiện so 100 số. |

Lời giải thích: p ≥ 0,05 hiển thị "chênh lệch này nằm trong dao động ngẫu nhiên"; p < 0,05 vẫn nhắc rằng khi chạy nhiều kiểm định, khoảng 1/20 cho p < 0,05 chỉ do ngẫu nhiên (`web/src/utils/statsText.ts`).

## Phòng thí nghiệm xác suất

Backtest walk-forward cho 5 thuật toán hiện có (tần suất N=30, N=100, suy giảm số mũ, chuỗi Markov, số lâu chưa về) trên 50 và 300 kỳ Power 6/55 gần nhất. Mỗi kỳ, thuật toán chỉ thấy các kỳ trước. Mức ngẫu nhiên: 1.000 lần chọn ngẫu nhiên 6 số cho cùng các kỳ đó. p-value = (1 + số lần ngẫu nhiên có tổng số trùng ≥ thuật toán) / 1.001. Kỳ vọng lý thuyết 6 × 6 / 55 ≈ 0,65 số trùng mỗi kỳ.

Kết quả dữ liệu ngày 2026-11-11 (50 kỳ): thuật toán cao nhất 0,78 số/kỳ, p ≈ 0,12; 95% lần chọn ngẫu nhiên nằm trong 0,46-0,88. Với 300 kỳ: cao nhất 0,71, p ≈ 0,10. Không thuật toán nào vượt ngẫu nhiên có ý nghĩa thống kê.

## Thống kê có điều kiện (trước đây gọi "bạc nhớ")

Với điều kiện X (2 số cuối giải Đặc Biệt hôm trước, hoặc số có trong 27 giải hôm trước), mỗi số Y có: số ngày kế tiếp có Y / số ngày thỏa X, khoảng tin cậy Wilson, **tần suất nền** (tỷ lệ ngày có Y trên toàn bộ mẫu), p-value đã hiệu chỉnh. Giao diện luôn hiện cỡ mẫu và cảnh báo khi cỡ mẫu dưới 100 ngày. Top 10 được chọn từ 100 số nên luôn nhỉnh hơn nền một chút do chọn số cao nhất. Trên dữ liệu hiện tại, 3/2.000 cặp có p hiệu chỉnh < 0,05.

## Quick Pick và gợi ý tránh chia giải

`web/src/utils/quickPick.ts`: chọn ngẫu nhiên bằng `crypto.getRandomValues`, lấy mẫu loại bỏ theo tùy chọn (ghim số, loại số, khoảng tổng, số lượng số chẵn, tránh bộ phổ biến). Trong giới hạn đã chọn, mọi bộ số có cùng khả năng được chọn. Bộ phổ biến (`popularPatterns`): toàn số 1-31, 3 số liên tiếp, cách đều, ≥ 4 số cùng hàng chục hoặc cùng chữ số cuối, trùng ≥ 4 số với kỳ vừa quay. Tránh các bộ này không đổi xác suất trúng, chỉ giảm khả năng phải chia Jackpot nếu trúng.
