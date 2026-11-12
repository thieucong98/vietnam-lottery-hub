import json
from datetime import date, datetime, timedelta
from pathlib import Path

from engine.monitoring.alerts import (
    FINGERPRINT_RE,
    TelegramAdmin,
    _redact,
    dispatch_alerts,
)
from engine.monitoring.health_check import (
    PRODUCTS_BY_KEY,
    VN_TZ,
    expected_latest_draw,
    run_checks,
)

XSMB_HEADER = "date,special," + ",".join(f"p{i}" for i in range(26))

def _vn(s: str) -> datetime:
    return datetime.fromisoformat(s).replace(tzinfo=VN_TZ)

def _write_data(tmp_path: Path, xsmb_dates: list[str], p655: list[tuple[str, str]]) -> tuple[Path, Path, Path]:
    xsmb_dir = tmp_path / "xsmb"
    viet_dir = tmp_path / "vietlott"
    xsmb_dir.mkdir()
    viet_dir.mkdir()
    rows = [XSMB_HEADER] + [f"{d},12345," + ",".join("1" for _ in range(26)) for d in xsmb_dates]
    (xsmb_dir / "xsmb.csv").write_text("\n".join(rows) + "\n", encoding="utf-8")
    with open(viet_dir / "power655.jsonl", "w", encoding="utf-8") as f:
        f.writelines(json.dumps({"date": d, "id": i, "result": [1, 2, 3, 4, 5, 6, 7]}) + "\n" for d, i in p655)
    summary = tmp_path / "summary.json"
    summary.write_text(json.dumps({
        "xsmb_latest": {"date": xsmb_dates[-1]},
        "vietlott_655_latest": {"id": p655[-1][1]},
    }), encoding="utf-8")
    return xsmb_dir, viet_dir, summary

def _only(report, product):
    return [p for p in report.problems if p.product == product]

def test_expected_latest_draw_respects_cutoff_and_weekdays():
    xsmb = PRODUCTS_BY_KEY["xsmb"]
    p655 = PRODUCTS_BY_KEY["power_655"]
    # Thứ Năm 12/11/2026: trước giờ chốt thì kỳ mong đợi là hôm qua
    assert expected_latest_draw(xsmb, _vn("2026-11-12T15:00")) == date(2026, 11, 11)
    assert expected_latest_draw(xsmb, _vn("2026-11-12T21:30")) == date(2026, 11, 12)
    # Power 6/55 quay Thứ 3/5/7
    assert expected_latest_draw(p655, _vn("2026-11-12T15:00")) == date(2026, 11, 10)
    assert expected_latest_draw(p655, _vn("2026-11-12T21:30")) == date(2026, 11, 12)

def test_expected_latest_draw_skips_tet():
    # Mùng 1 Tết Bính Ngọ 17/02/2026: XSMB nghỉ 16-19/02
    assert expected_latest_draw(PRODUCTS_BY_KEY["xsmb"], _vn("2026-02-19T22:00")) == date(2026, 2, 15)

def test_stale_xsmb_raises_problem(tmp_path):
    xsmb_dir, viet_dir, summary = _write_data(
        tmp_path, ["2026-11-09", "2026-11-10"], [("2026-11-07", "01420"), ("2026-11-10", "01421")]
    )
    report = run_checks(now=_vn("2026-11-12T15:00"), data_dir_xsmb=xsmb_dir, data_dir_vietlott=viet_dir, summary_path=summary)
    problems = _only(report, "xsmb")
    assert [p.kind for p in problems] == ["thiếu kỳ mới"]
    assert "2026-11-11" in problems[0].message

def test_fresh_data_has_no_xsmb_or_655_problem(tmp_path):
    xsmb_dir, viet_dir, summary = _write_data(
        tmp_path, ["2026-11-10", "2026-11-11"], [("2026-11-07", "01420"), ("2026-11-10", "01421")]
    )
    report = run_checks(now=_vn("2026-11-12T15:00"), data_dir_xsmb=xsmb_dir, data_dir_vietlott=viet_dir, summary_path=summary)
    assert _only(report, "xsmb") == []
    assert _only(report, "power_655") == []

