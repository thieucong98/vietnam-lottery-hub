from pathlib import Path
from typing import Optional
from loguru import logger
import numpy as np
import pandas as pd
import polars as pl

class MatrixBuilder:
    """Xây dựng ma trận 2 chữ số (2-digits), ma trận thưa (sparse matrix) và định dạng Parquet nén."""

    def __init__(self, data_dir_xsmb: Path = Path("data/xsmb"), data_dir_vietlott: Path = Path("data/vietlott")):
        self.data_dir_xsmb = data_dir_xsmb
        self.data_dir_vietlott = data_dir_vietlott

    def build_xsmb_matrices(self) -> None:
        """Xây dựng xsmb-2-digits, xsmb-sparse và parquet từ xsmb.csv."""
        raw_csv = self.data_dir_xsmb / "xsmb.csv"
        if not raw_csv.exists():
            logger.warning(f"Không tìm thấy {raw_csv}")
            return

        logger.info("Đang đọc dữ liệu gốc xsmb.csv...")
        df_raw = pd.read_csv(raw_csv)
        df_raw["date"] = pd.to_datetime(df_raw["date"]).dt.strftime("%Y-%m-%d")
        df_raw.sort_values("date", inplace=True)
        df_raw.reset_index(drop=True, inplace=True)

        # 1. Lưu xsmb.parquet
        parquet_path = self.data_dir_xsmb / "xsmb.parquet"
        df_raw.to_parquet(parquet_path, index=False)
        logger.info(f"Đã lưu {parquet_path}")

        # 2. Xây dựng xsmb-2-digits (% 100 cho 27 giải)
        df_2digits = df_raw.copy()
        prize_cols = [c for c in df_2digits.columns if c != "date"]
        for col in prize_cols:
            df_2digits[col] = df_2digits[col] % 100

        two_digits_csv = self.data_dir_xsmb / "xsmb-2-digits.csv"
        two_digits_parquet = self.data_dir_xsmb / "xsmb-2-digits.parquet"
        df_2digits.to_csv(two_digits_csv, index=False)
        df_2digits.to_parquet(two_digits_parquet, index=False)
        logger.info(f"Đã tạo {two_digits_csv} và {two_digits_parquet}")

        # 3. Xây dựng xsmb-sparse (Mỗi dòng là 1 ngày, các cột từ 0..99 là số nháy lô về ngày đó)
        dates = df_2digits["date"].values
        n_days = len(dates)
        sparse_arr = np.zeros((n_days, 100), dtype=np.int16)

        prize_matrix = df_2digits[prize_cols].values # shape (n_days, 27)
        for i in range(n_days):
            row_vals = prize_matrix[i]
            for val in row_vals:
                if 0 <= val <= 99:
                    sparse_arr[i, val] += 1

        sparse_cols = [str(x) for x in range(100)]
        df_sparse = pd.DataFrame(sparse_arr, columns=sparse_cols)
        df_sparse.insert(0, "date", dates)

        sparse_csv = self.data_dir_xsmb / "xsmb-sparse.csv"
        sparse_parquet = self.data_dir_xsmb / "xsmb-sparse.parquet"
        df_sparse.to_csv(sparse_csv, index=False)
        df_sparse.to_parquet(sparse_parquet, index=False)
        logger.info(f"Đã tạo {sparse_csv} và {sparse_parquet}")

    def build_vietlott_matrices(self) -> None:
        """Xây dựng ma trận thưa và parquet cho Vietlott Power 6/55 và Mega 6/45."""
        # 1. Power 6/55
        p655_path = self.data_dir_vietlott / "power655.jsonl"
        if p655_path.exists():
            df_655 = pl.read_ndjson(p655_path)
            if not df_655.is_empty():
                df_655.write_parquet(self.data_dir_vietlott / "power655.parquet")
                logger.info("Đã tạo data/vietlott/power655.parquet")

        # 2. Power 6/45
        p645_path = self.data_dir_vietlott / "power645.jsonl"
        if p645_path.exists():
            df_645 = pl.read_ndjson(p645_path)
            if not df_645.is_empty():
                df_645.write_parquet(self.data_dir_vietlott / "power645.parquet")
                logger.info("Đã tạo data/vietlott/power645.parquet")

    def build_all(self) -> None:
        self.build_xsmb_matrices()
        self.build_vietlott_matrices()
