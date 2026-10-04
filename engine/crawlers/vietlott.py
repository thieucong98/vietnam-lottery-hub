from datetime import datetime
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup
from loguru import logger
import polars as pl
import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from engine.crawlers.base import BaseLotteryCrawler

HEADERS = {
    "Accept": "text/html, */*; q=0.01",
    "Content-Type": "text/plain; charset=utf-8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "X-AjaxPro-Method": "ServerSideDrawResult",
}

DEFAULT_ORENDER_INFO = {
    "SiteId": "main.frontend.vi",
    "SiteAlias": "main.vi",
    "UserSessionId": "",
    "SiteLang": "vi",
    "IsPageDesign": False,
    "ExtraParam1": "",
    "ExtraParam2": "",
    "ExtraParam3": "",
    "SiteURL": "",
    "WebPage": None,
    "SiteName": "Vietlott",
    "OrgPageAlias": None,
    "PageAlias": None,
    "RefKey": None,
    "FullPageAlias": None,
}

PRODUCT_CONFIGS = {
    "power_655": {
        "url": "https://vietlott.vn/ajaxpro/Vietlott.PlugIn.WebParts.Game655CompareWebPart,Vietlott.PlugIn.WebParts.ashx",
        "file": "power655.jsonl",
        "key": "23bbd667",
        "type": "655",
    },
    "power_645": {
        "url": "https://vietlott.vn/ajaxpro/Vietlott.PlugIn.WebParts.Game645CompareWebPart,Vietlott.PlugIn.WebParts.ashx",
        "file": "power645.jsonl",
        "key": "23bbd667",
        "type": "645",
    },
    "3d": {
        "url": "https://vietlott.vn/ajaxpro/Vietlott.PlugIn.WebParts.GameMax3DCompareWebPart,Vietlott.PlugIn.WebParts.ashx",
        "file": "3d.jsonl",
        "key": "",
        "type": "3d",
    },
    "3d_pro": {
        "url": "https://vietlott.vn/ajaxpro/Vietlott.PlugIn.WebParts.GameMax3DProCompareWebPart,Vietlott.PlugIn.WebParts.ashx",
        "file": "3d_pro.jsonl",
        "key": "",
        "type": "3d_pro",
    },
    "keno": {
        "url": "https://vietlott.vn/ajaxpro/Vietlott.PlugIn.WebParts.GameKenoCompareWebPart,Vietlott.PlugIn.WebParts.ashx",
        "file": "keno.jsonl",
        "key": "",
        "type": "keno",
    },
    "bingo18": {
        "url": "https://vietlott.vn/ajaxpro/Vietlott.PlugIn.WebParts.GameBingo18CompareWebPart,Vietlott.PlugIn.WebParts.ashx",
        "file": "bingo18.jsonl",
        "key": "",
        "type": "bingo18",
    },
    "power_535": {
        "url": "https://vietlott.vn/ajaxpro/Vietlott.PlugIn.WebParts.Game535CompareWebPart,Vietlott.PlugIn.WebParts.ashx",
        "file": "power535.jsonl",
        "key": "23bbd667",
        "type": "535",
    },
}

class VietlottCrawler(BaseLotteryCrawler):
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or Path("data/vietlott")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=5))
    def fetch_page(self, product: str, page_index: int = 0) -> List[Dict[str, Any]]:
        cfg = PRODUCT_CONFIGS.get(product)
        if not cfg:
            raise ValueError(f"Sản phẩm không hỗ trợ: {product}")

        body = {
            "ORenderInfo": DEFAULT_ORENDER_INFO,
            "Key": cfg["key"],
            "GameDrawId": "",
            "ArrayNumbers": [["" for _ in range(18)] for _ in range(5)],
            "CheckMulti": False,
            "PageIndex": page_index,
        }
        if cfg["type"] == "keno":
            body.update({"TotalRow": 10, "DrawDate": "", "GameDrawNo": ""})

        resp = requests.post(cfg["url"], data=json.dumps(body), headers=HEADERS, timeout=15)
        resp.raise_for_status()
        res_json = resp.json()

        html = res_json.get("value", {}).get("HtmlContent", "")
        if not html:
            return []

        soup = BeautifulSoup(html, "lxml")
        rows = []
        for i, tr in enumerate(soup.select("table tr")):
            if i == 0:
                continue
            tds = tr.find_all("td")
            if len(tds) < 3:
                continue

            try:
                date_str = datetime.strptime(tds[0].text.strip(), "%d/%m/%Y").strftime("%Y-%m-%d")
            except Exception:
                date_str = tds[0].text.strip()

            draw_id = tds[1].text.strip()
            spans = tds[2].find_all("span")
            nums = []
            for s in spans:
                txt = s.text.strip()
                if txt and txt != "|" and txt.isdigit():
                    nums.append(int(txt))

            if nums:
                rows.append({
                    "date": date_str,
                    "id": draw_id,
                    "result": nums,
                    "process_time": datetime.now().isoformat(),
                })
        return rows

    def fetch_date(self, selected_date) -> Optional[Dict[str, Any]]:
        # Vietlott lưu theo kỳ quay (Draw ID) và PageIndex
        return None

    def sync_product(self, product: str, max_pages: int = 2) -> int:
        """Đồng bộ các kỳ mới nhất của một sản phẩm Vietlott."""
        cfg = PRODUCT_CONFIGS.get(product)
        if not cfg:
            return 0

        target_file = self.data_dir / cfg["file"]
        existing_ids = set()
        if target_file.exists():
            try:
                df_curr = pl.read_ndjson(target_file)
                if not df_curr.is_empty() and "id" in df_curr.columns:
                    existing_ids = set(df_curr["id"].cast(pl.Utf8).to_list())
            except Exception as e:
                logger.warning(f"Không thể đọc file {target_file}: {e}")

        new_items = []
        for page in range(max_pages):
            try:
                items = self.fetch_page(product, page_index=page)
                if not items:
                    break
                added_any = False
                for item in items:
                    if str(item["id"]) not in existing_ids:
                        new_items.append(item)
                        existing_ids.add(str(item["id"]))
                        added_any = True
                if not added_any and page > 0:
                    break
            except Exception as e:
                logger.error(f"Lỗi khi cào {product} page {page}: {e}")
                break

        if not new_items:
            logger.info(f"{product}: Dữ liệu đã là mới nhất.")
            return 0

        logger.info(f"{product}: Cào được {len(new_items)} kỳ quay mới.")
        df_new = pl.DataFrame(new_items)
        df_new = df_new.with_columns(pl.col("id").cast(pl.Utf8), pl.col("date").cast(pl.Utf8))

        if target_file.exists():
            df_old = pl.read_ndjson(target_file)
            df_old = df_old.with_columns(pl.col("id").cast(pl.Utf8), pl.col("date").cast(pl.Utf8))
            df_combined = pl.concat([df_old, df_new]).unique(subset=["id"], keep="last")
        else:
            df_combined = df_new

        df_combined = df_combined.sort(["date", "id"])
        target_file.parent.mkdir(parents=True, exist_ok=True)
        df_combined.write_ndjson(target_file)
        return len(new_items)

    def sync_latest(self) -> int:
        """Đồng bộ tất cả sản phẩm chính của Vietlott."""
        total_new = 0
        for prod in ["power_655", "power_645", "3d", "3d_pro", "keno"]:
            try:
                total_new += self.sync_product(prod, max_pages=3)
            except Exception as e:
                logger.error(f"Lỗi sync Vietlott {prod}: {e}")
        return total_new
