import json
from pathlib import Path
from itertools import combinations
from datetime import datetime
import polars as pl
from loguru import logger

class VietlottCombinationAnalyzer:
    """
    Phân tích Bộ Số & Tổ Hợp Toàn Bộ Lịch Sử Vietlott (Power 6/55 & Mega 6/45).
    Trích xuất toàn bộ kỳ quay để hỗ trợ Client-side Set Matching siêu tốc (<2ms),
    và tính toán ma trận Top Cặp Số (Pairs) & Top Bộ Ba (Triplets) hay về cùng nhau nhất.
    """

    def __init__(
        self,
        vietlott_dir: str = "data/vietlott",
        output_draws_path: str = "web/public/data/vietlott_full_draws.json",
        output_matrix_path: str = "web/public/data/vietlott_cooccurrence.json"
    ):
        self.vietlott_dir = Path(vietlott_dir)
        self.output_draws_path = Path(output_draws_path)
        self.output_matrix_path = Path(output_matrix_path)

    def extract_full_draws(self) -> dict:
        """Trích xuất danh sách gọn nhẹ của toàn bộ kỳ quay phục vụ client-side matching"""
        logger.info("Đang trích xuất toàn bộ kỳ quay Vietlott 6/55 và 6/45...")

        p655_path = self.vietlott_dir / "power655.parquet"
        p645_path = self.vietlott_dir / "power645.parquet"

        draws_655 = []
        if p655_path.exists():
            df655 = pl.read_parquet(p655_path).sort("date")
            for row in df655.iter_rows(named=True):
                res = row["result"]
                if isinstance(res, list) and len(res) >= 6:
                    main_balls = [int(x) for x in res[:6]]
                    special_ball = int(res[6]) if len(res) > 6 else None
                    draws_655.append({
                        "id": str(row["id"]),
                        "date": str(row["date"]),
                        "balls": main_balls,
                        "special": special_ball
                    })

        draws_645 = []
        if p645_path.exists():
            df645 = pl.read_parquet(p645_path).sort("date")
            for row in df645.iter_rows(named=True):
                res = row["result"]
                if isinstance(res, list) and len(res) >= 6:
                    main_balls = [int(x) for x in res[:6]]
                    draws_645.append({
                        "id": str(row["id"]),
                        "date": str(row["date"]),
                        "balls": main_balls
                    })

        full_data = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "total_655": len(draws_655),
                "total_645": len(draws_645),
            },
            "vietlott_655": draws_655,
            "vietlott_645": draws_645
        }

        self.output_draws_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.output_draws_path, "w", encoding="utf-8") as f:
            json.dump(full_data, f, ensure_ascii=False)

        logger.info(f"-> Đã lưu {len(draws_655)} kỳ 6/55 và {len(draws_645)} kỳ 6/45 vào {self.output_draws_path}")
        return full_data

    def analyze_cooccurrence(self, full_data: dict) -> dict:
        """Tính toán Top Cặp số (Pairs) và Top Bộ ba (Triplets) hay xuất hiện cùng nhau nhất"""
        logger.info("Đang tính toán ma trận Cặp số & Bộ ba thường về cùng nhau...")

        def get_top_pairs_and_triplets(draws_list, max_num):
            pair_counts = {}
            triplet_counts = {}
            last_seen_pair = {}
            last_seen_triplet = {}

            for draw in draws_list:
                balls = sorted(draw["balls"][:6])
                date = draw["date"]
                draw_id = draw["id"]

                # Cặp 2 số
                for c in combinations(balls, 2):
                    pair_counts[c] = pair_counts.get(c, 0) + 1
                    last_seen_pair[c] = {"date": date, "id": draw_id}

                # Bộ 3 số
                for c in combinations(balls, 3):
                    triplet_counts[c] = triplet_counts.get(c, 0) + 1
                    last_seen_triplet[c] = {"date": date, "id": draw_id}

            # Lấy Top 25 Cặp
            sorted_pairs = sorted(pair_counts.items(), key=lambda x: x[1], reverse=True)[:25]
            top_pairs = []
            for pair, count in sorted_pairs:
                top_pairs.append({
                    "numbers": [f"{pair[0]:02d}", f"{pair[1]:02d}"],
                    "hits": count,
                    "rate": round((count / len(draws_list)) * 100, 2),
                    "last_seen": last_seen_pair[pair]
                })

            # Lấy Top 20 Bộ Ba
            sorted_triplets = sorted(triplet_counts.items(), key=lambda x: x[1], reverse=True)[:20]
            top_triplets = []
            for trip, count in sorted_triplets:
                top_triplets.append({
                    "numbers": [f"{trip[0]:02d}", f"{trip[1]:02d}", f"{trip[2]:02d}"],
                    "hits": count,
                    "rate": round((count / len(draws_list)) * 100, 2),
                    "last_seen": last_seen_triplet[trip]
                })

            return {"top_pairs": top_pairs, "top_triplets": top_triplets}

        cooc_655 = get_top_pairs_and_triplets(full_data["vietlott_655"], 55)
        cooc_645 = get_top_pairs_and_triplets(full_data["vietlott_645"], 45)

        result = {
            "metadata": {
                "generated_at": datetime.now().isoformat()
            },
            "vietlott_655": cooc_655,
            "vietlott_645": cooc_645
        }

        with open(self.output_matrix_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        logger.info(f"-> Đã lưu ma trận đồng xuất hiện Vietlott vào {self.output_matrix_path}")
        return result

    def run(self):
        full_draws = self.extract_full_draws()
        self.analyze_cooccurrence(full_draws)

if __name__ == "__main__":
    analyzer = VietlottCombinationAnalyzer()
    analyzer.run()
