"""Công thức thống kê mô tả và kiểm định ngẫu nhiên (hàm thuần, có test trong tests/test_stats.py).

Hai mô hình quay được dùng trong dự án:
- Vietlott 6/55, 6/45: mỗi kỳ rút k số khác nhau từ 1..N (không hoàn lại).
- XSMB: 27 giải, 2 số cuối mỗi giải là một số 00-99 độc lập (có hoàn lại).

Mọi kết quả ở đây chỉ mô tả dữ liệu lịch sử. Các kỳ quay độc lập, nên không hàm nào
cho biết trước kết quả kỳ sau.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Iterable, Sequence

import numpy as np
from scipy import stats as sps

Z_95 = 1.959963984540054


# ---------- Khoảng tin cậy ----------

def wilson_interval(hits: int, n: int, z: float = Z_95) -> tuple[float, float]:
    """Khoảng tin cậy Wilson cho tỷ lệ hits/n (mặc định 95%). n = 0 trả (0, 1)."""
    if n <= 0:
        return 0.0, 1.0
    if hits < 0 or hits > n:
        raise ValueError("hits phải nằm trong [0, n]")
    p = hits / n
    z2 = z * z
    denom = 1 + z2 / n
    center = (p + z2 / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / denom
    # Hai đầu mút đúng bằng 0 và 1 khi hits = 0 hoặc hits = n (tránh sai số dấu phẩy động)
    lo = 0.0 if hits == 0 else max(0.0, center - half)
    hi = 1.0 if hits == n else min(1.0, center + half)
    return lo, hi


def binomial_two_sided_p(hits: int, n: int, p0: float) -> float:
    """p-value hai phía của kiểm định nhị thức chính xác H0: tỷ lệ = p0."""
    if n <= 0:
        return 1.0
    return float(sps.binomtest(hits, n, p0, alternative="two-sided").pvalue)


# ---------- Xác suất lý thuyết ----------

def presence_probability_without_replacement(k: int, n_numbers: int) -> float:
    """Xác suất một số cụ thể có trong kỳ quay rút k số khác nhau từ n_numbers số."""
    return k / n_numbers


def presence_probability_with_replacement(slots: int, n_numbers: int) -> float:
    """Xác suất một số cụ thể xuất hiện ít nhất 1 lần trong `slots` lượt rút độc lập (XSMB: 27 giải, 100 số)."""
    return 1 - (1 - 1 / n_numbers) ** slots


def expected_matches(k: int, n_numbers: int, picks: int | None = None) -> float:
    """Số trùng kỳ vọng giữa bộ `picks` số chọn ngẫu nhiên và k số được quay (siêu bội): picks*k/N."""
    picks = k if picks is None else picks
    return picks * k / n_numbers


def geometric_gap_pmf(gap: int, q: float) -> float:
    """P(số vắng đúng `gap` kỳ liên tiếp rồi mới về), với q = xác suất có mặt mỗi kỳ."""
    return (1 - q) ** gap * q


def expected_mean_gap(q: float) -> float:
    """Khoảng cách trung bình kỳ vọng (số kỳ vắng giữa hai lần về) = (1 - q) / q."""
    return (1 - q) / q


def prob_gap_at_least(gap: int, q: float) -> float:
    """P(một số cụ thể vắng ít nhất `gap` kỳ liên tiếp) = (1 - q)^gap."""
    return (1 - q) ** gap


def sum_distribution_without_replacement(k: int, n_numbers: int) -> dict[int, float]:
    """Phân bố chính xác của tổng k số khác nhau chọn đều từ 1..n_numbers (quy hoạch động)."""
    max_sum = sum(range(n_numbers - k + 1, n_numbers + 1))
    # ways[j][s] = số tập j phần tử có tổng s
    ways = np.zeros((k + 1, max_sum + 1), dtype=object)
    ways[0][0] = 1
    for x in range(1, n_numbers + 1):
        for j in range(min(k, x), 0, -1):
            ways[j][x:] = ways[j][x:] + ways[j - 1][: max_sum + 1 - x]
    total = math.comb(n_numbers, k)
    return {s: int(ways[k][s]) / total for s in range(max_sum + 1) if ways[k][s]}


def sum_distribution_with_replacement(slots: int, values: Sequence[int]) -> dict[int, float]:
    """Phân bố chính xác của tổng `slots` giá trị độc lập chọn đều trong `values` (tích chập)."""
    base = np.zeros(max(values) + 1)
    for v in values:
        base[v] += 1 / len(values)
    dist = np.array([1.0])
    for _ in range(slots):
        dist = np.convolve(dist, base)
    return {s: float(p) for s, p in enumerate(dist) if p > 0}


def sum_mean_var_without_replacement(k: int, n_numbers: int) -> tuple[float, float]:
    """Kỳ vọng và phương sai của tổng k số khác nhau từ 1..N."""
    mean = k * (n_numbers + 1) / 2
    var = k * (n_numbers - k) * (n_numbers + 1) / 12
    return mean, var


def even_count_distribution_without_replacement(k: int, n_numbers: int) -> dict[int, float]:
    """Phân bố số lượng số chẵn trong k số khác nhau từ 1..N (siêu bội)."""
    evens = n_numbers // 2
    odds = n_numbers - evens
    total = math.comb(n_numbers, k)
    return {e: math.comb(evens, e) * math.comb(odds, k - e) / total for e in range(k + 1)}


def even_count_distribution_with_replacement(slots: int) -> dict[int, float]:
    """Phân bố số lượng số chẵn trong `slots` số 00-99 độc lập (nhị thức, p = 1/2)."""
    return {e: math.comb(slots, e) / 2**slots for e in range(slots + 1)}


def bin_distribution(dist: dict[int, float], edges: Sequence[int]) -> list[float]:
    """Gộp phân bố rời rạc theo các khoảng [edges[i], edges[i+1])."""
    out = [0.0] * (len(edges) - 1)
    for value, p in dist.items():
        for i in range(len(edges) - 1):
            if edges[i] <= value < edges[i + 1]:
                out[i] += p
                break
    return out


# ---------- Kiểm định ----------

@dataclass(frozen=True)
class TestResult:
    statistic: float
    df: int | None
    p_value: float

    def as_dict(self) -> dict:
        out = {"statistic": round(self.statistic, 4), "p_value": round(self.p_value, 6)}
        if self.df is not None:
            out["df"] = self.df
        return out


def chi_square_uniform(counts: Sequence[int], draws: int, k: int, without_replacement: bool) -> TestResult:
    """Kiểm định chi-square tần suất đồng đều giữa các số.

    counts[i]: tổng số lần số i được quay qua `draws` kỳ, mỗi kỳ k lượt.
    - Có hoàn lại (XSMB): đa thức chuẩn, df = N - 1.
    - Không hoàn lại (Vietlott): mỗi kỳ các số loại trừ nhau nên thống kê Pearson
      thông thường bị nhỏ hơn thực tế. Nhân hệ số (N - 1) / (N - k) để thống kê
      tiệm cận chi-square với df = N - 1.
    """
    counts_arr = np.asarray(counts, dtype=float)
    n_numbers = len(counts_arr)
    if draws <= 0 or n_numbers < 2:
        raise ValueError("cần ít nhất 1 kỳ và 2 số")
    expected = draws * k / n_numbers
    stat = float(((counts_arr - expected) ** 2 / expected).sum())
    if without_replacement:
        stat *= (n_numbers - 1) / (n_numbers - k)
    df = n_numbers - 1
    return TestResult(stat, df, float(sps.chi2.sf(stat, df)))


def chi_square_goodness_of_fit(observed: Sequence[float], expected_probs: Sequence[float], min_expected: float = 5.0) -> TestResult:
    """Chi-square phù hợp phân bố. Gộp các ô có kỳ vọng < min_expected vào ô kề trước khi tính."""
    obs = np.asarray(observed, dtype=float)
    probs = np.asarray(expected_probs, dtype=float)
    n = obs.sum()
    exp = probs / probs.sum() * n
    merged_obs: list[float] = []
    merged_exp: list[float] = []
    acc_o = acc_e = 0.0
    for o, e in zip(obs, exp):
        acc_o += o
        acc_e += e
        if acc_e >= min_expected:
            merged_obs.append(acc_o)
            merged_exp.append(acc_e)
            acc_o = acc_e = 0.0
    if acc_e > 0:
        if merged_exp:
            merged_obs[-1] += acc_o
            merged_exp[-1] += acc_e
        else:
            merged_obs.append(acc_o)
            merged_exp.append(acc_e)
    if len(merged_exp) < 2:
        return TestResult(0.0, 0, 1.0)
    mo, me = np.asarray(merged_obs), np.asarray(merged_exp)
    stat = float(((mo - me) ** 2 / me).sum())
    df = len(me) - 1
    return TestResult(stat, df, float(sps.chi2.sf(stat, df)))


def runs_test(sequence: Iterable[bool]) -> TestResult:
    """Wald-Wolfowitz runs test hai phía cho một dãy nhị phân (xấp xỉ chuẩn).

    Dãy quá ít "chuỗi" (run) cho thấy các giá trị giống nhau dồn cục; quá nhiều cho thấy
    luân phiên bất thường. Thống kê trả về là z.
    """
    seq = [bool(x) for x in sequence]
    n1 = sum(seq)
    n2 = len(seq) - n1
    if n1 == 0 or n2 == 0:
        return TestResult(0.0, None, 1.0)
    runs = 1 + sum(1 for a, b in zip(seq, seq[1:]) if a != b)
    n = n1 + n2
    mean = 2 * n1 * n2 / n + 1
    var = 2 * n1 * n2 * (2 * n1 * n2 - n) / (n * n * (n - 1))
    if var <= 0:
        return TestResult(0.0, None, 1.0)
    z = (runs - mean) / math.sqrt(var)
    return TestResult(z, None, float(2 * sps.norm.sf(abs(z))))


# ---------- Khoảng cách giữa các lần về ----------

def gaps_from_presence(presence: Sequence[bool]) -> tuple[list[int], int]:
    """Từ dãy có mặt/vắng theo kỳ, trả (các khoảng vắng giữa hai lần về liên tiếp, số kỳ vắng hiện tại)."""
    idx = [i for i, hit in enumerate(presence) if hit]
    if not idx:
        return [], len(presence)
    gaps = [b - a - 1 for a, b in zip(idx, idx[1:])]
    return gaps, len(presence) - 1 - idx[-1]


# ---------- Backtest so với chọn ngẫu nhiên ----------

def random_pick_totals(actual_draws: Sequence[Sequence[int]], k: int, n_numbers: int, simulations: int, rng: np.random.Generator, chunk: int = 100) -> np.ndarray:
    """Tổng số trùng của `simulations` lần chọn ngẫu nhiên, mỗi lần chọn k số mới cho từng kỳ trong actual_draws."""
    t = len(actual_draws)
    mask = np.zeros((t, n_numbers + 1), dtype=np.int16)
    for i, draw in enumerate(actual_draws):
        mask[i, list(draw)[:k]] = 1
    totals = np.empty(simulations, dtype=np.int64)
    rows = np.arange(t)[None, :, None]
    for start in range(0, simulations, chunk):
        size = min(chunk, simulations - start)
        picks = np.argpartition(rng.random((size, t, n_numbers)), k, axis=2)[:, :, :k] + 1
        totals[start:start + size] = mask[rows, picks].sum(axis=(1, 2))
    return totals


def monte_carlo_p_value(observed: float, simulated: Sequence[float]) -> float:
    """p-value một phía P(ngẫu nhiên >= quan sát), có hiệu chỉnh +1 để không bao giờ bằng 0."""
    sim = np.asarray(simulated)
    return float((1 + np.count_nonzero(sim >= observed)) / (len(sim) + 1))
