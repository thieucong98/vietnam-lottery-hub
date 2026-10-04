from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Tuple
from loguru import logger
import numpy as np
import pandas as pd
import polars as pl

class GapAnalyzer:
    """Phân tích chuyên sâu về chu kỳ nhịp, lô gan, khoảng cách xuất hiện và cặp số đi kèm."""

    def __init__(self, data_dir_xsmb: Path = Path("data/xsmb"), data_dir_vietlott: Path = Path("data/vietlott")):
        self.data_dir_xsmb = data_dir_xsmb
        self.data_dir_vietlott = data_dir_vietlott

    def analyze_xsmb(self) -> Dict[str, Any]:
        """Phân tích toàn diện 100 số (00-99) của XSMB từ lịch sử 20 năm."""
        csv_2digits = self.data_dir_xsmb / "xsmb-2-digits.csv"
        sparse_csv = self.data_dir_xsmb / "xsmb-sparse.csv"

        if not csv_2digits.exists() or not sparse_csv.exists():
            raise FileNotFoundError("Chưa tạo ma trận 2-digits hoặc sparse. Hãy chạy MatrixBuilder trước.")

        df_2digits = pd.read_csv(csv_2digits)
        df_sparse = pd.read_csv(sparse_csv)

        dates = df_2digits["date"].tolist()
        total_draws = len(dates)
        latest_date_str = dates[-1]
        latest_date = datetime.strptime(latest_date_str, "%Y-%m-%d").date()

        prize_cols = [c for c in df_2digits.columns if c != "date"]
        sparse_cols = [str(i) for i in range(100)]
        sparse_matrix = df_sparse[sparse_cols].values # (N, 100)

        # Tính ma trận đồng xuất hiện (Co-occurrence matrix) trên 1 năm gần nhất (365 kỳ)
        recent_window = min(365, total_draws)
        recent_binary = (sparse_matrix[-recent_window:] > 0).astype(int)
        co_occurrence = np.dot(recent_binary.T, recent_binary) # 100 x 100

        result_index = {}
        top_gan_list = []
        top_frequent_list = []

        full_histories = {}

        for num in range(100):
            num_str = f"{num:02d}"
            # Các index mà số này xuất hiện (nháy > 0)
            hit_indices = np.where(sparse_matrix[:, num] > 0)[0]
            total_hits = int(sparse_matrix[:, num].sum())

            if len(hit_indices) == 0:
                current_gap = total_draws
                max_gap = total_draws
                avg_gap = float(total_draws)
                first_seen_date = None
                last_seen_date = None
                yearly_dist = {}
                num_full_history = []
            else:
                first_seen_date = dates[hit_indices[0]]
                last_idx = hit_indices[-1]
                current_gap = int(total_draws - 1 - last_idx)
                last_seen_date = dates[last_idx]

                # Phân bố xuất hiện theo năm
                years = [dates[idx][:4] for idx in hit_indices]
                yearly_dist = dict(sorted(Counter(years).items()))

                # Tính khoảng cách giữa các lần xuất hiện liên tiếp
                gaps = []
                if len(hit_indices) > 1:
                    gaps = list(np.diff(hit_indices) - 1)
                gaps.append(hit_indices[0]) # gap trước lần đầu
                gaps.append(current_gap)    # gap hiện tại

                max_gap = int(max(gaps))
                avg_gap = round(float(np.mean(gaps)), 1)

                # Tạo danh sách toàn bộ lịch sử các ngày xuất hiện từ mới đến cũ
                num_full_history = []
                for idx in reversed(hit_indices):
                    d_str = dates[idx]
                    row = df_2digits.iloc[idx]
                    prizes_hit = [p for p in prize_cols if row[p] == num]
                    num_full_history.append({
                        "date": d_str,
                        "prizes": prizes_hit,
                        "hits": len(prizes_hit),
                        "is_special": "special" in prizes_hit,
                    })

            # Tần suất trong các khung thời gian gần đây
            f_30 = int(sparse_matrix[-30:, num].sum()) if total_draws >= 30 else int(sparse_matrix[:, num].sum())
            f_60 = int(sparse_matrix[-60:, num].sum()) if total_draws >= 60 else int(sparse_matrix[:, num].sum())
            f_100 = int(sparse_matrix[-100:, num].sum()) if total_draws >= 100 else int(sparse_matrix[:, num].sum())
            f_365 = int(sparse_matrix[-365:, num].sum()) if total_draws >= 365 else int(sparse_matrix[:, num].sum())

            # Kỷ lục gan và thang đo rủi ro
            risk_gauge = min(100.0, round((current_gap / max(1, max_gap)) * 100.0, 1))
            is_gan = current_gap >= max(10, int(avg_gap * 1.6))

            # Tìm 5 số hay về cùng nhất trong 365 ngày
            pair_scores = co_occurrence[num].copy()
            pair_scores[num] = 0 # bỏ chính nó
            top_pair_indices = np.argsort(pair_scores)[::-1][:5]
            top_pairs = [{"number": f"{idx:02d}", "co_count": int(pair_scores[idx])} for idx in top_pair_indices]

            # Lấy 30 lần xuất hiện gần nhất cho summary
            recent_appearances = num_full_history[:30]

            # Đếm số lần trúng giải đặc biệt (Đề)
            special_hits = int((df_2digits["special"] == num).sum())

            item_data = {
                "number": num_str,
                "total_hits": total_hits,
                "special_hits": special_hits,
                "first_seen_date": first_seen_date,
                "last_seen_date": last_seen_date,
                "days_since_last": current_gap,
                "max_gap_historical": max_gap,
                "average_gap": avg_gap,
                "freq_30d": f_30,
                "freq_60d": f_60,
                "freq_100d": f_100,
                "freq_365d": f_365,
                "is_gan": is_gan,
                "gan_risk_gauge": risk_gauge,
                "top_pairs": top_pairs,
                "yearly_distribution": yearly_dist,
                "recent_history": recent_appearances,
            }
            result_index[num_str] = item_data
            full_histories[num_str] = num_full_history
            top_gan_list.append({"number": num_str, "days_since": current_gap, "last_date": last_seen_date, "max_gap": max_gap})
            top_frequent_list.append({"number": num_str, "freq_100d": f_100, "total_hits": total_hits})

        top_gan_sorted = sorted(top_gan_list, key=lambda x: x["days_since"], reverse=True)[:15]
        top_freq_sorted = sorted(top_frequent_list, key=lambda x: x["freq_100d"], reverse=True)[:15]

        # Kết quả ngày gần nhất
        latest_row = df_2digits.iloc[-1].to_dict()
        latest_raw_row = pd.read_csv(self.data_dir_xsmb / "xsmb.csv").iloc[-1].to_dict()

        # Thống kê đầu - đuôi loto hôm nay
        recent_loto = [latest_row[p] for p in prize_cols]
        heads = {str(i): sorted([d % 10 for d in recent_loto if d // 10 == i]) for i in range(10)}
        tails = {str(i): sorted([d // 10 for d in recent_loto if d % 10 == i]) for i in range(10)}

        return {
            "metadata": {
                "latest_date": latest_date_str,
                "total_draws": total_draws,
                "generated_at": datetime.now().isoformat(),
            },
            "latest_draw": {
                "date": latest_date_str,
                "raw_prizes": latest_raw_row,
                "loto_numbers": [f"{n:02d}" for n in sorted(recent_loto)],
                "heads": heads,
                "tails": tails,
            },
            "top_gan": top_gan_sorted,
            "top_frequent": top_freq_sorted,
            "numbers": result_index,
            "_full_histories": full_histories,
        }

    def analyze_vietlott_product(self, product: str) -> Dict[str, Any]:
        """Phân tích thống kê cho sản phẩm Vietlott (Power 6/55 hoặc Mega 6/45)."""
        filename = "power655.jsonl" if product == "power_655" else "power645.jsonl"
        filepath = self.data_dir_vietlott / filename
        max_num = 55 if product == "power_655" else 45

        if not filepath.exists():
            return {}

        df = pl.read_ndjson(filepath)
        if df.is_empty():
            return {}

        df = df.sort(["date", "id"])
        records = df.to_dicts()
        total_draws = len(records)
        latest_record = records[-1]

        # Khởi tạo tracking
        appearances_by_num = {n: [] for n in range(1, max_num + 1)}
        for idx, rec in enumerate(records):
            nums = rec.get("result", [])
            for n in nums:
                if 1 <= n <= max_num:
                    appearances_by_num[n].append(idx)

        numbers_data = {}
        full_histories = {}
        top_gan = []
        top_freq = []

        for n in range(1, max_num + 1):
            n_str = f"{n:02d}"
            hits = appearances_by_num[n]
            total_hits = len(hits)

            if total_hits == 0:
                current_gap = total_draws
                max_gap = total_draws
                avg_gap = total_draws
                first_seen_date = None
                last_date = None
                yearly_dist = {}
                num_full_history = []
            else:
                first_seen_date = records[hits[0]]["date"]
                last_idx = hits[-1]
                current_gap = total_draws - 1 - last_idx
                last_date = records[last_idx]["date"]

                # Phân bố theo năm
                years = [records[idx]["date"][:4] for idx in hits]
                yearly_dist = dict(sorted(Counter(years).items()))

                gaps = []
                if len(hits) > 1:
                    gaps = list(np.diff(hits) - 1)
                gaps.append(hits[0])
                gaps.append(current_gap)
                max_gap = int(max(gaps))
                avg_gap = round(float(np.mean(gaps)), 1)

                num_full_history = []
                for idx in reversed(hits):
                    num_full_history.append({
                        "date": records[idx]["date"],
                        "id": records[idx]["id"],
                        "result": records[idx]["result"],
                    })

            # 30 kỳ gần nhất
            f_30 = sum(1 for idx in hits if idx >= total_draws - 30)
            f_100 = sum(1 for idx in hits if idx >= total_draws - 100)

            # Lịch sử 25 kỳ gần nhất
            recent_hist = num_full_history[:25]

            item = {
                "number": n_str,
                "total_hits": total_hits,
                "days_since_last": current_gap,
                "first_seen_date": first_seen_date,
                "last_seen_date": last_date,
                "max_gap_historical": max_gap,
                "average_gap": avg_gap,
                "freq_30d": f_30,
                "freq_100d": f_100,
                "gan_risk_gauge": min(100.0, round((current_gap / max(1, max_gap)) * 100.0, 1)),
                "yearly_distribution": yearly_dist,
                "recent_history": recent_hist,
            }
            numbers_data[n_str] = item
            full_histories[n_str] = num_full_history
            top_gan.append({"number": n_str, "days_since": current_gap, "last_date": last_date, "max_gap": max_gap})
            top_freq.append({"number": n_str, "total_hits": total_hits, "freq_100d": f_100})

        top_gan.sort(key=lambda x: x["days_since"], reverse=True)
        top_freq.sort(key=lambda x: x["total_hits"], reverse=True)

        return {
            "product": product,
            "metadata": {
                "latest_date": latest_record["date"],
                "latest_id": latest_record["id"],
                "total_draws": total_draws,
                "max_number": max_num,
            },
            "latest_draw": latest_record,
            "top_gan": top_gan[:10],
            "top_frequent": top_freq[:10],
            "numbers": numbers_data,
            "_full_histories": full_histories,
        }
