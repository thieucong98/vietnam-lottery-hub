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

def generate_ml_insights(data_dir: Path = Path("data/vietlott"), out_dir: Path = Path("web/public/data")):
    """Tạo dự đoán và báo cáo Backtest cho Power 6/55 và Mega 6/45."""
    filepath = data_dir / "power655.jsonl"
    if not filepath.exists():
        return

    df = pl.read_ndjson(filepath).sort(["date", "id"])
    draws = [r[:6] for r in df["result"].to_list()]

    # 1. Chạy Backtest trên 50 kỳ gần nhất
    engine = BacktestEngine()
    backtest_report = engine.evaluate(draws, test_draws=50, k=6, max_number=55)

    # 2. Sinh các bộ số dự đoán cho kỳ tiếp theo
    strategies = [
        ("Tần suất cao (Hot Numbers)", FrequencyStrategy(window=50)),
        ("Cầu gan (Cold Numbers)", LongAbsenceStrategy()),
        ("Suy giảm số mũ (Exponential)", ExponentialDecayStrategy(decay_rate=0.97)),
        ("Chuỗi Markov (Markov Chain)", MarkovChainStrategy()),
    ]
    predictions = []
    for label, strat in strategies:
        pred = strat.predict(draws, k=6, max_number=55)
        predictions.append({
            "name": label,
            "predicted_numbers": [f"{n:02d}" for n in pred],
            "description": f"Dự đoán dựa trên thuật toán {strat.name}"
        })

    payload = {
        "product": "Power 6/55",
        "latest_id": df["id"].to_list()[-1],
        "latest_date": df["date"].to_list()[-1],
        "predictions": predictions,
        "backtest_report": backtest_report,
    }

    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "ml_insights.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    logger.info(f"Đã xuất thông tin AI & Backtest vào {out_file}")

if __name__ == "__main__":
    generate_ml_insights()
