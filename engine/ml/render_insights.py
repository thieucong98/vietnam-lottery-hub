import json
from pathlib import Path
from loguru import logger
import polars as pl

from engine.ml.backtest import BacktestEngine
from engine.ml.strategies.all_strategies import (
    ExponentialDecayStrategy,
    FrequencyStrategy,
    LongAbsenceStrategy,
    MarkovChainStrategy,
)

# Phiên bản schema của ml_insights.json. v2: đổi tên khóa bộ số của v1 thành
# "sample_sets"/"sample_picks" (chỉ minh họa) và thêm "disclaimer", "jackpot_odds".
# v3: "backtest_report" thay bằng "backtests" (so với 1.000 lần chọn ngẫu nhiên, có p-value).
SCHEMA_VERSION = 3

SAMPLE_DISCLAIMER = (
    "Bộ số mẫu chỉ minh họa cách thuật toán hoạt động trên dữ liệu lịch sử. "
    "Mỗi kỳ quay là biến cố độc lập, nên các bộ số này không làm tăng xác suất trúng."
)

# Số kỳ kiểm thử: 50 kỳ gần nhất và một khoảng dài hơn để kiểm định có nhiều dữ liệu hơn
BACKTEST_HORIZONS = (50, 300)
BACKTEST_SIMULATIONS = 1000


def generate_ml_insights(data_dir: Path = Path("data/vietlott"), out_dir: Path = Path("web/public/data")):
    """Tạo bộ số mẫu theo thuật toán (chỉ minh họa) và báo cáo Backtest cho Power 6/55."""
    filepath = data_dir / "power655.jsonl"
    if not filepath.exists():
        return

    df = pl.read_ndjson(filepath).sort(["date", "id"])
    draws = [r[:6] for r in df["result"].to_list()]

    # 1. Backtest walk-forward, so với 1.000 lần chọn ngẫu nhiên (seed cố định để kết quả ổn định giữa các lần chạy)
    engine = BacktestEngine()
    backtests = [
        engine.evaluate(draws, test_draws=h, k=6, max_number=55, simulations=BACKTEST_SIMULATIONS, seed=h)
        for h in BACKTEST_HORIZONS
        if len(draws) > h
    ]

    # 2. Sinh các bộ số mẫu theo từng thuật toán (chỉ minh họa)
    strategies = [
        ("Tần suất cao (Hot Numbers)", FrequencyStrategy(window=50)),
        ("Số lâu chưa về (Cold Numbers)", LongAbsenceStrategy()),
        ("Suy giảm số mũ (Exponential)", ExponentialDecayStrategy(decay_rate=0.97)),
        ("Chuỗi Markov (Markov Chain)", MarkovChainStrategy()),
    ]
    sample_sets = []
    for label, strat in strategies:
        picks = strat.pick(draws, k=6, max_number=55)
        sample_sets.append({
            "name": label,
            "sample_picks": [f"{n:02d}" for n in picks],
            "description": f"Bộ số mẫu theo thuật toán {strat.name} (chỉ minh họa)",
        })

    payload = {
        "schema_version": SCHEMA_VERSION,
        "product": "Power 6/55",
        "latest_id": df["id"].to_list()[-1],
        "latest_date": df["date"].to_list()[-1],
        "disclaimer": SAMPLE_DISCLAIMER,
        "jackpot_odds": "1/28.989.675",
        "sample_sets": sample_sets,
        "backtests": backtests,
    }

    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "ml_insights.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    logger.info(f"Đã xuất bộ số mẫu & Backtest vào {out_file}")

if __name__ == "__main__":
    generate_ml_insights()
