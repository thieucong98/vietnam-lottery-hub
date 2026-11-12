"""Kiểm tra schema JSON của dữ liệu xuất bản (web/public/data) trước khi commit/deploy.

- Mỗi tệp JSON được kiểm tra theo schema trong schemas/data (JSON Schema 2020-12).
- Thư mục history/ phải đủ bộ tệp 00-99 (XSMB), 01-55 (6/55), 01-45 (6/45).
- Mọi tệp ./data/*.json mà web/src gọi fetch phải tồn tại.
- Kiểm tra chéo: kỳ mới nhất trong summary.json khớp với các tệp chỉ mục.

Thoát với mã 1 nếu có lỗi.

Cách dùng:
    uv run python scripts/validate_data_schema.py
    uv run python scripts/validate_data_schema.py --data-dir web/dist/data
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_DIR = REPO_ROOT / "schemas" / "data"

# Tệp dữ liệu -> schema
FILE_SCHEMAS = {
    "summary.json": "summary.schema.json",
    "ml_insights.json": "ml_insights.schema.json",
    "xsmb_index.json": "xsmb_index.schema.json",
    "vietlott_655_index.json": "vietlott_655_index.schema.json",
    "vietlott_645_index.json": "vietlott_645_index.schema.json",
    "bac_nho.json": "bac_nho.schema.json",
    "vietlott_full_draws.json": "vietlott_full_draws.schema.json",
    "vietlott_cooccurrence.json": "vietlott_cooccurrence.schema.json",
    "xsmb_recent_draws.json": "xsmb_recent_draws.schema.json",
}

# Thư mục history -> (schema, danh sách số phải có)
HISTORY_SETS = {
    "xsmb": ("history_xsmb.schema.json", [f"{i:02d}" for i in range(100)]),
    "vietlott_655": ("history_vietlott_655.schema.json", [f"{i:02d}" for i in range(1, 56)]),
    "vietlott_645": ("history_vietlott_645.schema.json", [f"{i:02d}" for i in range(1, 46)]),
}

MAX_ERRORS_PER_FILE = 5
FETCH_RE = re.compile(r"""fetch\(\s*[`'"]\./data/([\w./-]+\.json)[`'"]""")

def load_validator(name: str) -> Draft202012Validator:
    schema = json.loads((SCHEMA_DIR / name).read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)

def _path(error) -> str:
    return "/".join(str(p) for p in error.absolute_path) or "(gốc)"

def validate_file(path: Path, validator: Draft202012Validator, data_dir: Path) -> list[str]:
    rel = path.relative_to(data_dir)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return [f"{rel}: JSON không hợp lệ ({e})"]
    errors = sorted(validator.iter_errors(data), key=lambda e: list(e.absolute_path))
    out = [f"{rel}: {_path(e)}: {e.message[:200]}" for e in errors[:MAX_ERRORS_PER_FILE]]
    if len(errors) > MAX_ERRORS_PER_FILE:
        out.append(f"{rel}: ... và {len(errors) - MAX_ERRORS_PER_FILE} lỗi khác")
    return out

def fetched_files(src_dir: Path) -> set[str]:
    """Tệp ./data/*.json được gọi cố định trong mã frontend (bỏ qua đường dẫn có biến)."""
    names: set[str] = set()
    for p in src_dir.rglob("*.ts*"):
        for m in FETCH_RE.finditer(p.read_text(encoding="utf-8")):
            if "${" not in m.group(1):
                names.add(m.group(1))
    return names

def cross_check(data_dir: Path) -> list[str]:
    def load(name):
        return json.loads((data_dir / name).read_text(encoding="utf-8"))

    errors = []
    try:
        summary = load("summary.json")
        pairs = [
            ("xsmb_latest.date", summary["xsmb_latest"]["date"], "xsmb_index.json", load("xsmb_index.json")["metadata"]["latest_date"]),
            ("vietlott_655_latest.id", summary["vietlott_655_latest"]["id"], "vietlott_655_index.json", load("vietlott_655_index.json")["metadata"]["latest_id"]),
            ("vietlott_645_latest.id", summary["vietlott_645_latest"]["id"], "vietlott_645_index.json", load("vietlott_645_index.json")["metadata"]["latest_id"]),
            ("xsmb_latest.date", summary["xsmb_latest"]["date"], "xsmb_recent_draws.json[0].date", load("xsmb_recent_draws.json")[0]["date"]),
        ]
    except (KeyError, IndexError, TypeError, json.JSONDecodeError, FileNotFoundError) as e:
        # Lỗi cấu trúc đã được báo ở bước schema
        return [f"bỏ qua kiểm tra chéo: {type(e).__name__}: {e}"]
    for left_name, left, right_name, right in pairs:
        if left != right:
            errors.append(f"kiểm tra chéo: summary.json {left_name}={left} nhưng {right_name}={right}")
    return errors

def validate(data_dir: Path, src_dir: Path | None = REPO_ROOT / "web" / "src") -> tuple[list[str], int]:
    errors: list[str] = []
    checked = 0
    for name, schema_name in FILE_SCHEMAS.items():
        path = data_dir / name
        if not path.exists():
            errors.append(f"{name}: thiếu tệp")
            continue
        errors += validate_file(path, load_validator(schema_name), data_dir)
        checked += 1

    for folder, (schema_name, expected) in HISTORY_SETS.items():
        validator = load_validator(schema_name)
        folder_path = data_dir / "history" / folder
        present = {p.stem for p in folder_path.glob("*.json")} if folder_path.exists() else set()
        missing = [n for n in expected if n not in present]
        if missing:
            errors.append(f"history/{folder}: thiếu {len(missing)} tệp ({', '.join(missing[:10])})")
        for n in expected:
            path = folder_path / f"{n}.json"
            if path.exists():
                errors += validate_file(path, validator, data_dir)
                checked += 1

    if src_dir is not None and src_dir.exists():
        for name in sorted(fetched_files(src_dir)):
            if not (data_dir / name).exists():
                errors.append(f"web/src gọi fetch ./data/{name} nhưng tệp không tồn tại")
            elif name not in FILE_SCHEMAS:
                errors.append(f"./data/{name} được frontend tải nhưng chưa có schema trong FILE_SCHEMAS")

    errors += [e for e in cross_check(data_dir) if not e.startswith("bỏ qua")]
    return errors, checked

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--data-dir", type=Path, default=REPO_ROOT / "web" / "public" / "data")
    args = parser.parse_args(argv)

    errors, checked = validate(args.data_dir)
    if errors:
        for e in errors:
            print(f"::error::schema: {e}")
        print(f"\nschema: {len(errors)} lỗi trong {args.data_dir}", file=sys.stderr)
        return 1
    print(f"schema: OK ({checked} tệp trong {args.data_dir})")
    return 0

if __name__ == "__main__":
    sys.exit(main())
