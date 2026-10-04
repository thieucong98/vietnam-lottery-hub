from typing import Any, Dict, List
from loguru import logger
import numpy as np

from engine.ml.strategies.all_strategies import (
    BaseStrategy,
    ExponentialDecayStrategy,
    FrequencyStrategy,
    LongAbsenceStrategy,
    MarkovChainStrategy,
    RandomStrategy,
)

class BacktestEngine:
    """Kiểm thử hiệu suất các chiến lược dự đoán trên dữ liệu lịch sử thực tế."""

    def __init__(self, strategies: List[BaseStrategy] = None):
        self.strategies = strategies or [
            FrequencyStrategy(window=30),
            FrequencyStrategy(window=100),
            ExponentialDecayStrategy(decay_rate=0.97),
            MarkovChainStrategy(),
            LongAbsenceStrategy(),
            RandomStrategy(),
        ]

    def evaluate(self, draws: List[List[int]], test_draws: int = 50, k: int = 6, max_number: int = 55) -> List[Dict[str, Any]]:
        """Chạy backtest kiểm định trên N kỳ gần nhất."""
        if len(draws) <= test_draws:
            raise ValueError("Số lượng kỳ quay không đủ để chạy backtest")

        train_cutoff = len(draws) - test_draws
        results = []

        for strat in self.strategies:
            match_counts = []
            hits_at_least_3 = 0
            hits_at_least_4 = 0

            for t in range(train_cutoff, len(draws)):
                hist_up_to_t = draws[:t]
                actual_draw = set(draws[t][:k])

                pred = strat.predict(hist_up_to_t, k=k, max_number=max_number)
                pred_set = set(pred)

                common = len(actual_draw.intersection(pred_set))
                match_counts.append(common)
                if common >= 3:
                    hits_at_least_3 += 1
                if common >= 4:
                    hits_at_least_4 += 1

            avg_matches = float(np.mean(match_counts))
            results.append({
                "strategy_name": strat.name,
                "test_draws": test_draws,
                "average_matches": round(avg_matches, 2),
                "max_match_in_one_draw": int(max(match_counts)),
                "hit_rate_at_least_3": f"{round((hits_at_least_3 / test_draws) * 100, 1)}%",
                "hit_rate_at_least_4": f"{round((hits_at_least_4 / test_draws) * 100, 1)}%",
            })

        results.sort(key=lambda x: x["average_matches"], reverse=True)
        return results
