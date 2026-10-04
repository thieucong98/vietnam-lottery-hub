from datetime import datetime
import json
from pathlib import Path
import numpy as np
import polars as pl
from loguru import logger

class BacNhoAnalyzer:
    """
    Phân tích Bạc Nhớ Khoa Học dựa trên 20 năm dữ liệu XSMB (7,500+ kỳ quay).
    Tính toán xác suất có điều kiện: P(Số Y về ngày T+1 | Số X về ngày T)
    """

    def __init__(self, data_dir: str = "data/xsmb", output_path: str = "web/public/data/bac_nho.json"):
        self.data_dir = Path(data_dir)
        self.output_path = Path(output_path)

    def analyze(self) -> dict:
        logger.info("Bắt đầu phân tích Bạc Nhớ 20 năm từ dữ liệu XSMB...")
        
        sparse_file = self.data_dir / "xsmb-sparse.parquet"
        xsmb_file = self.data_dir / "xsmb.parquet"

        if not sparse_file.exists() or not xsmb_file.exists():
            raise FileNotFoundError("Không tìm thấy tệp parquet xsmb hoặc xsmb-sparse")

        # 1. Đọc dữ liệu
        sparse_df = pl.read_parquet(sparse_file).sort("date")
        xsmb_df = pl.read_parquet(xsmb_file).sort("date")

        dates = sparse_df["date"].to_list()
        n_draws = len(dates)

        # Chuyển đổi ma trận thưa 100 số sang numpy array boolean (có về hay không)
        # Các cột là '0', '1', ..., '99'
        num_cols = [str(i) for i in range(100)]
        # Ma trận nhị phân shape: (n_draws, 100) -> 1 nếu số xuất hiện >= 1 lần
        sparse_matrix = (sparse_df.select(num_cols).to_numpy() > 0).astype(np.int8)

        # Trích xuất 2 số cuối giải đặc biệt cho mỗi ngày
        special_series = xsmb_df["special"].to_numpy()
        special_2d = np.array([int(s) % 100 if s is not None and not np.isnan(s) else -1 for s in special_series])

        # Tính toán ngày cách đây bao nhiêu ngày cho mỗi số (current gap)
        latest_hits = sparse_matrix[-1, :]
        current_gaps = {}
        for num_idx in range(100):
            # Tìm ngày gần nhất mà số num_idx xuất hiện
            indices = np.where(sparse_matrix[:, num_idx] > 0)[0]
            if len(indices) > 0:
                last_idx = indices[-1]
                gap = (n_draws - 1) - last_idx
            else:
                gap = 999
            current_gaps[f"{num_idx:02d}"] = int(gap)

        latest_date = dates[-1]
        latest_special_val = f"{special_2d[-1]:02d}" if special_2d[-1] >= 0 else "00"

        # 2. Phân tích Bạc Nhớ Theo Lô (Loto -> Next Day Loto)
        # T: matrix[:-1, :], T+1: matrix[1:, :]
        matrix_today = sparse_matrix[:-1, :]     # (N-1, 100)
        matrix_next = sparse_matrix[1:, :]       # (N-1, 100)

        by_loto = {}
        for num_x in range(100):
            num_x_str = f"{num_x:02d}"
            # Tìm các kỳ T mà num_x xuất hiện
            t_indices = np.where(matrix_today[:, num_x] > 0)[0]
            total_triggers = len(t_indices)

            if total_triggers == 0:
                continue

            # Các kỳ T+1 tương ứng
            next_appearances = matrix_next[t_indices, :]  # (total_triggers, 100)
            follower_hits = np.sum(next_appearances, axis=0)  # (100,)

            # Sắp xếp top các con số về nhiều nhất ở ngày T+1
            top_indices = np.argsort(follower_hits)[::-1]

            top_followers = []
            for rank_idx in top_indices[:10]:
                follower_num = int(rank_idx)
                hits = int(follower_hits[follower_num])
                rate = round((hits / total_triggers) * 100, 1)
                follower_str = f"{follower_num:02d}"
                top_followers.append({
                    "number": follower_str,
                    "hits": hits,
                    "rate": rate,
                    "days_since_last": current_gaps.get(follower_str, 0)
                })

            by_loto[num_x_str] = {
                "number": num_x_str,
                "total_triggers": total_triggers,
                "top_followers": top_followers
            }

        # 3. Phân tích Bạc Nhớ Theo Giải Đặc Biệt (Special 2D -> Next Day Loto)
        special_today = special_2d[:-1]  # (N-1,)
        by_special = {}

        for special_val in range(100):
            special_str = f"{special_val:02d}"
            t_indices = np.where(special_today == special_val)[0]
            total_triggers = len(t_indices)

            if total_triggers == 0:
                continue

            next_appearances = matrix_next[t_indices, :]  # (total_triggers, 100)
            follower_hits = np.sum(next_appearances, axis=0)

            top_indices = np.argsort(follower_hits)[::-1]
            top_followers = []
            for rank_idx in top_indices[:10]:
                follower_num = int(rank_idx)
                hits = int(follower_hits[follower_num])
                rate = round((hits / total_triggers) * 100, 1)
                follower_str = f"{follower_num:02d}"
                top_followers.append({
                    "number": follower_str,
                    "hits": hits,
                    "rate": rate,
                    "days_since_last": current_gaps.get(follower_str, 0)
                })

            by_special[special_str] = {
                "special_number": special_str,
                "total_triggers": total_triggers,
                "top_followers": top_followers
            }

        result = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "latest_date": latest_date,
                "latest_special_2d": latest_special_val,
                "total_draws_analyzed": n_draws
            },
            "by_loto": by_loto,
            "by_special": by_special
        }

        # Lưu file JSON
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        logger.info(f"Đã xuất phân tích Bạc Nhớ 20 năm thành công vào {self.output_path}")
        return result

if __name__ == "__main__":
    analyzer = BacNhoAnalyzer()
    analyzer.analyze()
