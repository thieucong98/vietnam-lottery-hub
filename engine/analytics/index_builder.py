import json
from pathlib import Path
from loguru import logger

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
        with open(self.web_data_dir / "summary.json", "w", encoding="utf-8") as f:
            json.dump(summary_payload, f, ensure_ascii=False, indent=2)

        logger.info(f"Hoàn thành xuất chỉ mục JSON và {len(xsmb_full)} tệp lịch sử chi tiết vào {self.web_data_dir}!")