def test_recent_gap_detected_but_old_gap_ignored(tmp_path):
    # Khoảng trống cũ 2025-01-02 nằm ngoài cửa sổ; cửa sổ gần đây liên tục trừ 2026-11-10
    start = date(2026, 9, 1)
    recent = [(start + timedelta(days=i)).isoformat() for i in range((date(2026, 11, 11) - start).days + 1)]
    recent.remove("2026-11-10")
    dates = ["2025-01-01", "2025-01-03"] + [
        (date(2025, 1, 3) + timedelta(days=i)).isoformat() for i in range(1, (start - date(2025, 1, 3)).days)
    ] + recent
    xsmb_dir, viet_dir, summary = _write_data(tmp_path, dates, [("2026-11-10", "01421")])
    report = run_checks(now=_vn("2026-11-12T15:00"), data_dir_xsmb=xsmb_dir, data_dir_vietlott=viet_dir, summary_path=summary)
    gaps = [p for p in _only(report, "xsmb") if p.kind == "kỳ thiếu gần đây"]
    assert len(gaps) == 1
    assert "2026-11-10" in gaps[0].message
    assert "2025-01-02" not in gaps[0].message

def test_vietlott_id_gap_detected(tmp_path):
    xsmb_dir, viet_dir, summary = _write_data(
        tmp_path, ["2026-11-11"], [("2026-11-05", "01419"), ("2026-11-10", "01421")]
    )
    report = run_checks(now=_vn("2026-11-12T15:00"), data_dir_xsmb=xsmb_dir, data_dir_vietlott=viet_dir, summary_path=summary)
    gaps = [p for p in _only(report, "power_655") if p.kind == "kỳ thiếu gần đây"]
    assert gaps and "1420" in gaps[0].message

def test_simulate_missing_drops_latest(tmp_path):
    xsmb_dir, viet_dir, summary = _write_data(
        tmp_path, ["2026-11-10", "2026-11-11"], [("2026-11-10", "01421")]
    )
    report = run_checks(now=_vn("2026-11-12T15:00"), data_dir_xsmb=xsmb_dir, data_dir_vietlott=viet_dir,
                        summary_path=summary, simulate_missing="xsmb")
    assert report.latest["xsmb"].draw_date == date(2026, 11, 10)
    assert any(p.kind == "thiếu kỳ mới" for p in _only(report, "xsmb"))

def test_published_mismatch_and_pipeline_errors(tmp_path):
    xsmb_dir, viet_dir, summary = _write_data(tmp_path, ["2026-11-10", "2026-11-11"], [("2026-11-10", "01421")])
    summary.write_text(json.dumps({"xsmb_latest": {"date": "2026-11-10"}, "vietlott_655_latest": {"id": "01421"}}), encoding="utf-8")
    pipeline_report = tmp_path / "pipeline_report.json"
    pipeline_report.write_text(json.dumps({"errors": [{"step": "crawl_xsmb", "message": "HTTPError: 403"}]}), encoding="utf-8")
    report = run_checks(now=_vn("2026-11-12T15:00"), data_dir_xsmb=xsmb_dir, data_dir_vietlott=viet_dir,
                        summary_path=summary, pipeline_report=pipeline_report,
                        step_outcomes={"pytest": "failure", "deploy": "skipped"})
    kinds = {p.kind for p in report.problems}
    assert "dữ liệu xuất bản lệch" in kinds
    assert "pipeline lỗi" in kinds
    msgs = " ".join(p.message for p in report.problems)
    assert "pytest" in msgs and "deploy" not in msgs

class FakeGitHub:
    run_url = "https://github.com/o/r/actions/runs/1"

    def __init__(self, existing=None):
        self.existing = existing
        self.calls = []

    def find_open_alerts(self):
        if self.existing is None:
            return []
        return self.existing if isinstance(self.existing, list) else [self.existing]

    def close_duplicate(self, number, keep):
        self.calls.append(("duplicate", number))
        return "duplicate"

    def open_alert(self, body):
        self.calls.append(("open", body))
        return "open"

    def update_alert(self, number, body, comment):
        self.calls.append(("update", body))
        return "update"

    def close_alert(self, number, comment):
        self.calls.append(("close", comment))
        return "close"

