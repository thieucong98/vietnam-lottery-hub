"""Phân tích minh bạch: thống kê mô tả có khoảng tin cậy và kiểm định ngẫu nhiên.

Xuất web/public/data/stats_report.json cho màn hình "Phân tích minh bạch". Mọi con số
là mô tả dữ liệu lịch sử kèm cỡ mẫu; công thức nằm trong engine/analytics/stats.py.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Sequence

import numpy as np
import polars as pl
from loguru import logger

from engine.analytics import stats

SCHEMA_VERSION = 1

DISCLAIMER = (
    "Thống kê mô tả dữ liệu lịch sử. Mỗi kỳ quay là biến cố độc lập, nên các con số này "
    "không cho biết trước kết quả kỳ sau và không làm tăng xác suất trúng."
)

RECENT_WINDOW = 100


@dataclass(frozen=True)
class GameSpec:
    key: str
    name: str
    numbers: Sequence[int]  # các số có thể về
    k: int  # số lượt rút mỗi kỳ
    without_replacement: bool
    sum_bin_width: int
    gap_edges: Sequence[int]
    jackpot_odds: str | None

    @property
    def n_numbers(self) -> int:
        return len(self.numbers)

    @property
    def presence_q(self) -> float:
        if self.without_replacement:
            return stats.presence_probability_without_replacement(self.k, self.n_numbers)
        return stats.presence_probability_with_replacement(self.k, self.n_numbers)

    @property
    def slot_rate(self) -> float:
        """Tỷ lệ kỳ vọng dùng cho tần suất: theo kỳ (Vietlott) hoặc theo lượt giải (XSMB)."""
        return self.k / self.n_numbers if self.without_replacement else 1 / self.n_numbers


GAMES = {
    "vietlott_655": GameSpec("vietlott_655", "Power 6/55", range(1, 56), 6, True, 20, [0, 3, 6, 9, 12, 15, 20, 25, 30, 40, 60], "1/28.989.675"),
    "vietlott_645": GameSpec("vietlott_645", "Mega 6/45", range(1, 46), 6, True, 20, [0, 2, 4, 6, 8, 10, 14, 18, 25, 35, 50], "1/8.145.060"),
    "xsmb": GameSpec("xsmb", "XSMB (2 số cuối 27 giải)", range(0, 100), 27, False, 100, [0, 1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30], None),
}


def _r(x: float, nd: int = 4) -> float:
    return round(float(x), nd)


def _hist(values: Sequence[int], edges: Sequence[int]) -> list[int]:
    out = [0] * (len(edges) - 1)
    for v in values:
        for i in range(len(edges) - 1):
            if edges[i] <= v < edges[i + 1]:
                out[i] += 1
                break
    return out


def _bin_labels(edges: Sequence[int], open_end: bool) -> list[str]:
    labels = []
    for i in range(len(edges) - 1):
        lo, hi = edges[i], edges[i + 1] - 1
        if open_end and i == len(edges) - 2:
            labels.append(f"≥{lo}")
        elif lo == hi:
            labels.append(str(lo))
        else:
            labels.append(f"{lo}-{hi}")
    return labels


def _presence_matrix(draws: Sequence[Sequence[int]], spec: GameSpec) -> np.ndarray:
    """(kỳ, số) -> số lần xuất hiện."""
    index = {n: i for i, n in enumerate(spec.numbers)}
    mat = np.zeros((len(draws), spec.n_numbers), dtype=np.int16)
    for t, draw in enumerate(draws):
        for n in draw:
            if n in index:
                mat[t, index[n]] += 1
    return mat


def frequency_section(draws: Sequence[Sequence[int]], spec: GameSpec) -> dict:
    mat = _presence_matrix(draws, spec)
    n_draws = len(draws)
    counts = mat.sum(axis=0)
    trials = n_draws if spec.without_replacement else n_draws * spec.k
    p0 = spec.slot_rate
    rows = []
    outside = 0
    for i, n in enumerate(spec.numbers):
        hits = int(counts[i])
        lo, hi = stats.wilson_interval(hits, trials)
        if not lo <= p0 <= hi:
            outside += 1
        rows.append({"number": f"{n:02d}", "hits": hits, "rate": _r(hits / trials, 5), "ci_low": _r(lo, 5), "ci_high": _r(hi, 5)})
    chi = stats.chi_square_uniform(counts.tolist(), n_draws, spec.k, spec.without_replacement)
    return {
        "draws": n_draws,
        "trials": trials,
        "trial_unit": "kỳ" if spec.without_replacement else "lượt giải",
        "expected_rate": _r(p0, 5),
        "numbers": rows,
        "outside_ci": outside,
        "expected_outside_ci": _r(spec.n_numbers * 0.05, 2),
        "chi_square": chi.as_dict(),
    }


def gap_section(draws: Sequence[Sequence[int]], spec: GameSpec) -> dict:
    presence = _presence_matrix(draws, spec) > 0
    q = spec.presence_q
    all_gaps: list[int] = []
    per_number = []
    runs_below = 0
    for i, n in enumerate(spec.numbers):
        col = presence[:, i].tolist()
        gaps, current = stats.gaps_from_presence(col)
        all_gaps.extend(gaps)
        runs = stats.runs_test(col)
        if runs.p_value < 0.05:
            runs_below += 1
        per_number.append({
            "number": f"{n:02d}",
            "mean_gap": _r(np.mean(gaps), 2) if gaps else None,
            "max_gap": int(max(gaps)) if gaps else None,
            "current_gap": int(current),
            "prob_current_gap": _r(stats.prob_gap_at_least(current, q), 6),
            "runs_p": _r(runs.p_value, 4),
        })

    edges = list(spec.gap_edges) + [10**9]
    observed = _hist(all_gaps, edges)
    expected_probs = [stats.prob_gap_at_least(edges[i], q) - stats.prob_gap_at_least(edges[i + 1], q) for i in range(len(edges) - 1)]
    gof = stats.chi_square_goodness_of_fit(observed, expected_probs)

    longest = max(per_number, key=lambda r: r["current_gap"])
    g = longest["current_gap"]
    # Xác suất có ít nhất một số vắng >= g kỳ (xấp xỉ coi các số độc lập)
    prob_any = 1 - (1 - stats.prob_gap_at_least(g, q)) ** spec.n_numbers
    return {
        "presence_rate": _r(q, 5),
        "expected_mean_gap": _r(stats.expected_mean_gap(q), 2),
        "observed_mean_gap": _r(np.mean(all_gaps), 2) if all_gaps else None,
        "gap_count": len(all_gaps),
        "histogram": {
            "labels": _bin_labels(edges, open_end=True),
            "observed": observed,
            "expected": [_r(p * len(all_gaps), 1) for p in expected_probs],
        },
        "chi_square": gof.as_dict(),
        "numbers": per_number,
        "longest_current": {"number": longest["number"], "gap": g, "prob_any_number": _r(prob_any, 4)},
        "runs_per_number": {
            "tested": spec.n_numbers,
            "below_0_05": runs_below,
            "expected_below_0_05": _r(spec.n_numbers * 0.05, 2),
        },
    }


def sum_section(draws: Sequence[Sequence[int]], spec: GameSpec) -> dict:
    sums = [int(sum(d)) for d in draws]
    if spec.without_replacement:
        dist = stats.sum_distribution_without_replacement(spec.k, spec.n_numbers)
        mean, var = stats.sum_mean_var_without_replacement(spec.k, spec.n_numbers)
    else:
        dist = stats.sum_distribution_with_replacement(spec.k, list(spec.numbers))
        m = (min(spec.numbers) + max(spec.numbers)) / 2
        mean = spec.k * m
        var = spec.k * (spec.n_numbers**2 - 1) / 12
    lo_val, hi_val = min(dist), max(dist)
    w = spec.sum_bin_width
    start = lo_val - lo_val % w
    edges = list(range(start, hi_val + w + 1, w))
    observed = _hist(sums, edges)
    probs = stats.bin_distribution(dist, edges)
    gof = stats.chi_square_goodness_of_fit(observed, probs)

    n = len(sums)
    obs_mean = float(np.mean(sums))
    se = (var / n) ** 0.5
    # Runs test trên dãy "tổng lớn hơn kỳ vọng hay không" (bỏ các kỳ bằng đúng kỳ vọng)
    runs = stats.runs_test([s > mean for s in sums if s != mean])
    # Cắt bớt hai đuôi không có kỳ quay nào và xác suất rất nhỏ cho biểu đồ gọn
    keep = [i for i in range(len(observed)) if observed[i] > 0 or probs[i] * n >= 0.5]
    a, b = (keep[0], keep[-1]) if keep else (0, len(observed) - 1)
    return {
        "draws": n,
        "expected_mean": _r(mean, 2),
        "observed_mean": _r(obs_mean, 2),
        "mean_ci_low": _r(obs_mean - stats.Z_95 * se, 2),
        "mean_ci_high": _r(obs_mean + stats.Z_95 * se, 2),
        "histogram": {
            "labels": _bin_labels(edges, open_end=False)[a:b + 1],
            "observed": observed[a:b + 1],
            "expected": [_r(p * n, 1) for p in probs[a:b + 1]],
        },
        "chi_square": gof.as_dict(),
        "runs_test": runs.as_dict(),
    }


def parity_section(draws: Sequence[Sequence[int]], spec: GameSpec) -> dict:
    evens = [sum(1 for x in d if x % 2 == 0) for d in draws]
    if spec.without_replacement:
        dist = stats.even_count_distribution_without_replacement(spec.k, spec.n_numbers)
    else:
        dist = stats.even_count_distribution_with_replacement(spec.k)
    n = len(evens)
    values = list(range(spec.k + 1))
    observed = [evens.count(v) for v in values]
    probs = [dist.get(v, 0.0) for v in values]
    gof = stats.chi_square_goodness_of_fit(observed, probs)
    keep = [v for v in values if observed[v] > 0 or probs[v] * n >= 0.5]
    a, b = keep[0], keep[-1]
    expected_even_share = sum(v * p for v, p in dist.items()) / spec.k
    total_even = sum(evens)
    lo, hi = stats.wilson_interval(total_even, n * spec.k)
    return {
        "draws": n,
        "histogram": {
            "labels": [f"{v} chẵn" for v in values[a:b + 1]],
            "observed": observed[a:b + 1],
            "expected": [_r(p * n, 1) for p in probs[a:b + 1]],
        },
        "even_share": _r(total_even / (n * spec.k), 4),
        "even_share_ci_low": _r(lo, 4),
        "even_share_ci_high": _r(hi, 4),
        "expected_even_share": _r(expected_even_share, 4),
        "chi_square": gof.as_dict(),
    }


def analyze_game(draws: Sequence[Sequence[int]], dates: Sequence[str], spec: GameSpec) -> dict:
    if len(draws) < 30:
        raise ValueError(f"{spec.name}: cần ít nhất 30 kỳ để phân tích")
    recent = draws[-RECENT_WINDOW:]
    return {
        "name": spec.name,
        "numbers_range": [f"{min(spec.numbers):02d}", f"{max(spec.numbers):02d}"],
        "draw_size": spec.k,
        "model": "không hoàn lại" if spec.without_replacement else "có hoàn lại",
        "jackpot_odds": spec.jackpot_odds,
        "sample": {"draws": len(draws), "from": dates[0], "to": dates[-1]},
        "frequency": frequency_section(draws, spec),
        "frequency_recent": {**frequency_section(recent, spec), "from": dates[-len(recent)]},
        "gaps": gap_section(draws, spec),
        "sums": sum_section(draws, spec),
        "parity": parity_section(draws, spec),
    }


class TransparencyAnalyzer:
    def __init__(self, data_dir_xsmb: Path = Path("data/xsmb"), data_dir_vietlott: Path = Path("data/vietlott"), output_path: Path = Path("web/public/data/stats_report.json")):
        self.data_dir_xsmb = Path(data_dir_xsmb)
        self.data_dir_vietlott = Path(data_dir_vietlott)
        self.output_path = Path(output_path)

    def load_vietlott(self, file_name: str) -> tuple[list[list[int]], list[str]]:
        df = pl.read_ndjson(self.data_dir_vietlott / file_name).sort(["date", "id"])
        return [r[:6] for r in df["result"].to_list()], df["date"].to_list()

    def load_xsmb(self) -> tuple[list[list[int]], list[str]]:
        df = pl.read_parquet(self.data_dir_xsmb / "xsmb-2-digits.parquet").sort("date")
        prize_cols = [c for c in df.columns if c != "date"]
        return [list(r) for r in df.select(prize_cols).iter_rows()], df["date"].to_list()

    def analyze(self) -> dict:
        games = {}
        sources = {
            "vietlott_655": lambda: self.load_vietlott("power655.jsonl"),
            "vietlott_645": lambda: self.load_vietlott("power645.jsonl"),
            "xsmb": self.load_xsmb,
        }
        for key, load in sources.items():
            draws, dates = load()
            games[key] = analyze_game(draws, dates, GAMES[key])
            logger.info(f"Phân tích minh bạch {GAMES[key].name}: {len(draws)} kỳ")

        result = {
            "schema_version": SCHEMA_VERSION,
            "generated_at": datetime.now().isoformat(timespec="seconds"),
            "disclaimer": DISCLAIMER,
            "recent_window": RECENT_WINDOW,
            "games": games,
        }
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, separators=(",", ":"))
        logger.info(f"Đã xuất phân tích minh bạch vào {self.output_path}")
        return result


if __name__ == "__main__":
    TransparencyAnalyzer().analyze()
