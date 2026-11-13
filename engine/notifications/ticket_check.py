"""Dò vé cho Telegram bot, cùng quy tắc với web (web/src/utils/xsmbTicket.ts, vietlottTicket.ts).

Bot không lưu vé: lệnh /dove chứa sẵn số vé và ngày quay (web tạo lệnh từ "Vé của tôi").
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from itertools import combinations
from math import comb
from typing import Optional

# Cơ cấu giải XSMB vé 10.000đ (bảng công bố 2022): (hạng, nhãn, số chữ số cuối phải trùng, số chữ số in trên kết quả, giá trị)
XSMB_TIERS = [
    ("special", "Giải Đặc Biệt", 5, 5, 500_000_000),
    ("prize1", "Giải Nhất", 5, 5, 10_000_000),
    ("prize2", "Giải Nhì", 5, 5, 5_000_000),
    ("prize3", "Giải Ba", 5, 5, 1_000_000),
    ("prize4", "Giải Tư", 4, 4, 400_000),
    ("prize5", "Giải Năm", 4, 4, 200_000),
    ("prize6", "Giải Sáu", 3, 3, 100_000),
    ("prize7", "Giải Bảy", 2, 2, 40_000),
]
XSMB_SPECIAL_SUB_VALUE = 25_000_000
XSMB_CONSOLATION_VALUE = 40_000

VIETLOTT = {
    "vietlott_655": {
        "label": "Power 6/55",
        "max": 55,
        "odds": "1/28.989.675",
        "values": {"prize1": 40_000_000, "prize2": 500_000, "prize3": 50_000},
    },
    "vietlott_645": {
        "label": "Mega 6/45",
        "max": 45,
        "odds": "1/8.145.060",
        "values": {"prize1": 10_000_000, "prize2": 300_000, "prize3": 30_000},
    },
}
TIER_LABELS = {"jackpot1": "Jackpot 1", "jackpot2": "Jackpot 2", "prize1": "Giải Nhất", "prize2": "Giải Nhì", "prize3": "Giải Ba"}
TIER_ORDER = ["jackpot1", "jackpot2", "prize1", "prize2", "prize3"]

MAX_TICKETS = 20

GAME_CODES = {
    "xsmb": "xsmb", "mb": "xsmb",
    "655": "vietlott_655", "power": "vietlott_655",
    "645": "vietlott_645", "mega": "vietlott_645",
}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _tier_of_key(key: str) -> Optional[str]:
    if key == "special":
        return "special"
    m = re.match(r"^prize([1-7])(?:_\d+)?$", key)
    return f"prize{m.group(1)}" if m else None


def check_xsmb_ticket(ticket: str, raw_prizes: dict) -> list[dict]:
    """Các giải một vé 5 chữ số trúng trong một kỳ (đủ mọi giải, kể cả giải khuyến khích)."""
    specs = {t[0]: t for t in XSMB_TIERS}
    wins: list[dict] = []
    special = None
    for key, raw in raw_prizes.items():
        tier = _tier_of_key(key)
        if tier is None or raw is None or raw == "":
            continue
        _, label, digits, width, value = specs[tier]
        number = str(raw).zfill(width)
        if tier == "special":
            special = number
        if ticket[-digits:] != number[-digits:]:
            continue
        if tier == "special":
            wins.append({"tier": tier, "label": "Giải Đặc Biệt hoặc phụ Đặc Biệt", "number": number, "value": XSMB_SPECIAL_SUB_VALUE, "series_check": True})
        else:
            wins.append({"tier": tier, "label": label, "number": number, "value": value})
    if special and not any(w["tier"] == "special" for w in wins) and ticket[-2:] == special[-2:]:
        wins.append({"tier": "consolation", "label": "Giải Khuyến Khích", "number": special, "value": XSMB_CONSOLATION_VALUE})
    order = [t[0] for t in XSMB_TIERS] + ["consolation"]
    wins.sort(key=lambda w: order.index(w["tier"]))
    return wins


def _classify(game: str, hits: int, special_hit: bool) -> Optional[str]:
    if hits >= 6:
        return "jackpot1"
    if game == "vietlott_655" and hits == 5 and special_hit:
        return "jackpot2"
    return {5: "prize1", 4: "prize2", 3: "prize3"}.get(hits)


def sub_tickets(balls: list[int], max_ball: int):
    if len(balls) == 5:
        for n in range(1, max_ball + 1):
            if n not in balls:
                yield balls + [n]
        return
    yield from (list(c) for c in combinations(balls, 6))


def check_vietlott_ticket(game: str, balls: list[int], draw: dict) -> dict:
    cfg = VIETLOTT[game]
    main = set(draw.get("balls", []))
    special = draw.get("special") if game == "vietlott_655" else None
    counts = {t: 0 for t in TIER_ORDER}
    total = 0
    for sub in sub_tickets(balls, cfg["max"]):
        total += 1
        tier = _classify(game, sum(1 for b in sub if b in main), special is not None and special in sub)
        if tier:
            counts[tier] += 1
    fixed = sum(counts[t] * cfg["values"][t] for t in ("prize1", "prize2", "prize3"))
    return {
        "counts": counts,
        "sub_tickets": total,
        "fixed_total": fixed,
        "jackpot_wins": counts["jackpot1"] + counts["jackpot2"],
        "matched": [b for b in balls if b in main],
        "matched_special": special is not None and special in balls,
    }


@dataclass
class TicketLine:
    game: str
    draw_date: Optional[str]
    numbers: str = ""
    balls: list[int] = field(default_factory=list)
    error: Optional[str] = None


def parse_ticket_line(line: str) -> TicketLine:
    """'xsmb 2026-11-11 74129' | '655 2026-11-10 01 02 21 38 39 51' | '74129' (XSMB kỳ mới nhất)"""
    tokens = line.replace(",", " ").split()
    game = "xsmb"
    if tokens and tokens[0].lower() in GAME_CODES:
        game = GAME_CODES[tokens.pop(0).lower()]
    draw_date = None
    if tokens and DATE_RE.match(tokens[0]):
        draw_date = tokens.pop(0)
        try:
            date.fromisoformat(draw_date)
        except ValueError:
            return TicketLine(game, None, error=f"Ngày {draw_date} không hợp lệ")
    if not tokens or not all(t.isdigit() for t in tokens):
        return TicketLine(game, draw_date, error="Thiếu số vé hoặc có ký tự không phải số")
    if game == "xsmb":
        ticket = "".join(tokens)
        if len(ticket) != 5:
            return TicketLine(game, draw_date, error="Vé XSMB cần đúng 5 chữ số")
        return TicketLine(game, draw_date, numbers=ticket)
    cfg = VIETLOTT[game]
    balls = [int(t) for t in tokens]
    if any(b < 1 or b > cfg["max"] for b in balls):
        return TicketLine(game, draw_date, error=f"Số ngoài khoảng 01-{cfg['max']}")
    if len(set(balls)) != len(balls):
        return TicketLine(game, draw_date, error="Có số bị trùng")
    if not (len(balls) == 5 or 6 <= len(balls) <= 18):
        return TicketLine(game, draw_date, error="Cần 6 số, hoặc 5, 7-18 số (vé bao)")
    balls.sort()
    return TicketLine(game, draw_date, numbers=" ".join(f"{b:02d}" for b in balls), balls=balls)


def _vnd(v: int) -> str:
    return f"{v:,}".replace(",", ".") + "đ"


def check_ticket_lines(lines: list[str], xsmb_draws: list[dict], vietlott_draws: dict[str, list[dict]]) -> str:
    """Trả lời lệnh /dove dạng HTML cho Telegram."""
    import html

    parsed = [parse_ticket_line(line) for line in lines if line.strip()]
    if not parsed:
        return (
            "⚠️ Cú pháp: <code>/dove 74129</code> (XSMB kỳ mới nhất) hoặc mỗi dòng một vé:\n"
            "<code>/dove\nxsmb 2026-11-11 74129\n655 2026-11-10 01 02 21 38 39 51</code>\n"
            "Trên web, mục <b>Vé của tôi</b> có nút sao chép lệnh này."
        )
    out = ["🎫 <b>KẾT QUẢ DÒ VÉ</b>"]
    if len(parsed) > MAX_TICKETS:
        out.append(f"<i>Chỉ dò {MAX_TICKETS} vé đầu tiên.</i>")
    xsmb_by_date = {d.get("date"): d for d in xsmb_draws}
    for t in parsed[:MAX_TICKETS]:
        if t.error:
            out.append(f"\n❌ {html.escape(t.error)}")
            continue
        if t.game == "xsmb":
            draw = xsmb_by_date.get(t.draw_date) if t.draw_date else (xsmb_draws[0] if xsmb_draws else None)
            head = f"\n🔴 XSMB <code>{t.numbers}</code> kỳ {t.draw_date or (draw or {}).get('date', '?')}"
            if not draw:
                out.append(f"{head}: chưa có kết quả hoặc ngoài 365 kỳ gần nhất.")
                continue
            wins = check_xsmb_ticket(t.numbers, draw.get("raw_prizes", {}))
            if not wins:
                out.append(f"{head}: không trúng giải.")
                continue
            out.append(head + ":")
            for w in wins:
                note = " (đối chiếu ký hiệu vé)" if w.get("series_check") else ""
                out.append(f"  • {w['label']} ({w['number']}): {_vnd(w['value'])}{' trở lên' if note else ''}{note}")
        else:
            cfg = VIETLOTT[t.game]
            draws = vietlott_draws.get(t.game, [])
            draw = next((d for d in draws if d.get("date") == t.draw_date), None) if t.draw_date else (max(draws, key=lambda d: d.get("date", "")) if draws else None)
            head = f"\n🟡 {cfg['label']} <code>{t.numbers}</code> kỳ {('#' + draw['id']) if draw else t.draw_date}"
            if not draw:
                out.append(f"{head}: chưa có kết quả kỳ này.")
                continue
            r = check_vietlott_ticket(t.game, t.balls, draw)
            kind = f" (vé bao {len(t.balls)}, {r['sub_tickets']} vé con)" if len(t.balls) != 6 else ""
            won = [tier for tier in TIER_ORDER if r["counts"][tier]]
            if not won:
                out.append(f"{head}{kind}: trùng {len(r['matched'])} số, không trúng giải.")
                continue
            out.append(f"{head}{kind}:")
            for tier in won:
                value = "giá trị Jackpot của kỳ" if tier.startswith("jackpot") else _vnd(r["counts"][tier] * cfg["values"][tier])
                out.append(f"  • {TIER_LABELS[tier]} × {r['counts'][tier]}: {value}")
    out.append("\n<i>Giá trị giải chưa trừ thuế, chỉ để tham khảo. Đối chiếu kết quả chính thức: https://vietlott.vn/ • https://xosothudo.com.vn/</i>")
    return "\n".join(out)


def bao_sub_ticket_count(size: int, max_ball: int) -> int:
    return max_ball - 5 if size == 5 else comb(size, 6)
