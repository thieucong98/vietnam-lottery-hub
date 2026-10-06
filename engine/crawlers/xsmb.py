from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup
from cloudscraper import CloudScraper
from loguru import logger
import pandas as pd
from tenacity import retry, stop_after_attempt, wait_exponential

from engine.crawlers.base import BaseLotteryCrawler

XSMB_COLUMNS = [
    "date", "special", "prize1",
    "prize2_1", "prize2_2",
    "prize3_1", "prize3_2", "prize3_3", "prize3_4", "prize3_5", "prize3_6",
    "prize4_1", "prize4_2", "prize4_3", "prize4_4",
    "prize5_1", "prize5_2", "prize5_3", "prize5_4", "prize5_5", "prize5_6",
    "prize6_1", "prize6_2", "prize6_3",
    "prize7_1", "prize7_2", "prize7_3", "prize7_4"
]

class XSMBCrawler(BaseLotteryCrawler):
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or Path("data/xsmb")
        self.csv_path = self.data_dir / "xsmb.csv"
        self._http = CloudScraper()

    @retry(stop=stop_after_attempt(5), wait=wait_exponential(min=1, max=10))
    def fetch_date(self, selected_date: date) -> Optional[Dict[str, Any]]:
        """Cào kết quả XSMB của một ngày từ xoso.com.vn."""
        url = f"https://xoso.com.vn/xsmb-{selected_date:%d-%m-%Y}.html"
        logger.info(f"Đang cào XSMB ngày: {selected_date} từ {url}")
        resp = self._http.get(url, timeout=15)
        if resp.status_code == 404:
            logger.warning(f"Không tìm thấy kết quả XSMB ngày {selected_date} (404)")
            return None
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")
        
        def get_prizes(css_class: str) -> List[int]:
            elements = soup.find_all(attrs={"class": css_class})
            results = []
            for el in elements:
                txt = el.text.strip().replace(" ", "").replace("\n", "")
                if txt.isdigit():
                    results.append(int(txt))
            return results

        special = get_prizes("special-prize")
        prize1 = get_prizes("prize1")
        prize2 = get_prizes("prize2")
        prize3 = get_prizes("prize3")
        prize4 = get_prizes("prize4")
        prize5 = get_prizes("prize5")
        prize6 = get_prizes("prize6")
        prize7 = get_prizes("prize7")

        if not special or len(prize7) < 4:
            logger.warning(f"Dữ liệu không đầy đủ cho ngày {selected_date}")
            return None

        row = {
            "date": selected_date.isoformat(),
            "special": special[0],
            "prize1": prize1[0] if prize1 else 0,
            "prize2_1": prize2[0] if len(prize2) > 0 else 0,
            "prize2_2": prize2[1] if len(prize2) > 1 else 0,
            "prize3_1": prize3[0] if len(prize3) > 0 else 0,
            "prize3_2": prize3[1] if len(prize3) > 1 else 0,
            "prize3_3": prize3[2] if len(prize3) > 2 else 0,
            "prize3_4": prize3[3] if len(prize3) > 3 else 0,
            "prize3_5": prize3[4] if len(prize3) > 4 else 0,
            "prize3_6": prize3[5] if len(prize3) > 5 else 0,
            "prize4_1": prize4[0] if len(prize4) > 0 else 0,
            "prize4_2": prize4[1] if len(prize4) > 1 else 0,
            "prize4_3": prize4[2] if len(prize4) > 2 else 0,
            "prize4_4": prize4[3] if len(prize4) > 3 else 0,
            "prize5_1": prize5[0] if len(prize5) > 0 else 0,
            "prize5_2": prize5[1] if len(prize5) > 1 else 0,
            "prize5_3": prize5[2] if len(prize5) > 2 else 0,
            "prize5_4": prize5[3] if len(prize5) > 3 else 0,
            "prize5_5": prize5[4] if len(prize5) > 4 else 0,
            "prize5_6": prize5[5] if len(prize5) > 5 else 0,
            "prize6_1": prize6[0] if len(prize6) > 0 else 0,
            "prize6_2": prize6[1] if len(prize6) > 1 else 0,
            "prize6_3": prize6[2] if len(prize6) > 2 else 0,
            "prize7_1": prize7[0] if len(prize7) > 0 else 0,
            "prize7_2": prize7[1] if len(prize7) > 1 else 0,
            "prize7_3": prize7[2] if len(prize7) > 2 else 0,
            "prize7_4": prize7[3] if len(prize7) > 3 else 0,
        }
        return row

    def get_last_date(self) -> date:
        """Lấy ngày cuối cùng có trong dữ liệu."""
        if not self.csv_path.exists():
            return date(2005, 10, 1)
        df = pd.read_csv(self.csv_path, usecols=["date"])
        if df.empty:
            return date(2005, 10, 1)
        df["date"] = pd.to_datetime(df["date"]).dt.date
        return df["date"].max()

    def sync_latest(self) -> int:
        """Cào và cập nhật các ngày còn thiếu đến hôm nay."""
        begin_date = self.get_last_date()
        tz = ZoneInfo("Asia/Ho_Chi_Minh")
        now = datetime.now(tz)
        target_date = now.date()
        # Nếu chưa tới 18h15 thì ngày hôm nay chưa bắt đầu quay thưởng
        if now.time() < time(18, 15):
            target_date -= timedelta(days=1)

        delta_days = (target_date - begin_date).days
        if delta_days <= 0:
            logger.info(f"Dữ liệu XSMB đã là mới nhất (ngày {begin_date})")
            return 0

        logger.info(f"Cần cập nhật {delta_days} ngày từ {begin_date + timedelta(days=1)} đến {target_date}")
        new_rows = []
        for i in range(1, delta_days + 1):
            cur_date = begin_date + timedelta(days=i)
            row = self.fetch_date(cur_date)
            # Nếu là ngày hôm nay và đang trong khung giờ quay thưởng (18h15 - 18h50), retry nhẹ nếu web nguồn chưa kịp xuất bản
            if not row and cur_date == now.date() and time(18, 15) <= now.time() <= time(18, 50):
                import time as pytime
                for retry_idx in range(1, 4):
                    logger.info(f"Đang trong khung giờ quay thưởng ({now.strftime('%H:%M')}). Đợi 10s thăm dò lại lần {retry_idx}/3...")
                    pytime.sleep(10)
                    row = self.fetch_date(cur_date)
                    if row:
                        logger.info("-> Đã bắt được kết quả XSMB hôm nay thành công!")
                        break

            if row:
                new_rows.append(row)
            elif cur_date == now.date():
                logger.info(f"Kỳ quay hôm nay ({cur_date}) đang diễn ra hoặc chưa có kết quả đầy đủ trên nguồn.")

        if not new_rows:
            return 0

        df_new = pd.DataFrame(new_rows)
        if self.csv_path.exists():
            df_old = pd.read_csv(self.csv_path)
            df_combined = pd.concat([df_old, df_new], ignore_index=True)
            df_combined.drop_duplicates(subset=["date"], keep="last", inplace=True)
            df_combined.sort_values(by="date", inplace=True)
        else:
            df_combined = df_new

        self.csv_path.parent.mkdir(parents=True, exist_ok=True)
        df_combined.to_csv(self.csv_path, index=False)
        logger.info(f"Đã lưu {len(new_rows)} kỳ XSMB mới vào {self.csv_path}")
        return len(new_rows)
