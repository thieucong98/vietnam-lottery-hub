"""Telegram bot Phase 3: dò vé /dove, lịch quay, đăng ký nhận kết quả (opt-in)."""
import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from engine.notifications.subscriptions import SubscriptionStore, parse_products
from engine.notifications.telegram_bot import (
    format_schedule_message,
    handle_telegram_command,
    next_draw,
    send_subscription_updates,
)
from engine.notifications.ticket_check import (
    bao_sub_ticket_count,
    check_ticket_lines,
    check_vietlott_ticket,
    check_xsmb_ticket,
    parse_ticket_line,
)

DATA_DIR = "web/public/data"
DRAW = {
    "special": 74129, "prize1": 97579, "prize2_1": 20960, "prize2_2": 11980,
    "prize3_1": 13449, "prize3_2": 30793, "prize3_3": 18746, "prize3_4": 86606, "prize3_5": 972, "prize3_6": 26471,
    "prize4_1": 1760, "prize4_2": 9505, "prize4_3": 3676, "prize4_4": 7568,
    "prize5_1": 1494, "prize5_2": 1478, "prize5_3": 5404, "prize5_4": 5724, "prize5_5": 9888, "prize5_6": 5597,
    "prize6_1": 714, "prize6_2": 93, "prize6_3": 910,
    "prize7_1": 51, "prize7_2": 34, "prize7_3": 12, "prize7_4": 95,
}


def tiers(ticket: str) -> list[str]:
    return [w["tier"] for w in check_xsmb_ticket(ticket, DRAW)]


def test_xsmb_rules_match_web():
    # Cùng các trường hợp với web/src/utils/xsmbTicket.test.ts
    assert tiers("74129") == ["special"]
    assert tiers("11129") == ["consolation"]
    assert tiers("00972") == ["prize3"]
    assert tiers("10972") == []
    assert tiers("31760") == ["prize4"]
    assert tiers("12093") == ["prize6"]
    assert tiers("99934") == ["prize7"]
    assert tiers("00000") == []


def test_vietlott_bao_matches_web():
    draw = {"balls": [1, 2, 21, 38, 39, 51], "special": 12}
    r = check_vietlott_ticket("vietlott_655", [1, 2, 21, 38, 39, 40, 51], draw)
    assert r["counts"] == {"jackpot1": 1, "jackpot2": 0, "prize1": 6, "prize2": 0, "prize3": 0}
    r = check_vietlott_ticket("vietlott_655", [1, 2, 12, 21, 38, 39, 40], draw)
    assert r["counts"] == {"jackpot1": 0, "jackpot2": 1, "prize1": 1, "prize2": 5, "prize3": 0}
    r = check_vietlott_ticket("vietlott_645", [3, 11, 14, 23, 25], {"balls": [3, 11, 14, 23, 25, 43]})
    assert r["sub_tickets"] == 40 and r["counts"]["jackpot1"] == 1 and r["counts"]["prize1"] == 39
    assert bao_sub_ticket_count(18, 55) == 18564


def test_parse_ticket_line():
    assert parse_ticket_line("74129").numbers == "74129"
    t = parse_ticket_line("655 2026-11-10 51 1 2 21 38 39")
    assert (t.game, t.draw_date, t.balls) == ("vietlott_655", "2026-11-10", [1, 2, 21, 38, 39, 51])
    assert parse_ticket_line("645 1 2 3 4 5 46").error
    assert parse_ticket_line("xsmb 2026-02-30 12345").error
    assert parse_ticket_line("1234").error


def test_dove_command_uses_real_data():
    resp = handle_telegram_command("/dove 74129", data_dir=DATA_DIR)
    assert "KẾT QUẢ DÒ VÉ" in resp
    recent = json.loads(Path(DATA_DIR, "xsmb_recent_draws.json").read_text(encoding="utf-8"))
    assert recent[0]["date"] in resp
    multi = handle_telegram_command("/dove\nxsmb 2020-01-01 12345\n655 1 2 3", data_dir=DATA_DIR)
    assert "ngoài 365 kỳ" in multi
    assert "❌" in multi
    assert "Cú pháp" in handle_telegram_command("/dove", data_dir=DATA_DIR)


def test_dove_escapes_and_limits():
    lines = [f"{10000 + i}" for i in range(25)]
    assert "Chỉ dò 20 vé" in check_ticket_lines(lines, [], {})
    # Chuỗi người dùng nhập không được đưa nguyên vào HTML trả về
    assert "<script>" not in check_ticket_lines(["<script>"], [], {})


