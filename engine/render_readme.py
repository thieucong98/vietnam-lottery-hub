from datetime import datetime
import json
from pathlib import Path
import pandas as pd
import polars as pl
from loguru import logger

README_TEMPLATE = """# Vietnam Lottery & Vietlott Analytics Platform (vietnam-lottery-hub)

[![Daily Pipeline](https://github.com/thieucong98/vietnam-lottery-hub/actions/workflows/daily-crawler.yml/badge.svg)](https://github.com/thieucong98/vietnam-lottery-hub/actions/workflows/daily-crawler.yml)
[![Deploy GitHub Pages](https://github.com/thieucong98/vietnam-lottery-hub/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/thieucong98/vietnam-lottery-hub/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Legal Compliance](https://img.shields.io/badge/Compliance-Legal%20Disclaimer%20%26%2018%2B-emerald.svg)](LEGAL_DISCLAIMER.md)

> 🌐 **Live Web Demo:** [https://thieucong98.github.io/vietnam-lottery-hub/](https://thieucong98.github.io/vietnam-lottery-hub/)  
> **Cập nhật tự động lần cuối:** {updated_at} (Giờ Việt Nam)  
> **Nguồn dữ liệu:** Cào tự động và lưu trữ lịch sử hơn 20 năm (2005 - nay).

---

## 🏆 KẾT QUẢ XSMB MỚI NHẤT ({xsmb_date})

| Xổ Số Kiến Thiết Miền Bắc | Thống Kê Đầu - Đuôi Lô Tô |
| :--- | :--- |
| <table><tr><td><strong>Ngày quay</strong></td><td><strong>{xsmb_date}</strong></td></tr><tr><td><strong>Giải Đặc Biệt</strong></td><td><strong style="color:red; font-size:1.15em;">{special}</strong></td></tr><tr><td>Giải Nhất</td><td><strong>{prize1}</strong></td></tr><tr><td>Giải Nhì</td><td>{prize2}</td></tr><tr><td>Giải Ba</td><td>{prize3_part1}<br>{prize3_part2}</td></tr><tr><td>Giải Tư</td><td>{prize4}</td></tr><tr><td>Giải Năm</td><td>{prize5_part1}<br>{prize5_part2}</td></tr><tr><td>Giải Sáu</td><td>{prize6}</td></tr><tr><td>Giải Bảy</td><td>{prize7}</td></tr></table> | <table><tr><th>Đầu</th><th>Đuôi Lô Tô</th></tr>{heads_table_rows}</table> |

---

## 🎯 KẾT QUẢ VIETLOTT MỚI NHẤT

### 1. Vietlott Power 6/55 (Kỳ #{p655_id} - Ngày {p655_date})
{p655_balls}

### 2. Vietlott Mega 6/45 (Kỳ #{p645_id} - Ngày {p645_date})
{p645_balls}

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
"""

def render_readme():
    logger.info("Đang đọc dữ liệu để render README.md...")
    
    # 1. Đọc dữ liệu XSMB
    csv_xsmb = Path("data/xsmb/xsmb.csv")
    csv_2digits = Path("data/xsmb/xsmb-2-digits.csv")
    
    if not csv_xsmb.exists() or not csv_2digits.exists():
        logger.warning("Chưa có dữ liệu XSMB để render README.")
        return

    df_raw = pd.read_csv(csv_xsmb)
    df_2digits = pd.read_csv(csv_2digits)
    
    last_row = df_raw.iloc[-1].to_dict()
    last_2digits_row = df_2digits.iloc[-1].to_dict()
    xsmb_date = last_row["date"]
    
    # Định dạng giải
    special = f"{last_row['special']:05d}"
    prize1 = f"{last_row['prize1']:05d}"
    prize2 = f"{last_row['prize2_1']:05d}, {last_row['prize2_2']:05d}"
    prize3_part1 = f"{last_row['prize3_1']:05d}, {last_row['prize3_2']:05d}, {last_row['prize3_3']:05d}"
    prize3_part2 = f"{last_row['prize3_4']:05d}, {last_row['prize3_5']:05d}, {last_row['prize3_6']:05d}"
    prize4 = f"{last_row['prize4_1']:04d}, {last_row['prize4_2']:04d}, {last_row['prize4_3']:04d}, {last_row['prize4_4']:04d}"
    prize5_part1 = f"{last_row['prize5_1']:04d}, {last_row['prize5_2']:04d}, {last_row['prize5_3']:04d}"
    prize5_part2 = f"{last_row['prize5_4']:04d}, {last_row['prize5_5']:04d}, {last_row['prize5_6']:04d}"
    prize6 = f"{last_row['prize6_1']:03d}, {last_row['prize6_2']:03d}, {last_row['prize6_3']:03d}"
    prize7 = f"{last_row['prize7_1']:02d}, {last_row['prize7_2']:02d}, {last_row['prize7_3']:02d}, {last_row['prize7_4']:02d}"

    # Bảng đầu đuôi loto
    prize_cols = [c for c in df_2digits.columns if c != "date"]
    loto_nums = [last_2digits_row[p] for p in prize_cols]
    
    heads = {}
    for i in range(10):
        tails = sorted([d % 10 for d in loto_nums if d // 10 == i])
        heads[str(i)] = ", ".join(map(str, tails)) if tails else "—"

    heads_rows = ""
    for i in range(10):
        heads_rows += f"<tr><td><strong>{i}</strong></td><td>{heads[str(i)]}</td></tr>"

    # 2. Đọc Vietlott Power 6/55
    p655_path = Path("data/vietlott/power655.jsonl")
    p655_date, p655_id, p655_balls = "N/A", "N/A", "Chưa có dữ liệu"
    if p655_path.exists():
        df_655 = pl.read_ndjson(p655_path)
        if not df_655.is_empty():
            rec = df_655.sort(["date", "id"]).to_dicts()[-1]
            p655_date = rec["date"]
            p655_id = rec["id"]
            balls = rec.get("result", [])
            p655_balls = " ".join([f"`[{n:02d}]`" for n in balls[:6]])
            if len(balls) > 6:
                p655_balls += f" | `★ [{balls[6]:02d}]` (Số Đặc Biệt)"

    # 3. Đọc Vietlott Mega 6/45
    p645_path = Path("data/vietlott/power645.jsonl")
    p645_date, p645_id, p645_balls = "N/A", "N/A", "Chưa có dữ liệu"
    if p645_path.exists():
        df_645 = pl.read_ndjson(p645_path)
        if not df_645.is_empty():
            rec = df_645.sort(["date", "id"]).to_dicts()[-1]
            p645_date = rec["date"]
            p645_id = rec["id"]
            balls = rec.get("result", [])
            p645_balls = " ".join([f"`[{n:02d}]`" for n in balls[:6]])

    now_vn = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    readme_content = README_TEMPLATE.format(
        updated_at=now_vn,
        xsmb_date=xsmb_date,
        special=special,
        prize1=prize1,
        prize2=prize2,
        prize3_part1=prize3_part1,
        prize3_part2=prize3_part2,
        prize4=prize4,
        prize5_part1=prize5_part1,
        prize5_part2=prize5_part2,
        prize6=prize6,
        prize7=prize7,
        heads_table_rows=heads_rows,
        p655_id=p655_id,
        p655_date=p655_date,
        p655_balls=p655_balls,
        p645_id=p645_id,
        p645_date=p645_date,
        p645_balls=p645_balls,
    )

    with open("README.md", "w", encoding="utf-8") as f:
        f.write(readme_content)

    logger.info("Đã cập nhật bảng kết quả sống động vào README.md thành công!")

if __name__ == "__main__":
    render_readme()
