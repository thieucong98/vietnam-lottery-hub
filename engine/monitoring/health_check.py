"""Kiểm tra sức khỏe dữ liệu sau mỗi lần chạy crawler và gửi cảnh báo khi có sự cố.

Các kiểm tra:
1. Dữ liệu cũ: kỳ quay gần nhất theo lịch (đã qua giờ chốt) chưa có trong dữ liệu.
2. Kỳ thiếu gần đây: dùng MissingDetector, chỉ xét cửa sổ gần nhất (khoảng trống lịch sử
   như nghỉ Tết hay Keno cũ từ mirror không gây cảnh báo lặp lại mỗi lần chạy).
3. Dữ liệu xuất bản lệch: summary.json không khớp kỳ mới nhất trong data/.
4. Pipeline lỗi: bước cào/xử lý báo lỗi, hoặc một bước CI (pytest, schema, budget) thất bại.

Cách dùng:
    python -m engine.monitoring.health_check --dry-run
    python -m engine.monitoring.health_check --simulate-missing xsmb --dry-run
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import polars as pl
from loguru import logger

from engine.crawlers.vietlott import PRODUCT_CONFIGS
from engine.missing_detector import MissingDetector

VN_TZ = ZoneInfo("Asia/Ho_Chi_Minh")

# Ngày nghỉ quay dịp Tết Nguyên đán (30 Tết -> mùng 3). 2024-2026 lấy từ khoảng trống thực tế
# trong data/xsmb/xsmb.csv; 2027 tính theo âm lịch (mùng 1 = 06/02/2027), cần đối chiếu thông báo chính thức.
NO_DRAW_DATES = frozenset(
    date.fromisoformat(d)
    for d in [
        "2024-02-09", "2024-02-10", "2024-02-11", "2024-02-12",
        "2025-01-28", "2025-01-29", "2025-01-30", "2025-01-31",
        "2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19",
        "2027-02-05", "2027-02-06", "2027-02-07", "2027-02-08",
    ]
)

ALL_DAYS = frozenset(range(7))

@dataclass(frozen=True)
class ProductSpec:
    key: str
    label: str
    # Thứ trong tuần có quay (0 = Thứ Hai)
    weekdays: frozenset[int]
    # Giờ VN mà sau đó kết quả của ngày quay phải có trong dữ liệu (đã cộng biên trễ của cron/mirror)
    ready_at: time
    # Cửa sổ soát kỳ thiếu: số ngày gần nhất (XSMB) hoặc số kỳ gần nhất (Vietlott)
    gap_window: int

PRODUCTS: list[ProductSpec] = [
    ProductSpec("xsmb", "XSMB", ALL_DAYS, time(21, 0), 45),
    ProductSpec("power_655", "Power 6/55", frozenset({1, 3, 5}), time(21, 0), 60),
    ProductSpec("power_645", "Mega 6/45", frozenset({2, 4, 6}), time(21, 0), 60),
    ProductSpec("3d", "Max 3D", frozenset({0, 2, 4}), time(21, 0), 60),
    ProductSpec("3d_pro", "Max 3D Pro", frozenset({1, 3, 5}), time(21, 0), 60),
    # Keno quay 06:00-21:52 hằng ngày, khoảng 119 kỳ/ngày
    ProductSpec("keno", "Keno", ALL_DAYS, time(22, 30), 300),
]
PRODUCTS_BY_KEY = {p.key: p for p in PRODUCTS}

# Sản phẩm có bản ghi kỳ mới nhất trong summary.json: (khóa summary, khóa so sánh)
PUBLISHED_KEYS = {
    "xsmb": ("xsmb_latest", "date"),
    "power_655": ("vietlott_655_latest", "id"),
    "power_645": ("vietlott_645_latest", "id"),
}

@dataclass(frozen=True)
class Problem:
    kind: str
    product: str
    message: str
    # Phần ổn định dùng cho fingerprint (không chứa thời điểm chạy)
    key: str

@dataclass(frozen=True)
class LatestDraw:
    draw_date: date | None
    draw_id: str | None

@dataclass
class HealthReport:
    checked_at: datetime
    problems: list[Problem] = field(default_factory=list)
    latest: dict[str, LatestDraw] = field(default_factory=dict)
    simulated: str | None = None

    @property
    def ok(self) -> bool:
        return not self.problems

    def fingerprint(self) -> str:
        keys = sorted(f"{p.kind}:{p.product}:{p.key}" for p in self.problems)
        return hashlib.sha256("\n".join(keys).encode("utf-8")).hexdigest()[:16]

    def to_markdown(self) -> str:
        lines = [f"### Kiểm tra dữ liệu lúc {self.checked_at:%Y-%m-%d %H:%M} (giờ VN)", ""]
        if self.simulated:
            lines += [f"> Chạy thử: giả lập thiếu kỳ mới nhất của `{self.simulated}`.", ""]
        if self.ok:
            lines.append("Không phát hiện sự cố: dữ liệu đủ kỳ và khớp lịch quay.")
        else:
            lines.append(f"Phát hiện {len(self.problems)} sự cố:")
            lines += [f"- **{product_label(p.product)}** ({p.kind}): {p.message}" for p in self.problems]
        lines += ["", "| Sản phẩm | Ngày quay mới nhất | Kỳ |", "|---|---|---|"]
        for spec in PRODUCTS:
            d = self.latest.get(spec.key)
            if d is None:
                continue
            lines.append(f"| {spec.label} | {d.draw_date or '-'} | {d.draw_id or '-'} |")
        return "\n".join(lines)

def product_label(product: str) -> str:
    spec = PRODUCTS_BY_KEY.get(product)
    return spec.label if spec else product

def expected_latest_draw(spec: ProductSpec, now: datetime) -> date:
    """Ngày quay gần nhất mà kết quả lẽ ra đã có trong dữ liệu tại thời điểm `now` (giờ VN)."""
    d = now.date()
    if now.time() < spec.ready_at:
        d -= timedelta(days=1)
    for _ in range(14):
        if d.weekday() in spec.weekdays and d not in NO_DRAW_DATES:
            return d
        d -= timedelta(days=1)
    return d

def load_latest(
    spec: ProductSpec,
    data_dir_xsmb: Path,
    data_dir_vietlott: Path,
    drop_latest: bool = False,
) -> LatestDraw | None:
    """Đọc kỳ mới nhất của sản phẩm. `drop_latest` bỏ ngày mới nhất để chạy thử cảnh báo."""
    if spec.key == "xsmb":
        path = data_dir_xsmb / "xsmb.csv"
        if not path.exists():
            return None
        df = pl.read_csv(path, columns=["date"]).with_columns(pl.col("date").str.to_date())
    else:
        path = data_dir_vietlott / PRODUCT_CONFIGS[spec.key]["file"]
        if not path.exists():
            return None
        df = pl.read_ndjson(path).select(
            pl.col("date").str.to_date(),
            pl.col("id").cast(pl.Utf8).str.strip_chars_start("#").cast(pl.Int64),
        )
    if df.is_empty():
        return None
    if drop_latest:
        df = df.filter(pl.col("date") < df["date"].max())
        if df.is_empty():
            return None
    last_date = df["date"].max()
    last_id = None
    if "id" in df.columns:
        width = len(_raw_last_id(path)) or 5
        last_id = str(df.filter(pl.col("date") == last_date)["id"].max()).zfill(width)
    return LatestDraw(last_date, last_id)

def _raw_last_id(path: Path) -> str:
    """Độ rộng mã kỳ gốc (ví dụ '01422', '0302616') để hiển thị đúng định dạng."""
    with open(path, "rb") as f:
        f.seek(0, os.SEEK_END)
        f.seek(max(0, f.tell() - 4096))
        tail = f.read().decode("utf-8", errors="ignore").strip().splitlines()
    try:
        return str(json.loads(tail[-1]).get("id", "")).lstrip("#")
    except (IndexError, json.JSONDecodeError):
        return ""

def check_freshness(report: HealthReport, specs: list[ProductSpec], data_dir_xsmb: Path,
                    data_dir_vietlott: Path, simulate: str | None) -> None:
    for spec in specs:
        latest = load_latest(spec, data_dir_xsmb, data_dir_vietlott, drop_latest=(spec.key == simulate))
        if latest is None:
            report.problems.append(Problem("thiếu tệp", spec.key, "không đọc được tệp dữ liệu", "missing_file"))
            continue
        report.latest[spec.key] = latest
        expected = expected_latest_draw(spec, report.checked_at)
        if latest.draw_date < expected:
            behind = (expected - latest.draw_date).days
            report.problems.append(Problem(
                "thiếu kỳ mới",
                spec.key,
                f"kỳ quay ngày {expected} đã qua giờ chốt nhưng dữ liệu mới nhất là ngày "
                f"{latest.draw_date} (chậm {behind} ngày)",
                f"stale:{expected}",
            ))

def check_recent_gaps(report: HealthReport, specs: list[ProductSpec], detector: MissingDetector) -> None:
    today = report.checked_at.date()
    for spec in specs:
        try:
            if spec.key == "xsmb":
                since = today - timedelta(days=spec.gap_window)
                missing = [d for d in detector.detect_missing_xsmb_dates() if d >= since and d not in NO_DRAW_DATES]
                shown = [d.isoformat() for d in missing]
            else:
                missing_ids = detector.detect_missing_vietlott_ids(spec.key)
                latest = report.latest.get(spec.key)
                if not missing_ids or latest is None or latest.draw_id is None:
                    continue
                floor = int(latest.draw_id) - spec.gap_window
                missing = [i for i in missing_ids if i > floor]
                shown = [str(i) for i in missing]
        except Exception as e:
            report.problems.append(Problem("lỗi kiểm tra", spec.key, f"không soát được kỳ thiếu: {e}", "detector_error"))
            continue
        if missing:
            preview = ", ".join(shown[:10]) + (" ..." if len(shown) > 10 else "")
            report.problems.append(Problem(
                "kỳ thiếu gần đây",
                spec.key,
                f"{len(missing)} kỳ thiếu sau khi đã cào bù: {preview}",
                "gap:" + ",".join(shown),
            ))

def check_published(report: HealthReport, summary_path: Path) -> None:
    if not summary_path.exists():
        report.problems.append(Problem("dữ liệu xuất bản", "summary", f"không có {summary_path}", "missing_summary"))
        return
    try:
        summary = json.loads(summary_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        report.problems.append(Problem("dữ liệu xuất bản", "summary", f"summary.json hỏng: {e}", "bad_summary"))
        return
    for product, (summary_key, field_name) in PUBLISHED_KEYS.items():
        latest = report.latest.get(product)
        if latest is None:
            continue
        published = str((summary.get(summary_key) or {}).get(field_name, ""))
        actual = latest.draw_date.isoformat() if field_name == "date" else latest.draw_id
        if published != actual:
            report.problems.append(Problem(
                "dữ liệu xuất bản lệch",
                product,
                f"summary.json đang hiển thị {field_name}={published or '-'} nhưng dữ liệu gốc mới nhất là {actual}",
                f"published:{published}->{actual}",
            ))

def check_pipeline(report: HealthReport, pipeline_report: Path | None, step_outcomes: dict[str, str]) -> None:
    for step, outcome in step_outcomes.items():
        if outcome in ("failure", "cancelled"):
            report.problems.append(Problem("bước CI lỗi", "pipeline", f"bước '{step}' kết thúc với trạng thái '{outcome}'", f"outcome:{step}:{outcome}"))
    if pipeline_report is None or not pipeline_report.exists():
        return
    try:
        errors = json.loads(pipeline_report.read_text(encoding="utf-8")).get("errors", [])
    except json.JSONDecodeError:
        errors = [{"step": "pipeline_report", "message": "không đọc được báo cáo pipeline"}]
    for err in errors:
        step = err.get("step", "?") if isinstance(err, dict) else "?"
        msg = err.get("message", "") if isinstance(err, dict) else str(err)
        report.problems.append(Problem("pipeline lỗi", "pipeline", f"{step}: {msg[:300]}", f"error:{step}"))

def run_checks(
    now: datetime | None = None,
    data_dir_xsmb: Path = Path("data/xsmb"),
    data_dir_vietlott: Path = Path("data/vietlott"),
    summary_path: Path = Path("web/public/data/summary.json"),
    pipeline_report: Path | None = None,
    step_outcomes: dict[str, str] | None = None,
    simulate_missing: str | None = None,
) -> HealthReport:
    now = (now or datetime.now(VN_TZ)).astimezone(VN_TZ)
    report = HealthReport(checked_at=now, simulated=simulate_missing)
    check_freshness(report, PRODUCTS, data_dir_xsmb, data_dir_vietlott, simulate_missing)
    check_recent_gaps(report, PRODUCTS, MissingDetector(data_dir_xsmb, data_dir_vietlott))
    if simulate_missing is None:
        check_published(report, summary_path)
    check_pipeline(report, pipeline_report, step_outcomes or {})
    return report

def main(argv: list[str] | None = None) -> int:
    from engine.monitoring.alerts import build_channels, dispatch_alerts

    parser = argparse.ArgumentParser(description="Kiểm tra thiếu kỳ / dữ liệu cũ và gửi cảnh báo")
    parser.add_argument("--pipeline-report", type=Path, help="Tệp JSON lỗi do scripts/run_pipeline.py ghi ra")
    parser.add_argument("--step-outcome", action="append", default=[], metavar="TÊN=KẾT_QUẢ",
                        help="Kết quả một bước CI (steps.<id>.outcome), lặp lại cho nhiều bước")
    parser.add_argument("--simulate-missing", choices=sorted(PRODUCTS_BY_KEY), help="Giả lập thiếu ngày quay mới nhất (chạy thử cảnh báo)")
    parser.add_argument("--now", help="Thời điểm kiểm tra (ISO 8601), mặc định là hiện tại")
    parser.add_argument("--dry-run", action="store_true", help="Chỉ in nội dung cảnh báo, không gửi")
    args = parser.parse_args(argv)

    now = datetime.fromisoformat(args.now) if args.now else None
    if now is not None and now.tzinfo is None:
        now = now.replace(tzinfo=VN_TZ)

    step_outcomes = dict(item.split("=", 1) for item in args.step_outcome if "=" in item)
    report = run_checks(
        now=now,
        pipeline_report=args.pipeline_report,
        step_outcomes=step_outcomes,
        simulate_missing=args.simulate_missing,
    )
    markdown = report.to_markdown()
    print(markdown)
    step_summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if step_summary:
        with open(step_summary, "a", encoding="utf-8") as f:
            f.write(markdown + "\n")

    telegram, github = build_channels(dry_run=args.dry_run)
    actions = dispatch_alerts(report, telegram=telegram, github=github)
    for action in actions:
        logger.info(f"Cảnh báo: {action}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
