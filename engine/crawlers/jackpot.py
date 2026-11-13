"""Giá trị Jackpot theo kỳ của Power 6/55 và Mega 6/45, lấy từ trang kết quả chính thức vietlott.vn.

- Lịch sử lưu ở data/vietlott/jackpot.jsonl (mỗi dòng một kỳ), xuất ra web/public/data/jackpot.json.
- Mỗi lần chạy chỉ thử các kỳ gần nhất chưa có giá trị (tối đa MAX_FETCH_PER_RUN kỳ mỗi sản phẩm).
- vietlott.vn có thể chặn truy cập từ ngoài Việt Nam (HTTP 403). Khi đó giữ nguyên dữ liệu cũ, không làm
  pipeline lỗi; giao diện hiển thị "chưa có dữ liệu" và liên kết tới trang chính thức.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from bs4 import BeautifulSoup
from loguru import logger

RESULT_URL = "https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/{game}?id={draw_id}&nocatche=1"
PRODUCTS = {
    "power_655": {"game": "655", "draws_file": "power655.jsonl", "web_key": "vietlott_655"},
    "power_645": {"game": "645", "draws_file": "power645.jsonl", "web_key": "vietlott_645"},
}
MAX_FETCH_PER_RUN = 3
HISTORY_LIMIT = 200
SCHEMA_VERSION = 1

_MONEY_RE = re.compile(r"^\d{1,3}(?:[.,]\d{3})+$|^\d+$")
_TITLE_RE = re.compile(r"#\s*(\d+)\s*ngày\s*(\d{2})/(\d{2})/(\d{4})")


def parse_money(text: str) -> Optional[int]:
    """'50.929.534.650' -> 50929534650"""
    t = text.strip()
    if not _MONEY_RE.match(t):
        return None
    return int(re.sub(r"[.,]", "", t))


def parse_jackpot_page(html: str) -> dict[str, Any]:
    """Đọc giá trị Jackpot 1/2 và kỳ quay từ HTML trang kết quả.

    Trả về {"id", "date", "jackpot1", "jackpot2"}; trường không đọc được là None.
    """
    soup = BeautifulSoup(html, "lxml")
    out: dict[str, Any] = {"id": None, "date": None, "jackpot1": None, "jackpot2": None}

    title = soup.select_one(".chitietketqua_title h5")
    if title:
        m = _TITLE_RE.search(" ".join(title.get_text(" ").split()))
        if m:
            out["id"] = m.group(1)
            out["date"] = f"{m.group(4)}-{m.group(3)}-{m.group(2)}"

    box = soup.select_one(".gt_jackpot")
    if box:
        for h5 in box.find_all("h5"):
            label = " ".join(h5.get_text(" ").split()).lower()
            amount = h5.find_next("div", class_="so_tien")
            value = parse_money(amount.h3.get_text()) if amount and amount.h3 else None
            if label.endswith("jackpot 2"):
                out["jackpot2"] = value
            elif "jackpot" in label:
                out["jackpot1"] = value
    return out


def _read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return rows


class JackpotTracker:
    def __init__(
        self,
        data_dir: Path = Path("data/vietlott"),
        web_data_dir: Path = Path("web/public/data"),
        http: Any = None,
    ):
        self.data_dir = data_dir
        self.web_data_dir = web_data_dir
        self.history_file = data_dir / "jackpot.jsonl"
        self._http = http

    def _client(self):
        if self._http is None:
            from cloudscraper import CloudScraper

            self._http = CloudScraper()
        return self._http

    def load_history(self) -> list[dict]:
        return _read_jsonl(self.history_file)

    def _recent_draws(self, product: str) -> list[dict]:
        draws = _read_jsonl(self.data_dir / PRODUCTS[product]["draws_file"])
        draws.sort(key=lambda d: (str(d.get("date", "")), str(d.get("id", ""))))
        return draws[-MAX_FETCH_PER_RUN:]

    def fetch(self, product: str, draw_id: str) -> Optional[dict]:
        url = RESULT_URL.format(game=PRODUCTS[product]["game"], draw_id=draw_id)
        resp = self._client().get(url, timeout=15)
        if resp.status_code != 200:
            raise RuntimeError(f"HTTP {resp.status_code} khi tải {url}")
        parsed = parse_jackpot_page(resp.text)
        if parsed["jackpot1"] is None:
            raise RuntimeError(f"Không đọc được giá trị Jackpot từ {url}")
        if parsed["id"] and parsed["id"].lstrip("0") != draw_id.lstrip("0"):
            # Trang trả về kỳ khác (thường là kỳ mới nhất khi id không tồn tại): bỏ qua
            raise RuntimeError(f"Trang trả về kỳ #{parsed['id']} thay vì #{draw_id}")
        return parsed

    def sync(self) -> int:
        """Lấy giá trị Jackpot cho các kỳ gần nhất chưa có. Trả về số kỳ mới ghi được."""
        history = self.load_history()
        known = {(r.get("product"), str(r.get("id"))) for r in history}
        added: list[dict] = []
        for product in PRODUCTS:
            for draw in self._recent_draws(product):
                draw_id = str(draw.get("id", "")).lstrip("#").strip()
                if not draw_id or (product, draw_id) in known:
                    continue
                try:
                    parsed = self.fetch(product, draw_id)
                except Exception as e:  # mạng, 403, đổi giao diện trang
                    logger.warning(f"Jackpot {product} kỳ {draw_id}: {e}. Bỏ qua sản phẩm này lần chạy này.")
                    break
                added.append({
                    "product": product,
                    "id": draw_id,
                    "date": draw.get("date") or parsed["date"],
                    "jackpot1": parsed["jackpot1"],
                    "jackpot2": parsed["jackpot2"] if product == "power_655" else None,
                    "source": "vietlott.vn",
                    "fetched_at": datetime.now().isoformat(timespec="seconds"),
                })
                known.add((product, draw_id))
        if added:
            rows = sorted(history + added, key=lambda r: (str(r.get("product")), str(r.get("date")), str(r.get("id"))))
            self.history_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.history_file, "w", encoding="utf-8") as f:
                for r in rows:
                    f.write(json.dumps(r, ensure_ascii=False) + "\n")
            logger.info(f"Jackpot: ghi thêm {len(added)} kỳ.")
        return len(added)

    def build_payload(self) -> dict:
        history = self.load_history()
        payload: dict[str, Any] = {
            "schema_version": SCHEMA_VERSION,
            "generated_at": datetime.now().isoformat(timespec="seconds"),
            "source": "https://vietlott.vn/",
        }
        for product, cfg in PRODUCTS.items():
            rows = [r for r in history if r.get("product") == product and isinstance(r.get("jackpot1"), int)]
            rows.sort(key=lambda r: (str(r.get("date")), str(r.get("id"))), reverse=True)
            items = [
                {
                    "id": str(r["id"]),
                    "date": r["date"],
                    "jackpot1": r["jackpot1"],
                    **({"jackpot2": r.get("jackpot2")} if product == "power_655" else {}),
                }
                for r in rows[:HISTORY_LIMIT]
            ]
            payload[cfg["web_key"]] = {"latest": items[0] if items else None, "history": items}
        return payload

    def export(self) -> Path:
        self.web_data_dir.mkdir(parents=True, exist_ok=True)
        out = self.web_data_dir / "jackpot.json"
        out.write_text(json.dumps(self.build_payload(), ensure_ascii=False, indent=2), encoding="utf-8")
        return out


def sync_and_export_jackpots() -> int:
    tracker = JackpotTracker()
    try:
        added = tracker.sync()
    except Exception as e:
        logger.warning(f"Không đồng bộ được Jackpot: {e}")
        added = 0
    tracker.export()
    return added
