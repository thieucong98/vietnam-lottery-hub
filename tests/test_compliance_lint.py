import importlib.util
import sys
from pathlib import Path

import pytest

_spec = importlib.util.spec_from_file_location(
    "compliance_lint", Path(__file__).resolve().parent.parent / "scripts" / "compliance_lint.py"
)
compliance_lint = importlib.util.module_from_spec(_spec)
# dataclasses cần module có trong sys.modules khi nạp từ đường dẫn file
sys.modules["compliance_lint"] = compliance_lint
_spec.loader.exec_module(compliance_lint)


def _rules(text: str) -> list[str]:
    return [v.rule for v in compliance_lint.scan_text(text, Path("x.tsx"))]


@pytest.mark.parametrize(
    "text",
    [
        "Grid 4 Chiến lược Dự đoán",
        "predicted_numbers",
        "Những số có xác suất nổ cao nhất ngày kế tiếp",
        "Soi cầu đẹp hôm nay",
        "Bạch Thủ (1 Số)",
        "Song Thủ (Cặp Lộn)",
        "Dàn 10 Số",
        "CHÚC MỪNG TRÚNG XIÊN 2 XSMB",
        "số lần trúng Đề",
        "Đề: 53",
        "Lô nổ nhiều nháy",
        "Mô Phỏng Nuôi Bộ Số",
        "Tính ROI",
        "Backtest PnL",
        "Lợi nhuận ròng",
        "chắc chắn trúng",
    ],
)
def test_lint_flags_banned_terms(text):
    assert _rules(text), f"Phải phát hiện từ khóa cấm trong: {text!r}"


@pytest.mark.parametrize(
    "text",
    [
        "Chỉ dành cho người từ đủ 18 tuổi",
        "Dự án mã nguồn mở phi lợi nhuận",
        "Đề xuất cải tiến và vấn đề hiệu năng",
        "Nghiêm cấm sử dụng dữ liệu vào hành vi lô đề, cờ bạc bất hợp pháp",
        "Lô đề ngầm là bất hợp pháp theo Điều 321 Bộ luật Hình sự",
        "Bộ số mẫu theo thuật toán Markov (chỉ minh họa)",
        "Cặp số cùng xuất hiện (thống kê)",
        "Giải Đặc Biệt",
        "Thống kê lô gan và lô tô 27 giải",
    ],
)
def test_lint_allows_neutral_and_prohibition_text(text):
    assert _rules(text) == []


def test_lint_default_scope_is_clean():
    targets = [compliance_lint.REPO_ROOT / t for t in compliance_lint.DEFAULT_TARGETS]
    violations = compliance_lint.lint(targets)
    assert violations == [], "\n".join(f"{v.path}:{v.line} [{v.rule}] {v.excerpt}" for v in violations)
