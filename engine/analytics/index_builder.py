import json
from pathlib import Path
from loguru import logger
import polars as pl

from engine.analytics.matrix_builder import MatrixBuilder
from engine.analytics.gap_analyzer import GapAnalyzer

class IndexBuilder:
    """Xây dựng và xuất các file chỉ mục tra cứu tốc độ cao phục vụ Web Application."""

    def __init__(
        self,
        data_dir_xsmb: Path = Path("data/xsmb"),
        data_dir_vietlott: Path = Path("data/vietlott"),
        web_data_dir: Path = Path("web/public/data"),
    ):
        self.data_dir_xsmb = data_dir_xsmb
        self.data_dir_vietlott = data_dir_vietlott
        self.web_data_dir = web_data_dir
        self.matrix_builder = MatrixBuilder(data_dir_xsmb, data_dir_vietlott)
        self.gap_analyzer = GapAnalyzer(data_dir_xsmb, data_dir_vietlott)

    def build_all_indexes(self) -> None:
        """Thực thi toàn bộ quy trình: Xây dựng ma trận -> Phân tích -> Xuất chỉ mục JSON."""
        logger.info("1/3: Xây dựng ma trận thưa và tệp Parquet...")
        self.matrix_builder.build_all()

        logger.info("2/3: Phân tích thống kê XSMB và Vietlott...")
        xsmb_data = self.gap_analyzer.analyze_xsmb()
        vietlott_655 = self.gap_analyzer.analyze_vietlott_product("power_655")
        vietlott_645 = self.gap_analyzer.analyze_vietlott_product("power_645")

        logger.info("3/3: Xuất file JSON chỉ mục và thư mục lịch sử chi tiết...")
        self.web_data_dir.mkdir(parents=True, exist_ok=True)

        history_xsmb_dir = self.web_data_dir / "history" / "xsmb"
        history_xsmb_dir.mkdir(parents=True, exist_ok=True)
        xsmb_full = xsmb_data.pop("_full_histories", {})
        for num_str, hist in xsmb_full.items():
            with open(history_xsmb_dir / f"{num_str}.json", "w", encoding="utf-8") as f:
                json.dump(hist, f, ensure_ascii=False)

        history_655_dir = self.web_data_dir / "history" / "vietlott_655"
        history_655_dir.mkdir(parents=True, exist_ok=True)
        v655_full = vietlott_655.pop("_full_histories", {})
        for num_str, hist in v655_full.items():
            with open(history_655_dir / f"{num_str}.json", "w", encoding="utf-8") as f:
                json.dump(hist, f, ensure_ascii=False)

        history_645_dir = self.web_data_dir / "history" / "vietlott_645"
        history_645_dir.mkdir(parents=True, exist_ok=True)
        v645_full = vietlott_645.pop("_full_histories", {})
        for num_str, hist in v645_full.items():
            with open(history_645_dir / f"{num_str}.json", "w", encoding="utf-8") as f:
                json.dump(hist, f, ensure_ascii=False)

        # Lưu các file chỉ mục riêng biệt
        with open(self.web_data_dir / "xsmb_index.json", "w", encoding="utf-8") as f:
            json.dump(xsmb_data, f, ensure_ascii=False, indent=2)

        with open(self.web_data_dir / "vietlott_655_index.json", "w", encoding="utf-8") as f:
            json.dump(vietlott_655, f, ensure_ascii=False, indent=2)

        with open(self.web_data_dir / "vietlott_645_index.json", "w", encoding="utf-8") as f:
            json.dump(vietlott_645, f, ensure_ascii=False, indent=2)

        # Tạo file tổng quan nhẹ để Web App tải trang đầu cực nhanh
        summary_payload = {
            "xsmb_latest": xsmb_data.get("latest_draw"),
            "xsmb_top_gan": xsmb_data.get("top_gan"),
            "xsmb_top_frequent": xsmb_data.get("top_frequent"),
            "vietlott_655_latest": vietlott_655.get("latest_draw"),
            "vietlott_655_top_gan": vietlott_655.get("top_gan"),
            "vietlott_645_latest": vietlott_645.get("latest_draw"),
            "vietlott_645_top_gan": vietlott_645.get("top_gan"),
            "generated_at": xsmb_data.get("metadata", {}).get("generated_at"),
        }

        # Bổ sung kết quả mới nhất của Max 3D, 3D Pro và Keno
        p3d_file = self.data_dir_vietlott / "3d.jsonl"
        if p3d_file.exists():
            try:
                with open(p3d_file, "r", encoding="utf-8") as f:
                    lines = [ln.strip() for ln in f if ln.strip()]
                    if lines:
                        summary_payload["vietlott_3d_latest"] = json.loads(lines[-1])
            except Exception as e:
                logger.warning(f"Lỗi đọc 3d.jsonl: {e}")

        p3d_pro_file = self.data_dir_vietlott / "3d_pro.jsonl"
        if p3d_pro_file.exists():
            try:
                with open(p3d_pro_file, "r", encoding="utf-8") as f:
                    lines = [ln.strip() for ln in f if ln.strip()]
                    if lines:
                        summary_payload["vietlott_3d_pro_latest"] = json.loads(lines[-1])
            except Exception as e:
                logger.warning(f"Lỗi đọc 3d_pro.jsonl: {e}")

        keno_file = self.data_dir_vietlott / "keno.jsonl"
        if keno_file.exists():
            try:
                with open(keno_file, "r", encoding="utf-8") as f:
                    lines = [ln.strip() for ln in f if ln.strip()]
                    if lines:
                        summary_payload["vietlott_keno_latest"] = json.loads(lines[-1])
            except Exception as e:
                logger.warning(f"Lỗi đọc keno.jsonl: {e}")

        # Bổ sung xuất danh sách kỳ quay gần nhất XSMB phục vụ tab Lịch Sử
        self.export_xsmb_recent_draws(limit=365)

        with open(self.web_data_dir / "summary.json", "w", encoding="utf-8") as f:
            json.dump(summary_payload, f, ensure_ascii=False, indent=2)

        logger.info(f"Hoàn thành xuất chỉ mục JSON và {len(xsmb_full)} tệp lịch sử chi tiết vào {self.web_data_dir}!")

    def export_xsmb_recent_draws(self, limit: int = 365) -> None:
        """Xuất danh sách các kỳ mở thưởng gần nhất kèm đầy đủ 27 giải và đầu đuôi loto phục vụ tab Lịch Sử."""
        csv_file = self.data_dir_xsmb / "xsmb.csv"
        if not csv_file.exists():
            logger.warning(f"Không tìm thấy file {csv_file}")
            return

        try:
            import pandas as pd
            from datetime import datetime

            self.web_data_dir.mkdir(parents=True, exist_ok=True)
            df = pd.read_csv(csv_file)
            if df.empty:
                return

            recent = df.tail(limit)
            prize_cols = [c for c in df.columns if c != "date"]

            province_map = {
                0: ("Thứ Hai", "Hà Nội"),
                1: ("Thứ Ba", "Quảng Ninh"),
                2: ("Thứ Tư", "Bắc Ninh"),
                3: ("Thứ Năm", "Hà Nội"),
                4: ("Thứ Sáu", "Hải Phòng"),
                5: ("Thứ Bảy", "Nam Định"),
                6: ("Chủ Nhật", "Thái Bình"),
            }

            draws = []
            for _, row in recent.iterrows():
                date_str = str(row["date"])
                dt = datetime.strptime(date_str, "%Y-%m-%d")
                dow, prov = province_map[dt.weekday()]

                loto_nums = []
                raw = {}
                for col in prize_cols:
                    val = int(row[col])
                    raw[col] = val
                    loto_nums.append(val % 100)

                loto_sorted = [f"{n:02d}" for n in sorted(loto_nums)]
                heads = {str(i): sorted([d % 10 for d in loto_nums if d // 10 == i]) for i in range(10)}
                tails = {str(i): sorted([d // 10 for d in loto_nums if d % 10 == i]) for i in range(10)}
                silent_heads = [i for i in range(10) if len(heads[str(i)]) == 0]
                silent_tails = [i for i in range(10) if len(tails[str(i)]) == 0]

                sp_val = int(row["special"])
                sp_str = f"{sp_val:05d}"
                p1_val = int(row["prize1"])
                p1_str = f"{p1_val:05d}"

                draws.append({
                    "date": date_str,
                    "day_of_week": dow,
                    "province": prov,
                    "special": sp_str,
                    "special_2d": sp_str[-2:],
                    "prize1": p1_str,
                    "raw_prizes": raw,
                    "loto_numbers": loto_sorted,
                    "heads": heads,
                    "tails": tails,
                    "silent_heads": silent_heads,
                    "silent_tails": silent_tails,
                })

            draws.reverse()

            output_file = self.web_data_dir / "xsmb_recent_draws.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(draws, f, ensure_ascii=False)

            logger.info(f"Đã xuất {len(draws)} kỳ quay XSMB gần nhất vào {output_file}")
        except Exception as e:
            logger.error(f"Lỗi khi xuất xsmb_recent_draws.json: {e}")

