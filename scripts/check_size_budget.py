"""Budget kích thước dữ liệu và bundle frontend, cấu hình trong size-budget.json.

- data: dữ liệu tải lúc mở trang (các fetch('./data/*.json') cố định trong tệp entry, mặc định
  web/src/App.tsx), tệp JSON lớn nhất, tệp history lớn nhất, tổng thư mục dữ liệu.
- bundle: chunk JS entry (được dist/index.html tham chiếu), tổng JS và CSS trong dist/assets.

Ngưỡng `max_*` làm CI fail; `target_*` chỉ in cảnh báo (mục tiêu sẽ siết dần sau Phase 1).
Kích thước gzip đo ở mức nén 9, xấp xỉ dung lượng truyền qua GitHub Pages.
Chỉ dùng thư viện chuẩn.

Cách dùng:
    python scripts/check_size_budget.py --only data
    python scripts/check_size_budget.py --only bundle   # sau npm run build
"""

from __future__ import annotations

import argparse
import gzip
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG = REPO_ROOT / "size-budget.json"
FETCH_RE = re.compile(r"""fetch\(\s*['"]\./data/([\w.-]+\.json)['"]""")
ENTRY_SCRIPT_RE = re.compile(r"""<script[^>]+src="[^"]*?/?(assets/[\w.-]+\.js)\"""")

@dataclass
class Measure:
    name: str
    raw: int
    gz: int
    detail: str = ""

def gz_size(data: bytes) -> int:
    return len(gzip.compress(data, compresslevel=9, mtime=0))

def measure_files(name: str, paths: list[Path], detail: str = "") -> Measure:
    raw = gz = 0
    for p in paths:
        b = p.read_bytes()
        raw += len(b)
        gz += gz_size(b)
    return Measure(name, raw, gz, detail)

def initial_data_files(entry_files: list[Path]) -> list[str]:
    names: list[str] = []
    for f in entry_files:
        for m in FETCH_RE.finditer(f.read_text(encoding="utf-8")):
            if m.group(1) not in names:
                names.append(m.group(1))
    return names

def measure_data(cfg: dict, data_dir: Path) -> list[Measure]:
    entry_files = [REPO_ROOT / p for p in cfg.get("initial_data_entry_files", ["web/src/App.tsx"])]
    names = initial_data_files(entry_files)
    missing = [n for n in names if not (data_dir / n).exists()]
    if missing:
        raise FileNotFoundError(f"thiếu tệp dữ liệu tải lúc mở trang: {', '.join(missing)}")
    out = [measure_files("initial_data", [data_dir / n for n in names], f"{len(names)} tệp: {', '.join(names)}")]

    top = sorted(data_dir.glob("*.json"), key=lambda p: p.stat().st_size, reverse=True)
    if top:
        out.append(measure_files("largest_data_file", [top[0]], top[0].name))
    hist = sorted((data_dir / "history").rglob("*.json"), key=lambda p: p.stat().st_size, reverse=True)
    if hist:
        out.append(measure_files("largest_history_file", [hist[0]], str(hist[0].relative_to(data_dir))))
    total = sum(p.stat().st_size for p in data_dir.rglob("*") if p.is_file())
    # Không nén tổng thư mục (chậm, không có ý nghĩa truyền tải)
    out.append(Measure("data_dir_total", total, 0, f"{sum(1 for p in data_dir.rglob('*') if p.is_file())} tệp"))
    return out

def measure_bundle(dist_dir: Path) -> list[Measure]:
    index_html = dist_dir / "index.html"
    if not index_html.exists():
        raise FileNotFoundError(f"không có {index_html}; chạy npm run build trước")
    match = ENTRY_SCRIPT_RE.search(index_html.read_text(encoding="utf-8"))
    if not match:
        raise ValueError("không tìm thấy script entry trong dist/index.html")
    assets = dist_dir / "assets"
    js = sorted(assets.glob("*.js"))
    css = sorted(assets.glob("*.css"))
    return [
        measure_files("entry_js", [dist_dir / match.group(1)], match.group(1)),
        measure_files("total_js", js, f"{len(js)} chunk"),
        measure_files("total_css", css, f"{len(css)} tệp"),
    ]

def evaluate(measures: list[Measure], budgets: dict) -> tuple[list[str], list[str]]:
    failures, warnings = [], []
    for m in measures:
        b = budgets.get(m.name, {})
        for kind, value in (("raw", m.raw), ("gzip", m.gz)):
            limit = b.get(f"max_{kind}")
            if limit is not None and value > limit:
                failures.append(f"{m.name} ({kind}) = {value:,} B vượt ngưỡng {limit:,} B")
            target = b.get(f"target_{kind}")
            if target is not None and value > target:
                warnings.append(f"{m.name} ({kind}) = {value:,} B chưa đạt mục tiêu {target:,} B")
    return failures, warnings

def _fmt(n: int) -> str:
    return f"{n / 1024:,.1f} KB" if n else "-"

def to_markdown(measures: list[Measure], budgets: dict) -> str:
    lines = ["### Budget kích thước", "", "| Hạng mục | Raw | Ngưỡng raw | Gzip | Ngưỡng gzip | Ghi chú |", "|---|---|---|---|---|---|"]
    for m in measures:
        b = budgets.get(m.name, {})
        lines.append(
            f"| {m.name} | {_fmt(m.raw)} | {_fmt(b.get('max_raw', 0))} | {_fmt(m.gz)} | {_fmt(b.get('max_gzip', 0))} | {m.detail} |"
        )
    return "\n".join(lines)

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--only", choices=["data", "bundle"], help="Chỉ kiểm tra một nhóm")
    parser.add_argument("--data-dir", type=Path, default=REPO_ROOT / "web" / "public" / "data")
    parser.add_argument("--dist-dir", type=Path, default=REPO_ROOT / "web" / "dist")
    args = parser.parse_args(argv)

    cfg = json.loads(args.config.read_text(encoding="utf-8"))
    budgets = cfg["budgets"]
    try:
        measures: list[Measure] = []
        if args.only in (None, "data"):
            measures += measure_data(cfg, args.data_dir)
        if args.only in (None, "bundle"):
            measures += measure_bundle(args.dist_dir)
    except (FileNotFoundError, ValueError) as e:
        print(f"::error::size budget: {e}")
        return 2

    failures, warnings = evaluate(measures, budgets)
    report = to_markdown(measures, budgets)
    print(report)
    summary_file = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_file:
        with open(summary_file, "a", encoding="utf-8") as f:
            f.write(report + "\n")
    for w in warnings:
        print(f"::warning::size budget: {w}")
    for e in failures:
        print(f"::error::size budget: {e}")
    if failures:
        print(f"\nsize budget: {len(failures)} hạng mục vượt ngưỡng ({args.config.name})", file=sys.stderr)
        return 1
    print("size budget: OK")
    return 0

if __name__ == "__main__":
    sys.exit(main())
