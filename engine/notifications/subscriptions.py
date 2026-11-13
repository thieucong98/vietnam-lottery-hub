"""Đăng ký nhận kết quả qua Telegram (opt-in).

- Chỉ lưu chat_id và danh sách trò chơi người dùng tự chọn bằng /dangky; /huydangky xóa hẳn bản ghi.
- Lưu trong một tệp JSON trên máy chạy bot (BOT_STATE_DIR), không commit vào repo, không gửi đi đâu khác.
- Người dùng chặn bot (Telegram trả 403) thì bản ghi bị xóa.
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

PRODUCTS = {
    "xsmb": {"label": "XSMB", "summary_key": "xsmb_latest", "id_field": "date", "command": "/xsmb"},
    "vietlott_655": {"label": "Power 6/55", "summary_key": "vietlott_655_latest", "id_field": "id", "command": "/power"},
    "vietlott_645": {"label": "Mega 6/45", "summary_key": "vietlott_645_latest", "id_field": "id", "command": "/mega"},
}
PRODUCT_ALIASES = {
    "xsmb": "xsmb", "mb": "xsmb",
    "655": "vietlott_655", "power": "vietlott_655",
    "645": "vietlott_645", "mega": "vietlott_645",
}

def default_state_path() -> Path:
    return Path(os.environ.get("BOT_STATE_DIR", "bot_state")) / "subscriptions.json"


def parse_products(args: list[str]) -> Optional[list[str]]:
    """[] hoặc ['all'] -> tất cả; ['655', 'xsmb'] -> ['vietlott_655', 'xsmb']; None nếu có mã lạ."""
    if not args or any(a.lower() in ("all", "tatca") for a in args):
        return list(PRODUCTS)
    out: list[str] = []
    for a in args:
        p = PRODUCT_ALIASES.get(a.lower())
        if p is None:
            return None
        if p not in out:
            out.append(p)
    return out


class SubscriptionStore:
    def __init__(self, path: Optional[Path] = None):
        self.path = path or default_state_path()
        self.data = self._load()

    def _load(self) -> dict:
        try:
            raw = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            raw = {}
        subs = raw.get("subscribers") if isinstance(raw.get("subscribers"), dict) else {}
        last = raw.get("last_sent") if isinstance(raw.get("last_sent"), dict) else {}
        return {"subscribers": subs, "last_sent": last}

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.data, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(self.path)

    def subscribe(self, chat_id: int | str, products: list[str]) -> None:
        self.data["subscribers"][str(chat_id)] = {"products": products, "since": datetime.now().isoformat(timespec="seconds")}
        self.save()

    def unsubscribe(self, chat_id: int | str) -> bool:
        removed = self.data["subscribers"].pop(str(chat_id), None) is not None
        if removed:
            self.save()
        return removed

    def products_of(self, chat_id: int | str) -> list[str]:
        entry = self.data["subscribers"].get(str(chat_id))
        return list(entry.get("products", [])) if isinstance(entry, dict) else []

    def subscribers(self) -> dict[str, list[str]]:
        return {cid: list(e.get("products", [])) for cid, e in self.data["subscribers"].items() if isinstance(e, dict)}

    def due_products(self, summary: dict) -> list[str]:
        """Trò chơi có kỳ mới so với lần gửi trước. Lần đầu chỉ ghi mốc, không gửi (tránh gửi lại kỳ cũ khi khởi động)."""
        due: list[str] = []
        first_run = not self.data["last_sent"]
        for product, cfg in PRODUCTS.items():
            latest = summary.get(cfg["summary_key"]) or {}
            key = str(latest.get(cfg["id_field"]) or "")
            if not key:
                continue
            if first_run:
                self.data["last_sent"][product] = key
            elif self.data["last_sent"].get(product) != key:
                due.append(product)
        if first_run:
            self.save()
        return due

    def mark_sent(self, product: str, summary: dict) -> None:
        cfg = PRODUCTS[product]
        self.data["last_sent"][product] = str((summary.get(cfg["summary_key"]) or {}).get(cfg["id_field"]) or "")
        self.save()