def test_schedule_message():
    tz = ZoneInfo("Asia/Ho_Chi_Minh")
    # Thứ Năm 12/11/2026 19:00: Power 6/55 kỳ tới Thứ Bảy 14/11
    now = datetime(2026, 11, 12, 19, 0, tzinfo=tz)
    assert next_draw({1, 3, 5}, 18, 0, now) == datetime(2026, 11, 14, 18, 0, tzinfo=tz)
    msg = format_schedule_message({"vietlott_655": {"latest": {"id": "01422", "date": "2026-11-10", "jackpot1": 62_100_000_000, "jackpot2": 3_700_000_000}}}, now)
    assert "62.100.000.000đ" in msg
    assert "1/28.989.675" in msg
    assert "Mega 6/45: chưa có dữ liệu" in msg


def test_help_lists_new_commands():
    help_resp = handle_telegram_command("/help", data_dir=DATA_DIR)
    for cmd in ["/dove", "/lichquay", "/dangky", "/huydangky", "/trachnhiem"]:
        assert cmd in help_resp
    assert "1/28.989.675" in help_resp
    assert "gan lì" not in help_resp.lower()


def test_subscription_is_opt_in(tmp_path: Path):
    store = SubscriptionStore(tmp_path / "subs.json")
    assert store.subscribers() == {}
    assert parse_products([]) == ["xsmb", "vietlott_655", "vietlott_645"]
    assert parse_products(["655", "power"]) == ["vietlott_655"]
    assert parse_products(["abc"]) is None

    resp = handle_telegram_command("/dangky 655", data_dir=DATA_DIR, chat_id=42, store=store)
    assert "Power 6/55" in resp
    assert SubscriptionStore(tmp_path / "subs.json").products_of(42) == ["vietlott_655"]
    assert "Mã không hợp lệ" in handle_telegram_command("/dangky abc", data_dir=DATA_DIR, chat_id=42, store=store)
    assert "Đã hủy" in handle_telegram_command("/huydangky", data_dir=DATA_DIR, chat_id=42, store=store)
    assert SubscriptionStore(tmp_path / "subs.json").subscribers() == {}
    assert "chưa đăng ký" in handle_telegram_command("/huydangky", data_dir=DATA_DIR, chat_id=42, store=store)


class FakeRes:
    def __init__(self, status_code=200):
        self.status_code = status_code


def test_subscription_broadcast(tmp_path: Path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    real = json.loads(Path(DATA_DIR, "summary.json").read_text(encoding="utf-8"))
    (data_dir / "summary.json").write_text(json.dumps(real), encoding="utf-8")

    store = SubscriptionStore(tmp_path / "subs.json")
    store.subscribe(1, ["xsmb"])
    store.subscribe(2, ["vietlott_655"])
    calls = []

    def post(url, json=None, timeout=0):
        calls.append(json)
        return FakeRes(403 if json["chat_id"] == "2" else 200)

    # Lần đầu chỉ ghi mốc, không gửi lại kỳ cũ
    assert send_subscription_updates("t", str(data_dir), store, post) == 0
    assert calls == []

    real["xsmb_latest"]["date"] = "2099-01-01"
    real["vietlott_655_latest"]["id"] = "99999"
    (data_dir / "summary.json").write_text(json.dumps(real), encoding="utf-8")
    assert send_subscription_updates("t", str(data_dir), store, post) == 1
    assert {c["chat_id"] for c in calls} == {"1", "2"}
    assert "/huydangky" in calls[0]["text"]
    # Người dùng chặn bot (403) bị xóa đăng ký
    assert "2" not in store.subscribers()
    # Không gửi lặp khi chưa có kỳ mới
    assert send_subscription_updates("t", str(data_dir), store, post) == 0

class FakeRes429(FakeRes):
    def __init__(self, retry_after):
        super().__init__(429)
        self.retry_after = retry_after

    def json(self):
        return {"ok": False, "error_code": 429, "parameters": {"retry_after": self.retry_after}}

def test_subscription_broadcast_retries_on_429(tmp_path: Path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    real = json.loads(Path(DATA_DIR, "summary.json").read_text(encoding="utf-8"))
    (data_dir / "summary.json").write_text(json.dumps(real), encoding="utf-8")

    store = SubscriptionStore(tmp_path / "subs.json")
    store.subscribe(1, ["xsmb"])
    store.subscribe(2, ["xsmb"])
    send_subscription_updates("t", str(data_dir), store, lambda *a, **k: FakeRes())

    real["xsmb_latest"]["date"] = "2099-01-01"
    (data_dir / "summary.json").write_text(json.dumps(real), encoding="utf-8")
    attempts = {"1": 0, "2": 0}
    waits = []

    def post(url, json=None, timeout=0):
        attempts[json["chat_id"]] += 1
        if json["chat_id"] == "1" and attempts["1"] == 1:
            return FakeRes429(999)
        if json["chat_id"] == "2":
            return FakeRes(500)
        return FakeRes()

    # 429: chờ (giới hạn 30 giây) rồi gửi lại; lỗi khác không tính là đã gửi
    assert send_subscription_updates("t", str(data_dir), store, post, sleep=waits.append) == 1
    assert attempts == {"1": 2, "2": 1}
    assert waits == [30]
    assert set(store.subscribers()) == {"1", "2"}
