"""Compliance lint: chặn thuật ngữ lô đề, "dự đoán" và khung "đầu tư" quay lại mã nguồn.

Quét web/src, web/index.html, engine, scripts, README.md và JSON xuất ra trong
web/public/data (hoặc các đường dẫn truyền vào, ví dụ web/dist sau khi build).
Thoát với mã 1 nếu gặp từ khóa cấm. Chỉ dùng thư viện chuẩn để chạy được trong CI
mà không cần cài dependency.

Cách dùng:
    python scripts/compliance_lint.py            # quét phạm vi mặc định
    python scripts/compliance_lint.py web/dist   # quét thư mục build
"""

from __future__ import annotations

import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

DEFAULT_TARGETS = [
    "web/src",
    "web/index.html",
    "engine",
    "scripts",
    "README.md",
    "web/public/data",
]

SCANNED_SUFFIXES = {".py", ".ts", ".tsx", ".js", ".jsx", ".html", ".md", ".json", ".css"}

# Chính file này chứa danh sách từ khóa nên không tự quét
EXCLUDED_FILES = {Path(__file__).resolve()}

# Từ chỉ được xuất hiện khi đang nói rằng hành vi đó bị cấm (tuyên bố pháp lý)
PROHIBITION_CONTEXT = re.compile(
    r"bất hợp pháp|trái phép|trái pháp luật|nghiêm cấm|cấm|vi phạm|phản đối|bài trừ|tệ nạn|ngầm|"
    r"điều 321|điều 322|144/2021",
    re.IGNORECASE,
)
CONTEXT_WINDOW = 160


@dataclass(frozen=True)
class Rule:
    name: str
    pattern: re.Pattern[str]
    # Cho phép nếu xung quanh có ngữ cảnh "nghiêm cấm / bất hợp pháp"
    allow_in_prohibition_context: bool = False
    # Các cụm từ hợp lệ chứa từ khóa (ví dụ "vấn đề", "phi lợi nhuận")
    allowed_phrases: tuple[str, ...] = ()


def _p(regex: str) -> re.Pattern[str]:
    # Ranh giới từ cho tiếng Việt: không đứng sát chữ/số khác (kể cả chữ có dấu)
    return re.compile(rf"(?<![\w])(?:{regex})(?![\w])", re.IGNORECASE)


RULES: list[Rule] = [
    Rule("dự đoán", _p(r"dự\s+đoán|du\s+doan")),
    Rule("dự báo", _p(r"dự\s+báo")),
    Rule("predict", re.compile(r"predict", re.IGNORECASE)),
    Rule("chắc chắn", _p(r"chắc\s+chắn")),
    Rule("xác suất nổ", _p(r"xác\s+suất\s+nổ")),
    Rule("cầu lô (cầu đẹp/soi cầu/cầu gan...)", _p(r"cầu\s+(?:đẹp|lô|gan|nóng|kèo)|soi\s+cầu|bắt\s+cầu")),
    Rule("bạch thủ", _p(r"bạch\s+thủ|bach_?thu")),
    Rule("song thủ", _p(r"song\s+thủ|song_?thu")),
    Rule("dàn", _p(r"dàn|dan_\d+")),
    Rule("xiên", _p(r"xiên|xien\w*"), allow_in_prohibition_context=True),
    Rule(
        "đề",
        _p(r"đề"),
        allow_in_prohibition_context=True,
        allowed_phrases=(
            "vấn đề", "chủ đề", "tiêu đề", "đề xuất", "đề cập", "đề nghị", "đề án",
            "đề ra", "đề phòng", "đề tài", "đề cao", "đề mục",
        ),
    ),
    Rule("nổ (tiếng lóng)", _p(r"nổ")),
    Rule("nháy (tiếng lóng)", _p(r"nháy")),
    Rule("nuôi (vé/lô)", _p(r"nuôi")),
    Rule("ROI", re.compile(r"(?<![A-Za-z])ROI(?![A-Za-z])")),
    Rule("PnL", re.compile(r"(?<![A-Za-z])PnL(?![A-Za-z])", re.IGNORECASE)),
    Rule("lợi nhuận", _p(r"lợi\s+nhuận"), allowed_phrases=("phi lợi nhuận",)),
]


@dataclass(frozen=True)
class Violation:
    path: Path
    line: int
    rule: str
    excerpt: str


def _is_allowed(rule: Rule, text: str, start: int, end: int) -> bool:
    lowered = text.lower()
    for phrase in rule.allowed_phrases:
        # Cụm từ hợp lệ phải bao trọn vị trí khớp
        lo = max(0, end - len(phrase))
        for idx in range(lo, start + 1):
            if lowered.startswith(phrase, idx):
                return True
    if rule.allow_in_prohibition_context:
        window = text[max(0, start - CONTEXT_WINDOW): end + CONTEXT_WINDOW]
        if PROHIBITION_CONTEXT.search(window):
            return True
    return False


def scan_text(text: str, path: Path) -> list[Violation]:
    text = unicodedata.normalize("NFC", text)
    violations: list[Violation] = []
    for rule in RULES:
        for match in rule.pattern.finditer(text):
            if _is_allowed(rule, text, match.start(), match.end()):
                continue
            line = text.count("\n", 0, match.start()) + 1
            excerpt = text[max(0, match.start() - 40): match.end() + 40].replace("\n", " ").strip()
            violations.append(Violation(path, line, rule.name, excerpt))
    return violations


def iter_files(targets: list[Path]):
    for target in targets:
        if target.is_file():
            candidates = [target]
        elif target.is_dir():
            candidates = sorted(p for p in target.rglob("*") if p.is_file())
        else:
            continue
        for path in candidates:
            if path.suffix.lower() not in SCANNED_SUFFIXES:
                continue
            if path.resolve() in EXCLUDED_FILES:
                continue
            if any(part in {"node_modules", "__pycache__", ".venv"} for part in path.parts):
                continue
            yield path


def lint(targets: list[Path]) -> list[Violation]:
    violations: list[Violation] = []
    for path in iter_files(targets):
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        violations.extend(scan_text(text, path))
    return violations


def main(argv: list[str]) -> int:
    raw_targets = argv or DEFAULT_TARGETS
    targets = [(REPO_ROOT / t) if not Path(t).is_absolute() else Path(t) for t in raw_targets]
    missing = [str(t) for t in targets if not t.exists()]
    if argv and missing:
        print(f"compliance lint: không tìm thấy đường dẫn: {', '.join(missing)}", file=sys.stderr)
        return 2

    violations = lint(targets)
    if not violations:
        scanned = sum(1 for _ in iter_files(targets))
        print(f"compliance lint: OK ({scanned} tệp, không có từ khóa cấm)")
        return 0

    for v in violations:
        try:
            shown = v.path.relative_to(REPO_ROOT)
        except ValueError:
            shown = v.path
        print(f"{shown}:{v.line}: [{v.rule}] ...{v.excerpt}...")
    print(f"\ncompliance lint: {len(violations)} vi phạm. Xem nguyên tắc tuân thủ trong LEGAL_DISCLAIMER.md.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
