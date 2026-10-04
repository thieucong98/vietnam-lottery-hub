from collections import Counter
from typing import List
import numpy as np

from engine.ml.strategies.base import BaseStrategy

class FrequencyStrategy(BaseStrategy):
    """Chiến lược Tần suất: Chọn các số xuất hiện nhiều nhất trong N kỳ gần nhất."""

    def __init__(self, window: int = 50):
        super().__init__(name=f"Frequency (N={window})")
        self.window = window

    def predict(self, history: List[List[int]], k: int = 6, max_number: int = 55) -> List[int]:
        recent_draws = history[-self.window:] if len(history) >= self.window else history
        counts = Counter()
        for draw in recent_draws:
            for num in draw:
                if 1 <= num <= max_number:
                    counts[num] += 1
        most_common = [num for num, _ in counts.most_common(k)]
        if len(most_common) < k:
            all_nums = set(range(1, max_number + 1))
            missing = list(all_nums - set(most_common))
            most_common.extend(missing[: k - len(most_common)])
        return sorted(most_common)

class LongAbsenceStrategy(BaseStrategy):
    """Chiến lược Cầu Gan: Chọn các số có thời gian vắng mặt lâu nhất (lô gan)."""

    def __init__(self):
        super().__init__(name="Long Absence (Lô Gan)")

    def predict(self, history: List[List[int]], k: int = 6, max_number: int = 55) -> List[int]:
        last_seen = {num: -1 for num in range(1, max_number + 1)}
        for idx, draw in enumerate(history):
            for num in draw:
                if 1 <= num <= max_number:
                    last_seen[num] = idx

        total_draws = len(history)
        gaps = {num: total_draws - last_seen[num] for num in range(1, max_number + 1)}
        sorted_by_gap = sorted(gaps.items(), key=lambda x: x[1], reverse=True)
        return sorted([num for num, _ in sorted_by_gap[:k]])

class ExponentialDecayStrategy(BaseStrategy):
    """Chiến lược Suy giảm số mũ: Trọng số giảm dần theo thời gian lùi về quá khứ."""

    def __init__(self, decay_rate: float = 0.97):
        super().__init__(name=f"Exponential Decay (\u03bb={decay_rate})")
        self.decay_rate = decay_rate

    def predict(self, history: List[List[int]], k: int = 6, max_number: int = 55) -> List[int]:
        scores = np.zeros(max_number + 1, dtype=float)
        total_draws = len(history)
        for idx, draw in enumerate(history):
            weight = self.decay_rate ** (total_draws - 1 - idx)
            for num in draw:
                if 1 <= num <= max_number:
                    scores[num] += weight
        ranked = np.argsort(scores[1:])[::-1] + 1
        return sorted(list(ranked[:k]))

class MarkovChainStrategy(BaseStrategy):
    """Chiến lược Chuỗi Markov: Xác suất chuyển dịch trạng thái từ kỳ trước sang kỳ này."""

    def __init__(self):
        super().__init__(name="Markov Chain (Bậc 1)")

    def predict(self, history: List[List[int]], k: int = 6, max_number: int = 55) -> List[int]:
        if len(history) < 2:
            return sorted(list(range(1, k + 1)))

        transition = np.zeros((max_number + 1, max_number + 1), dtype=float)
        for t in range(len(history) - 1):
            prev_draw = history[t]
            curr_draw = history[t + 1]
            for p in prev_draw:
                if 1 <= p <= max_number:
                    for c in curr_draw:
                        if 1 <= c <= max_number:
                            transition[p, c] += 1

        last_draw = history[-1]
        next_scores = np.zeros(max_number + 1, dtype=float)
        for p in last_draw:
            if 1 <= p <= max_number:
                next_scores += transition[p]

        ranked = np.argsort(next_scores[1:])[::-1] + 1
        return sorted(list(ranked[:k]))

class RandomStrategy(BaseStrategy):
    """Chiến lược Ngẫu nhiên (Baseline kiểm chứng)."""

    def __init__(self):
        super().__init__(name="Random Baseline")

    def predict(self, history: List[List[int]], k: int = 6, max_number: int = 55) -> List[int]:
        nums = list(range(1, max_number + 1))
        np.random.shuffle(nums)
        return sorted(nums[:k])
