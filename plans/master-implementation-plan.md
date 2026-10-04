# KẾ HOẠCH TỔNG THỂ & THIẾT KẾ KIẾN TRÚC DỰ ÁN VIETNAM LOTTERY & VIETLOTT
**Hệ Thống Tự Động Thu Thập, Phân Tích & Tra Cứu Xổ Số Chuyên Nghiệp**

---

## 1. MỤC TIÊU VÀ ĐỊNH VỊ SẢN PHẨM
*   **Hợp nhất 2 repository mẫu mực**:
    1.  `khiemdoan/vietnam-lottery-xsmb-analysis`: Chuẩn hóa dữ liệu XSMB 20 năm, ma trận thưa 100 số, Parquet nén, tự động cập nhật bảng kết quả vào README của GitHub.
    2.  `vietvudanh/vietlott-data`: Thu thập đa sản phẩm Vietlott (Power 6/55, Mega 6/45, Max 3D, Keno, Bingo 18), phân tích chu kỳ nhịp lô gan, tần suất.
*   **Tính năng cốt lõi**:
    1.  **Tra cứu tức thì (Zero-Latency Instant Search)**:
        - Số đó đã về bao giờ chưa?
        - Lần đầu tiên xuất hiện khi nào?
        - Lần gần nhất xuất hiện khi nào? (Cách đây bao nhiêu ngày?)
        - Tổng cộng đã về bao nhiêu lần trong 20 năm qua? (Chi tiết giải đặc biệt/đề, 30 ngày qua, 100 ngày qua, 365 ngày qua).
        - Phân bố theo từng năm (2005 - 2026).
        - Toàn bộ danh sách các ngày đã về kèm chi tiết giải trúng (Giải ĐB, Giải Nhất...) với bộ lọc theo Năm/Tháng.
        - Tra cứu cặp số đi kèm (Bạc nhớ định lượng) và tra cứu Cặp Lô Xiên (Xiên 2).
    2.  **Tự động hóa 100% bằng GitHub Actions**:
        - Chạy cron hàng ngày (18:35 XSMB, 18:45 Vietlott).
        - Tự động cào kết quả mới nhất, bù ngày thiếu (nếu có).
        - Tự động cập nhật ma trận thưa, chỉ mục JSON và phân tích AI/thống kê.
        - Tự động render bảng kết quả mới nhất và thống kê đầu - đuôi loto vào `README.md` của repo.
        - Tự động build và deploy Web App lên GitHub Pages hoàn toàn miễn phí.
    3.  **Kiến trúc Serverless Edge Static**:
        - Chi phí vận hành máy chủ: **0 VNĐ**.
        - Tốc độ tải và tra cứu: **< 10ms**, không phụ thuộc backend server, không lo nghẽn mạng vào giờ cao điểm.

---

## 2. KIẾN TRÚC DỮ LIỆU & LƯU TRỮ TỐI ƯU
1.  **Tầng Raw Data**:
    - `data/xsmb/xsmb.csv` & `xsmb.parquet`: 28 cột từ 2005 đến nay (7,500+ kỳ quay).
    - `data/vietlott/*.jsonl` & `*.parquet`: Dữ liệu từng dòng của từng sản phẩm.
2.  **Tầng Vector Matrix**:
    - `data/xsmb/xsmb-2-digits.parquet`: Modulo 100 cho 27 giải.
    - `data/xsmb/xsmb-sparse.parquet`: Ma trận 100 cột lưu số nháy xuất hiện mỗi ngày.
3.  **Tầng Pre-indexed Serving (Hai cấp độ)**:
    - **Cấp độ 1 (Tổng quan - Fast Summary)**: `web/public/data/xsmb_index.json` (~400KB)
      Chứa toàn bộ 100 số: tổng lần về, lần đầu, lần gần nhất, số ngày chưa về, chu kỳ gan, phân bố theo từng năm, 30 lần gần nhất.
    - **Cấp độ 2 (Lịch sử chi tiết theo nhu cầu - On-Demand History Chunks)**:
      Thư mục `web/public/data/history/xsmb/{number}.json` (~30KB/file) và `web/public/data/history/vietlott_655/{number}.json`:
      Chứa 100% danh sách tất cả các ngày đã về trong 20 năm. Trình duyệt chỉ tải khi người dùng bấm xem chi tiết số đó, giúp tiết kiệm băng thông và bộ nhớ tuyệt đối.

---

## 3. LỘ TRÌNH THỰC THI (ROADMAP)
*   **Phase 1**: Nâng cấp Data Engine (`gap_analyzer.py`, `index_builder.py`) xuất cấu trúc dữ liệu tra cứu lịch sử 2 cấp độ (Summary + Detailed History Chunks).
*   **Phase 2**: Nâng cấp giao diện Web `InstantLookupModal.tsx`:
    - Thẻ chỉ số tổng quan (Ngày đầu, ngày gần nhất, tổng số lần, kỷ lục gan).
    - Bộ lọc Năm (2005 - 2026) cho danh sách ngày về.
    - Biểu đồ thanh phân bố tần suất theo từng năm (Yearly Distribution).
    - Tab tra cứu Cặp Lô Xiên (Xiên 2).
*   **Phase 3**: Tự động hóa GitHub Actions & Sinh README:
    - Script `engine/render_readme.py`: Tạo bảng kết quả XSMB và đầu/đuôi loto hôm nay vào `README.md`.
    - Workflow `.github/workflows/daily-crawler.yml`: Tự động cào hàng ngày và commit.
    - Workflow `.github/workflows/deploy-pages.yml`: Tự động build và deploy lên GitHub Pages.
*   **Phase 4**: Khởi tạo Git repo, kiểm thử toàn diện và bàn giao.
