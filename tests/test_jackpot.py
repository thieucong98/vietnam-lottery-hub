import json
from pathlib import Path

from engine.crawlers.jackpot import JackpotTracker, parse_jackpot_page, parse_money

FIXTURE = Path(__file__).parent / "fixtures" / "vietlott_655_result.html"


class FakeResponse:
    def __init__(self, status_code: int, text: str = ""):
        self.status_code = status_code
        self.text = text


class FakeHttp:
    def __init__(self, pages: dict[str, FakeResponse]):
        self.pages = pages
        self.calls: list[str] = []

    def get(self, url: str, timeout: int = 0):
        self.calls.append(url)
        for key, resp in self.pages.items():
            if key in url:
                return resp
        return FakeResponse(404)


def page(draw_id: str, date_vn: str, jp1: str, jp2: str | None = None) -> str:
    jp2_html = f'<div class="col-md-5"><h5>Giá trị Jackpot 2</h5></div><div class="col-md-7"><div class="so_tien"><h3>{jp2}</h3></div></div>' if jp2 else ""
    return (
        f'<div class="chitietketqua_title"><h5>Kỳ quay thưởng <b>#{draw_id}</b> ngày <b>{date_vn}</b></h5></div>'
        f'<div class="gt_jackpot"><div class="row"><div class="col-md-5"><h5>Giá trị Jackpot 1</h5></div>'
        f'<div class="col-md-7"><div class="so_tien"><h3>{jp1}</h3><p>VNĐ</p></div></div>{jp2_html}</div></div>'
    )


def write_draws(data_dir: Path, name: str, draws: list[tuple[str, str]]):
    data_dir.mkdir(parents=True, exist_ok=True)
    with open(data_dir / name, "w", encoding="utf-8") as f:
        for d, i in draws:
            f.write(json.dumps({"date": d, "id": i, "result": [1, 2, 3, 4, 5, 6]}) + "\n")


def test_parse_money():
    assert parse_money("50.929.534.650") == 50_929_534_650
    assert parse_money(" 12,000,000,000 ") == 12_000_000_000
    assert parse_money("--") is None


def test_parse_real_page_fixture():
    parsed = parse_jackpot_page(FIXTURE.read_text(encoding="utf-8"))
    assert parsed == {"id": "01224", "date": "2025-08-02", "jackpot1": 50_929_534_650, "jackpot2": 4_137_610_150}


def test_sync_and_export(tmp_path: Path):
    data_dir = tmp_path / "vietlott"
    web_dir = tmp_path / "web"
    write_draws(data_dir, "power655.jsonl", [("2026-11-07", "01421"), ("2026-11-10", "01422")])
    write_draws(data_dir, "power645.jsonl", [("2026-11-11", "01587")])
    http = FakeHttp({
        "655?id=01421": FakeResponse(200, page("01421", "07/11/2026", "60.000.000.000", "3.500.000.000")),
        "655?id=01422": FakeResponse(200, page("01422", "10/11/2026", "62.100.000.000", "3.700.000.000")),
        "645?id=01587": FakeResponse(200, page("01587", "11/11/2026", "15.500.000.000")),
    })
    tracker = JackpotTracker(data_dir=data_dir, web_data_dir=web_dir, http=http)
    assert tracker.sync() == 3
    # Lần sau không tải lại kỳ đã có
    assert tracker.sync() == 0
    assert len(http.calls) == 3

    payload = json.loads(tracker.export().read_text(encoding="utf-8"))
    assert payload["vietlott_655"]["latest"] == {"id": "01422", "date": "2026-11-10", "jackpot1": 62_100_000_000, "jackpot2": 3_700_000_000}
    assert [r["id"] for r in payload["vietlott_655"]["history"]] == ["01422", "01421"]
    assert payload["vietlott_645"]["latest"] == {"id": "01587", "date": "2026-11-11", "jackpot1": 15_500_000_000}


def test_blocked_source_keeps_old_data(tmp_path: Path):
    data_dir = tmp_path / "vietlott"
    write_draws(data_dir, "power655.jsonl", [("2026-11-10", "01422")])
    write_draws(data_dir, "power645.jsonl", [])
    http = FakeHttp({"655?id=01422": FakeResponse(403, "Just a moment...")})
    tracker = JackpotTracker(data_dir=data_dir, web_data_dir=tmp_path / "web", http=http)
    assert tracker.sync() == 0
    payload = tracker.build_payload()
    assert payload["vietlott_655"] == {"latest": None, "history": []}


def test_wrong_draw_on_page_is_ignored(tmp_path: Path):
    data_dir = tmp_path / "vietlott"
    write_draws(data_dir, "power655.jsonl", [("2026-11-10", "01422")])
    write_draws(data_dir, "power645.jsonl", [])
    http = FakeHttp({"655?id=01422": FakeResponse(200, page("01400", "01/10/2026", "40.000.000.000"))})
    tracker = JackpotTracker(data_dir=data_dir, web_data_dir=tmp_path / "web", http=http)
    assert tracker.sync() == 0