class FakeTelegram:
    def __init__(self):
        self.sent = []

    def send(self, text):
        self.sent.append(text)
        return True

def _problem_report(tmp_path):
    xsmb_dir, viet_dir, summary = _write_data(tmp_path, ["2026-11-09", "2026-11-10"], [("2026-11-10", "01421")])
    return run_checks(now=_vn("2026-11-12T15:00"), data_dir_xsmb=xsmb_dir, data_dir_vietlott=viet_dir, summary_path=summary)

def _ok_report(tmp_path):
    xsmb_dir, viet_dir, summary = _write_data(tmp_path, ["2026-11-10", "2026-11-11"], [("2026-11-10", "01421")])
    report = run_checks(now=_vn("2026-11-12T15:00"), data_dir_xsmb=xsmb_dir, data_dir_vietlott=viet_dir, summary_path=summary)
    # Các sản phẩm không có tệp trong thư mục tạm báo "thiếu tệp"; bỏ qua để mô phỏng trạng thái tốt
    report.problems = []
    return report

def test_dispatch_opens_issue_and_notifies(tmp_path):
    report = _problem_report(tmp_path)
    gh, tg = FakeGitHub(), FakeTelegram()
    dispatch_alerts(report, telegram=tg, github=gh)
    assert gh.calls[0][0] == "open"
    assert FINGERPRINT_RE.search(gh.calls[0][1]).group(1) == report.fingerprint()
    assert len(tg.sent) == 1 and "Cảnh báo" in tg.sent[0]

def test_dispatch_same_fingerprint_is_quiet(tmp_path):
    report = _problem_report(tmp_path)
    existing = {"number": 7, "html_url": "u", "body": f"<!-- data-alert-fingerprint: {report.fingerprint()} -->"}
    gh, tg = FakeGitHub(existing), FakeTelegram()
    dispatch_alerts(report, telegram=tg, github=gh)
    assert gh.calls == [] and tg.sent == []

def test_dispatch_changed_fingerprint_updates(tmp_path):
    report = _problem_report(tmp_path)
    existing = {"number": 7, "html_url": "u", "body": "<!-- data-alert-fingerprint: 0000 -->"}
    gh, tg = FakeGitHub(existing), FakeTelegram()
    dispatch_alerts(report, telegram=tg, github=gh)
    assert gh.calls[0][0] == "update" and len(tg.sent) == 1

def test_dispatch_recovery_closes_issue(tmp_path):
    report = _ok_report(tmp_path)
    gh, tg = FakeGitHub({"number": 7, "html_url": "u", "body": ""}), FakeTelegram()
    dispatch_alerts(report, telegram=tg, github=gh)
    assert gh.calls[0][0] == "close"
    assert "bình thường" in tg.sent[0]

def test_dispatch_ok_without_issue_sends_nothing(tmp_path):
    report = _ok_report(tmp_path)
    gh, tg = FakeGitHub(), FakeTelegram()
    dispatch_alerts(report, telegram=tg, github=gh)
    assert gh.calls == [] and tg.sent == []

def test_telegram_errors_do_not_leak_token(monkeypatch, capsys):
    import requests
    from loguru import logger

    token = "123456:SECRET-TOKEN"

    def boom(url, **kwargs):
        raise requests.ConnectionError(f"failed to reach {url}")

    monkeypatch.setattr(requests, "post", boom)
    messages = []
    sink = logger.add(lambda m: messages.append(str(m)), level="ERROR")
    try:
        assert TelegramAdmin(token, "-100").send("x") is False
    finally:
        logger.remove(sink)
    assert messages and all(token not in m for m in messages)
    assert _redact(f"a {token} b", token) == "a *** b"

def test_dispatch_closes_duplicate_alerts(tmp_path):
    report = _problem_report(tmp_path)
    body = f"<!-- data-alert-fingerprint: {report.fingerprint()} -->"
    gh, tg = FakeGitHub([{"number": 3, "html_url": "u", "body": body}, {"number": 4, "html_url": "u", "body": body}]), FakeTelegram()
    dispatch_alerts(report, telegram=tg, github=gh)
    assert gh.calls == [("duplicate", 4)]
    assert tg.sent == []
