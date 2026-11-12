from typing import Any, Dict, List, Optional
import numpy as np

from engine.analytics import stats
from engine.ml.strategies.all_strategies import (
    BaseStrategy,
    ExponentialDecayStrategy,
    FrequencyStrategy,
    LongAbsenceStrategy,
    MarkovChainStrategy,
)

class BacktestEngine:
    """Đo số trùng khớp của các thuật toán chọn số mẫu trên dữ liệu lịch sử, so với chọn ngẫu nhiên.

    Với mỗi kỳ kiểm thử t, thuật toán chỉ thấy các kỳ trước t (walk-forward). Mức ngẫu nhiên
    là `simulations` lần chọn ngẫu nhiên k số cho từng kỳ kiểm thử; p-value là tỷ lệ lần chọn
    ngẫu nhiên có tổng số trùng lớn hơn hoặc bằng thuật toán.
    """

    def __init__(self, strategies: Optional[List[BaseStrategy]] = None):
        self.strategies = strategies or [
            FrequencyStrategy(window=30),
            FrequencyStrategy(window=100),
            ExponentialDecayStrategy(decay_rate=0.97),
            MarkovChainStrategy(),
            LongAbsenceStrategy(),
        ]

    def evaluate(
        self,
        draws: List[List[int]],
        test_draws: int = 50,
        k: int = 6,
        max_number: int = 55,
        simulations: int = 1000,
        seed: int = 0,
    ) -> Dict[str, Any]:
        """Chạy backtest trên `test_draws` kỳ gần nhất và so với `simulations` lần chọn ngẫu nhiên."""
        if len(draws) <= test_draws:
            raise ValueError("Số lượng kỳ quay không đủ để chạy backtest")

        train_cutoff = len(draws) - test_draws
        test_set = [draws[t][:k] for t in range(train_cutoff, len(draws))]

        rng = np.random.default_rng(seed)
        random_totals = stats.random_pick_totals(test_set, k, max_number, simulations, rng)
        random_avgs = random_totals / test_draws

        rows = []
        for strat in self.strategies:
            match_counts = []
            for t in range(train_cutoff, len(draws)):
                picks = strat.pick(draws[:t], k=k, max_number=max_number)
                match_counts.append(len(set(draws[t][:k]) & set(picks)))

            total = int(sum(match_counts))
            rows.append({
                "strategy_name": strat.name,
                "average_matches": round(total / test_draws, 3),
                "total_matches": total,
                "max_match_in_one_draw": int(max(match_counts)),
                "hit_rate_at_least_3": round(sum(1 for c in match_counts if c >= 3) / test_draws, 4),
                "hit_rate_at_least_4": round(sum(1 for c in match_counts if c >= 4) / test_draws, 4),
                "p_value": round(stats.monte_carlo_p_value(total, random_totals), 4),
            })

        rows.sort(key=lambda x: x["average_matches"], reverse=True)

        # Biểu đồ phân bố trung bình số trùng của các lần chọn ngẫu nhiên
        lo_t, hi_t = int(random_totals.min()), int(random_totals.max())
        totals_hist = np.bincount(random_totals - lo_t, minlength=hi_t - lo_t + 1)

        return {
            "test_draws": test_draws,
            "simulations": simulations,
            "expected_average": round(stats.expected_matches(k, max_number), 4),
            "random": {
                "mean_average": round(float(random_avgs.mean()), 4),
                "low_95": round(float(np.percentile(random_avgs, 2.5)), 4),
                "high_95": round(float(np.percentile(random_avgs, 97.5)), 4),
                "histogram": {
                    "average_matches": [round((lo_t + i) / test_draws, 4) for i in range(len(totals_hist))],
                    "counts": [int(c) for c in totals_hist],
                },
            },
            "strategies": rows,
        }
