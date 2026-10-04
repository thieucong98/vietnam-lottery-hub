# Vietnam Lottery & Vietlott Analytics Platform

[![Daily Pipeline](https://github.com/OWNER/REPO/actions/workflows/daily-crawler.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/daily-crawler.yml)
[![Deploy GitHub Pages](https://github.com/OWNER/REPO/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/deploy-pages.yml)

Nền tảng Tự Động Thu Thập, Phân Tích & Tra Cứu Kết Quả Xổ Số Kiến Thiết (XSMB) và Vietlott (Power 6/55, Mega 6/45, Max 3D, Keno).

> **Cập nhật tự động lần cuối:** 04/10/2026 22:54:30 (Giờ Việt Nam)  
> **Nguồn dữ liệu:** Cào tự động và lưu trữ lịch sử hơn 20 năm (2005 - nay).

---

## 🏆 KẾT QUẢ XSMB MỚI NHẤT (2026-10-04)

| Xổ Số Kiến Thiết Miền Bắc | Thống Kê Đầu - Đuôi Lô Tô |
| :--- | :--- |
| <table><tr><td><strong>Ngày quay</strong></td><td><strong>2026-10-04</strong></td></tr><tr><td><strong>Giải Đặc Biệt</strong></td><td><strong style="color:red; font-size:1.15em;">82951</strong></td></tr><tr><td>Giải Nhất</td><td><strong>28235</strong></td></tr><tr><td>Giải Nhì</td><td>82614, 47824</td></tr><tr><td>Giải Ba</td><td>33386, 23385, 09503<br>43582, 60243, 04348</td></tr><tr><td>Giải Tư</td><td>2251, 1053, 3431, 9308</td></tr><tr><td>Giải Năm</td><td>3969, 7927, 5509<br>2889, 4781, 1038</td></tr><tr><td>Giải Sáu</td><td>237, 580, 604</td></tr><tr><td>Giải Bảy</td><td>90, 89, 26, 59</td></tr></table> | <table><tr><th>Đầu</th><th>Đuôi Lô Tô</th></tr><tr><td><strong>0</strong></td><td>3, 4, 8, 9</td></tr><tr><td><strong>1</strong></td><td>4</td></tr><tr><td><strong>2</strong></td><td>4, 6, 7</td></tr><tr><td><strong>3</strong></td><td>1, 5, 7, 8</td></tr><tr><td><strong>4</strong></td><td>3, 8</td></tr><tr><td><strong>5</strong></td><td>1, 1, 3, 9</td></tr><tr><td><strong>6</strong></td><td>9</td></tr><tr><td><strong>7</strong></td><td>—</td></tr><tr><td><strong>8</strong></td><td>0, 1, 2, 5, 6, 9, 9</td></tr><tr><td><strong>9</strong></td><td>0</td></tr></table> |

---

## 🎯 KẾT QUẢ VIETLOTT MỚI NHẤT

### 1. Vietlott Power 6/55 (Kỳ #01406 - Ngày 2026-10-03)
`[07]` `[11]` `[13]` `[16]` `[18]` `[54]` | `★ [41]` (Số Đặc Biệt)

### 2. Vietlott Mega 6/45 (Kỳ #01568 - Ngày 2026-09-27)
`[02]` `[04]` `[13]` `[25]` `[31]` `[39]`

---

## 🚀 TÍNH NĂNG NỔI BẬT

1. **Tra Cứu Lịch Sử Siêu Tốc (Zero Latency Instant Lookup)**:
   - Tra cứu xem bất kỳ số nào (00 - 99 hoặc 01 - 55) đã từng về trong lịch sử chưa.
   - Thống kê ngày đầu tiên xuất hiện, ngày gần nhất về (cách đây bao nhiêu ngày).
   - Tổng số lần về trong 20 năm, số lần trúng Giải Đặc Biệt (Đề).
   - Biểu đồ phân bố xuất hiện theo từng năm (2005 - 2026).
   - Tra cứu dòng thời gian toàn bộ các ngày đã về kèm chi tiết giải trúng và bộ lọc Năm/Tháng.
   - Tra cứu Cặp Lô Xiên (Xiên 2): Kiểm tra xem 2 số đã từng cùng về ngày nào chưa, bao nhiêu lần và lần gần nhất là khi nào.

2. **Phân Tích Thống Kê & Bạc Nhớ Khoa Học**:
   - Bảng xếp hạng Lô Gan cực đại lịch sử và thước đo nguy cơ gan (Risk Gauge).
   - Ma trận đồng xuất hiện (Co-occurrence Matrix): Tìm 5 cặp số hay về cùng nhau nhất trên dữ liệu 1 năm qua.
   - Bản đồ nhiệt (Heatmap Matrix) 100 số trực quan.
   - Chiến lược xác suất thống kê (Markov Chain, Exponential Decay, Mean Reversion) kèm báo cáo Backtest khách quan.

3. **Tự Động Hóa 100% Bằng GitHub Actions**:
   - Tự động cào kết quả hàng ngày lúc **18:35** (XSMB) và **18:45** (Vietlott).
   - Tự động cập nhật ma trận thưa, chỉ mục JSON và commit lại repository.
   - Tự động render bảng kết quả mới nhất vào `README.md`.
   - Tự động deploy Web App lên GitHub Pages hoàn toàn miễn phí.

---

## 🛠 HƯỚNG DẪN CÀI ĐẶT & CHẠY LOCAL

### 1. Chạy Python Engine
```bash
# Cài đặt thư viện với uv hoặc pip
uv sync

# Chạy toàn bộ pipeline (cào dữ liệu, xử lý ma trận, tạo chỉ mục, render README)
uv run python scripts/run_pipeline.py

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

## ⚖️ TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM (DISCLAIMER)

Dự án này được phát triển hoàn toàn vì mục đích **học tập, nghiên cứu khoa học dữ liệu, kỹ thuật dữ liệu (Data Engineering) và tự động hóa**. Xổ số là trò chơi có bản chất ngẫu nhiên độc lập về mặt toán học. Dự án này **KHÔNG** khuyến khích cờ bạc dưới mọi hình thức và **KHÔNG** đảm bảo bất kỳ kết quả dự đoán nào.
