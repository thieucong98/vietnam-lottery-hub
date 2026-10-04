from datetime import date, datetime, timedelta
from pathlib import Path
from typing import List, Set
from loguru import logger
import pandas as pd
import polars as pl

from engine.crawlers.xsmb import XSMBCrawler
from engine.crawlers.vietlott import VietlottCrawler, PRODUCT_CONFIGS

class MissingDetector:
    """Tự động phát hiện các kỳ quay / ngày bị thiếu trong dữ liệu và cào bù."""

    def __init__(self, data_dir_xsmb: Path = Path("data/xsmb"), data_dir_vietlott: Path = Path("data/vietlott")):
        self.data_dir_xsmb = data_dir_xsmb
        self.data_dir_vietlott = data_dir_vietlott
        self.xsmb_crawler = XSMBCrawler(data_dir_xsmb)
        self.vietlott_crawler = VietlottCrawler(data_dir_vietlott)

    def detect_missing_xsmb_dates(self) -> List[date]:
        """Kiểm tra xem có ngày nào giữa ngày đầu tiên và ngày cuối cùng bị thiếu không."""
        csv_file = self.data_dir_xsmb / "xsmb.csv"
        if not csv_file.exists():
            return []

        df = pd.read_csv(csv_file, usecols=["date"])
        dates_in_data = set(pd.to_datetime(df["date"]).dt.date)

        start_date = min(dates_in_data)
        end_date = max(dates_in_data)

        # Xổ số miền Bắc nghỉ Tết Âm lịch khoảng 4 ngày (30 Tết đến Mùng 3 Tết)
        # Các ngày khác đều quay số liên tục hàng ngày
        missing = []
        cur = start_date
        while cur <= end_date:
            if cur not in dates_in_data:
                missing.append(cur)
            cur += timedelta(days=1)

        logger.info(f"XSMB: Phát hiện {len(missing)} ngày trống trong khoảng {start_date} -> {end_date}")
        return missing

    def backfill_xsmb(self, max_days: int = 20) -> int:
        """Cào bù các ngày thiếu trong XSMB."""
        missing = self.detect_missing_xsmb_dates()
        if not missing:
            return 0

        # Lấy tối đa max_days ngày gần nhất để tránh cào lại ngày nghỉ Tết cũ
        target_missing = sorted(missing, reverse=True)[:max_days]
        filled = 0
        csv_file = self.data_dir_xsmb / "xsmb.csv"
        df_old = pd.read_csv(csv_file) if csv_file.exists() else pd.DataFrame()

        new_rows = []
        for d in target_missing:
            logger.info(f"Đang cào bù XSMB ngày {d}...")
            row = self.xsmb_crawler.fetch_date(d)
            if row:
                new_rows.append(row)
                filled += 1

        if new_rows:
            df_new = pd.DataFrame(new_rows)
            df_combined = pd.concat([df_old, df_new], ignore_index=True)
            df_combined.drop_duplicates(subset=["date"], keep="last", inplace=True)
            df_combined.sort_values(by="date", inplace=True)
            df_combined.to_csv(csv_file, index=False)
            logger.info(f"Đã bù thành công {filled} ngày XSMB!")
        return filled

    def detect_missing_vietlott_ids(self, product: str) -> List[int]:
        """Kiểm tra các ID kỳ quay bị thiếu giữa ID nhỏ nhất và lớn nhất."""
        cfg = PRODUCT_CONFIGS.get(product)
        if not cfg:
            return []

        filepath = self.data_dir_vietlott / cfg["file"]
        if not filepath.exists():
            return []

        df = pl.read_ndjson(filepath)
        if df.is_empty() or "id" not in df.columns:
            return []

        try:
            ids = set(df["id"].cast(pl.Int64).to_list())
        except Exception:
            ids = set(int(x) for x in df["id"].to_list() if str(x).isdigit())

        if not ids:
            return []

        min_id, max_id = min(ids), max(ids)
        all_ids = set(range(min_id, max_id + 1))
        missing = sorted(list(all_ids - ids))
        logger.info(f"{product}: Phát hiện {len(missing)} kỳ quay thiếu từ ID {min_id} đến {max_id}")
        return missing
