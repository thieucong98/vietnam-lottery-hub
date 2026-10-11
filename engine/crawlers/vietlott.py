from datetime import datetime
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup
from loguru import logger
import polars as pl
import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from engine.crawlers.base import DrawIndexedCrawler

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

MIRROR_BASE_URL = "https://raw.githubusercontent.com/vietvudanh/vietlott-data/main/data"

class VietlottCrawler(DrawIndexedCrawler):
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or Path("data/vietlott")

    def fetch_from_mirror(self, product: str) -> List[Dict[str, Any]]:
        """Lấy dữ liệu từ Upstream Mirror (GitHub Raw) khi cổng vietlott.vn bị geo-block."""
        cfg = PRODUCT_CONFIGS.get(product)
        if not cfg:
            return []
        url = f"{MIRROR_BASE_URL}/{cfg['file']}"
        logger.info(f"Đang đồng bộ {product} từ Upstream Mirror: {url}")
        resp = requests.get(url, timeout=25)
        resp.raise_for_status()

        rows = []
        for line in resp.text.strip().splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
                norm_id = str(item.get("id", "")).lstrip("#").strip()
                if not norm_id:
                    continue
                if product not in ["3d", "3d_pro"] and "process_time" not in item:
                    item["process_time"] = datetime.now().isoformat()
                elif product in ["3d", "3d_pro"] and "process_time" in item:
                    del item["process_time"]
                rows.append(item)
            except Exception:
                continue
        return rows

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=3))
    def fetch_page(self, product: str, page_index: int = 0) -> List[Dict[str, Any]]:
        cfg = PRODUCT_CONFIGS.get(product)
        if not cfg:
            raise ValueError(f"Sản phẩm không hỗ trợ: {product}")

        if cfg["type"] == "keno":
            body = {
                "ORenderInfo": DEFAULT_ORENDER_INFO,
                "GameId": "",
                "GameDrawNo": "",
                "number": "",
                "DrawDate": "",
                "ProcessType": 0,
                "OddEven": 0,
                "UpperLower": 0,
                "PageIndex": page_index,
                "TotalRow": 10,
            }
        else:
            body = {
                "ORenderInfo": DEFAULT_ORENDER_INFO,
                "Key": cfg["key"],
                "GameDrawId": "",
                "ArrayNumbers": [["" for _ in range(18)] for _ in range(6)],
                "CheckMulti": False,
                "PageIndex": page_index,
            }

        resp = requests.post(cfg["url"], data=json.dumps(body), headers=HEADERS, timeout=12)
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
            if len(tds) < 2:
                continue

            if cfg["type"] == "keno":
                parts = tds[0].text.strip().split("#")
                raw_date = parts[0].strip()
                draw_id = parts[1].strip() if len(parts) > 1 else ""
                try:
                    date_str = datetime.strptime(raw_date, "%d/%m/%Y").strftime("%Y-%m-%d")
                except Exception:
                    date_str = raw_date
                raw_nums = tds[1].text.strip().split()
                nums = [int(x) for x in raw_nums if x.isdigit()]
                if nums:
                    rows.append({
                        "date": date_str,
                        "id": draw_id,
                        "result": nums,
                        "odd_even": tds[2].text.strip() if len(tds) > 2 else "",
                        "big_small": tds[3].text.strip() if len(tds) > 3 else "",
                        "process_time": datetime.now().isoformat(),
                    })
            else:
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

    def sync_product(self, product: str, max_pages: int = 3, force_mirror: bool = False) -> int:
        """Đồng bộ các kỳ mới nhất của một sản phẩm Vietlott theo cơ chế Đa tầng (Direct + Mirror Fallback)."""
        cfg = PRODUCT_CONFIGS.get(product)
        if not cfg:
            return 0

        target_file = self.data_dir / cfg["file"]
        existing_items = []
        existing_ids = set()
        if target_file.exists():
            try:
                with open(target_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            obj = json.loads(line)
                            norm_id = str(obj.get("id", "")).lstrip("#").strip()
                            if norm_id:
                                obj["id"] = norm_id
                                existing_ids.add(norm_id)
                                existing_items.append(obj)
                        except Exception:
                            continue
            except Exception as e:
                logger.warning(f"Không thể đọc file {target_file}: {e}")

        new_items = []
        tier1_attempted = False
        tier1_success = False

        # TẦNG 1: Thử cào trực tiếp từ vietlott.vn (hoạt động tốt khi chạy tại VN hoặc local)
        if not force_mirror:
            tier1_attempted = True
            try:
                for page in range(max_pages):
                    items = self.fetch_page(product, page_index=page)
                    if not items:
                        break
                    tier1_success = True
                    added_any = False
                    for item in items:
                        norm_id = str(item["id"]).lstrip("#").strip()
                        if norm_id not in existing_ids:
                            item["id"] = norm_id
                            new_items.append(item)
                            existing_ids.add(norm_id)
                            added_any = True
                    if not added_any and page > 0:
                        break
            except Exception as e:
                logger.warning(f"Tier 1 (vietlott.vn direct) không khả dụng cho {product} ({e}). Tự động kích hoạt Tier 2 (Upstream Mirror)...")

        # TẦNG 2: Fallback Upstream Mirror (GitHub Raw)
        # Kích hoạt khi: force_mirror=True, HOẶC Tier 1 thất bại, HOẶC Tier 1 không tìm thấy kỳ mới (đảm bảo không bị lọt kỳ)
        if force_mirror or not tier1_success or not new_items:
            try:
                mirror_items = self.fetch_from_mirror(product)
                added_from_mirror = 0
                for item in mirror_items:
                    norm_id = str(item["id"]).lstrip("#").strip()
                    if norm_id not in existing_ids:
                        item["id"] = norm_id
                        new_items.append(item)
                        existing_ids.add(norm_id)
                        added_from_mirror += 1
                if added_from_mirror > 0:
                    logger.info(f"-> Tier 2 (Mirror) đã bù được {added_from_mirror} kỳ quay mới cho {product}!")
            except Exception as e:
                logger.error(f"Lỗi khi tải từ Tier 2 (Mirror) cho {product}: {e}")

        if not new_items:
            logger.info(f"{product}: Dữ liệu đã là mới nhất.")
            return 0

        logger.info(f"{product}: Đồng bộ thành công {len(new_items)} kỳ quay mới.")
        combined_dict = {str(item["id"]).lstrip("#").strip(): item for item in existing_items}
        for item in new_items:
            norm_id = str(item["id"]).lstrip("#").strip()
            item["id"] = norm_id
            combined_dict[norm_id] = item

        sorted_items = sorted(combined_dict.values(), key=lambda x: (str(x.get("date", "")), str(x.get("id", ""))))
        target_file.parent.mkdir(parents=True, exist_ok=True)
        with open(target_file, "w", encoding="utf-8") as f:
            for item in sorted_items:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        return len(new_items)

    def sync_latest(self) -> int:
        """Đồng bộ tất cả sản phẩm chính của Vietlott theo cơ chế Đa tầng."""
        total_new = 0
        for prod in ["power_655", "power_645", "3d", "3d_pro", "keno"]:
            try:
                total_new += self.sync_product(prod, max_pages=3)
            except Exception as e:
                logger.error(f"Lỗi sync Vietlott {prod}: {e}")
        return total_new
