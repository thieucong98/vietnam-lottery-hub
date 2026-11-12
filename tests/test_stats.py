"""Test công thức thống kê trong engine/analytics/stats.py và các bộ phân tích dùng chúng."""

import math

import numpy as np
import pytest
from scipy import stats as sps

from engine.analytics import stats
from engine.analytics.transparency import GAMES, analyze_game
from engine.ml.backtest import BacktestEngine
from engine.ml.strategies.all_strategies import FrequencyStrategy


# ---------- Khoảng tin cậy ----------

def test_wilson_interval_known_value():
    # Giá trị tham chiếu: Wilson 95% cho 10/100 là (0.0552, 0.1744)
    lo, hi = stats.wilson_interval(10, 100)
    assert lo == pytest.approx(0.05523, abs=1e-4)
    assert hi == pytest.approx(0.17437, abs=1e-4)


def test_wilson_interval_edges():
    assert stats.wilson_interval(0, 0) == (0.0, 1.0)
    lo, hi = stats.wilson_interval(0, 50)
    assert lo == 0.0 and 0 < hi < 0.1
    lo, hi = stats.wilson_interval(50, 50)
    assert hi == 1.0 and 0.9 < lo < 1
    with pytest.raises(ValueError):
        stats.wilson_interval(5, 3)


def test_wilson_interval_coverage():
    """Khoảng 95% phải chứa tỷ lệ thật khoảng 95% số lần."""
    rng = np.random.default_rng(7)
    p, n = 6 / 55, 300
    hits = rng.binomial(n, p, size=4000)
    covered = np.mean([lo <= p <= hi for lo, hi in (stats.wilson_interval(int(h), n) for h in hits)])
    assert 0.93 < covered < 0.97


def test_binomial_p_matches_scipy():
    assert stats.binomial_two_sided_p(30, 74, 0.244) == pytest.approx(sps.binomtest(30, 74, 0.244).pvalue)
    assert stats.binomial_two_sided_p(0, 0, 0.5) == 1.0


# ---------- Xác suất lý thuyết ----------

def test_presence_probabilities():
    assert stats.presence_probability_without_replacement(6, 55) == pytest.approx(6 / 55)
    # XSMB: 27 giải, 100 số -> 1 - 0.99^27
    assert stats.presence_probability_with_replacement(27, 100) == pytest.approx(1 - 0.99**27)


def test_expected_matches_matches_issue_baseline():
    # Kỳ vọng ngẫu nhiên nêu trong kế hoạch: 6 x 6 / 55 ≈ 0,65
    assert stats.expected_matches(6, 55) == pytest.approx(36 / 55)
    assert round(stats.expected_matches(6, 55), 2) == 0.65


def test_geometric_gap_formulas():
    q = 6 / 55
    pmf_sum = sum(stats.geometric_gap_pmf(g, q) for g in range(2000))
    assert pmf_sum == pytest.approx(1.0)
    mean = sum(g * stats.geometric_gap_pmf(g, q) for g in range(2000))
    assert mean == pytest.approx(stats.expected_mean_gap(q))
    assert stats.prob_gap_at_least(0, q) == 1.0
    assert stats.prob_gap_at_least(10, q) == pytest.approx((1 - q) ** 10)


def test_sum_distribution_without_replacement_small_case():
    # Chọn 2 số từ 1..4: tổng 3,4,5,5,6,7 -> P(5) = 2/6
    dist = stats.sum_distribution_without_replacement(2, 4)
    assert dist == pytest.approx({3: 1 / 6, 4: 1 / 6, 5: 2 / 6, 6: 1 / 6, 7: 1 / 6})


@pytest.mark.parametrize("k,n", [(6, 55), (6, 45)])
def test_sum_distribution_without_replacement_moments(k, n):
    dist = stats.sum_distribution_without_replacement(k, n)
    assert sum(dist.values()) == pytest.approx(1.0)
    mean = sum(s * p for s, p in dist.items())
    var = sum((s - mean) ** 2 * p for s, p in dist.items())
    exp_mean, exp_var = stats.sum_mean_var_without_replacement(k, n)
    assert mean == pytest.approx(exp_mean)
    assert var == pytest.approx(exp_var)
    assert min(dist) == sum(range(1, k + 1))
    assert max(dist) == sum(range(n - k + 1, n + 1))


def test_sum_distribution_with_replacement():
    # Hai xúc xắc 1..6
    dist = stats.sum_distribution_with_replacement(2, range(1, 7))
    assert dist[7] == pytest.approx(6 / 36)
    assert dist[2] == pytest.approx(1 / 36)
    xsmb = stats.sum_distribution_with_replacement(27, range(100))
    assert sum(xsmb.values()) == pytest.approx(1.0)
    assert sum(s * p for s, p in xsmb.items()) == pytest.approx(27 * 49.5)


def test_even_count_distributions():
    d = stats.even_count_distribution_without_replacement(6, 55)  # 27 chẵn, 28 lẻ
    assert sum(d.values()) == pytest.approx(1.0)
    assert d[0] == pytest.approx(math.comb(28, 6) / math.comb(55, 6))
    b = stats.even_count_distribution_with_replacement(27)
    assert b[13] == pytest.approx(sps.binom.pmf(13, 27, 0.5))


def test_bin_distribution():
    dist = {1: 0.1, 2: 0.2, 3: 0.3, 4: 0.4}
    assert stats.bin_distribution(dist, [1, 3, 5]) == pytest.approx([0.3, 0.7])


# ---------- Kiểm định ----------

def test_chi_square_uniform_with_replacement_matches_scipy():
    counts = [12, 8, 10, 10]
    res = stats.chi_square_uniform(counts, draws=40, k=1, without_replacement=False)
    ref = sps.chisquare(counts)
    assert res.statistic == pytest.approx(ref.statistic)
    assert res.p_value == pytest.approx(ref.pvalue)
    assert res.df == 3


def test_chi_square_uniform_without_replacement_is_calibrated():
    """Với dữ liệu ngẫu nhiên thật, p < 0.05 phải xảy ra khoảng 5% số lần (có hiệu chỉnh không hoàn lại)."""
    rng = np.random.default_rng(1)
    pvals = []
    for _ in range(300):
        draws = [rng.choice(np.arange(1, 56), 6, replace=False) for _ in range(200)]
        counts = np.bincount(np.concatenate(draws), minlength=56)[1:]
        pvals.append(stats.chi_square_uniform(counts, 200, 6, without_replacement=True).p_value)
    rate = np.mean(np.array(pvals) < 0.05)
    assert 0.02 < rate < 0.09


def test_chi_square_uniform_detects_bias():
    counts = [100] * 54 + [300]
    res = stats.chi_square_uniform(counts, draws=(54 * 100 + 300) // 6, k=6, without_replacement=True)
    assert res.p_value < 1e-6


def test_chi_square_goodness_of_fit_merges_small_cells():
    observed = [1, 2, 50, 47, 0]
    probs = [0.01, 0.01, 0.49, 0.48, 0.01]
    res = stats.chi_square_goodness_of_fit(observed, probs)
    # Ô đầu (kỳ vọng 1+1 < 5) gộp vào ô thứ ba; ô cuối gộp vào ô kề trước -> còn 2 ô
    assert res.df == 1
    assert 0 <= res.p_value <= 1


def test_runs_test_known_patterns():
    alternating = [True, False] * 20
    clustered = [True] * 20 + [False] * 20
    assert stats.runs_test(alternating).statistic > 3
    assert stats.runs_test(clustered).statistic < -3
    assert stats.runs_test(alternating).p_value < 0.01
    assert stats.runs_test([True] * 10).p_value == 1.0


def test_runs_test_formula():
    seq = [True, True, False, True, False, False, True, False]
    # n1 = 4, n2 = 4, runs = 6 -> mean 5, var = 2*16*(32-8)/(64*7) = 12/7
    res = stats.runs_test(seq)
    assert res.statistic == pytest.approx((6 - 5) / math.sqrt(12 / 7))


def test_gaps_from_presence():
    gaps, current = stats.gaps_from_presence([False, True, False, False, True, True, False])
    assert gaps == [2, 0]
    assert current == 1
    assert stats.gaps_from_presence([False, False]) == ([], 2)


# ---------- Backtest ----------

def test_random_pick_totals_mean_matches_expectation():
    rng = np.random.default_rng(3)
    draws = [sorted(rng.choice(np.arange(1, 56), 6, replace=False).tolist()) for _ in range(50)]
    totals = stats.random_pick_totals(draws, 6, 55, 2000, np.random.default_rng(4))
    assert totals.mean() / 50 == pytest.approx(36 / 55, abs=0.02)


def test_monte_carlo_p_value():
    assert stats.monte_carlo_p_value(10, [1, 2, 3]) == pytest.approx(1 / 4)
    assert stats.monte_carlo_p_value(0, [1, 2, 3]) == 1.0


def test_backtest_engine_report_shape_and_determinism():
    rng = np.random.default_rng(5)
    draws = [sorted(rng.choice(np.arange(1, 56), 6, replace=False).tolist()) for _ in range(120)]
    engine = BacktestEngine([FrequencyStrategy(window=30)])
    a = engine.evaluate(draws, test_draws=40, simulations=200, seed=1)
    b = engine.evaluate(draws, test_draws=40, simulations=200, seed=1)
    assert a == b
    assert a["simulations"] == 200
    assert a["expected_average"] == pytest.approx(36 / 55, abs=1e-4)
    assert a["random"]["low_95"] <= a["random"]["mean_average"] <= a["random"]["high_95"]
    assert sum(a["random"]["histogram"]["counts"]) == 200
    row = a["strategies"][0]
    assert 0 < row["p_value"] <= 1
    assert row["average_matches"] == pytest.approx(row["total_matches"] / 40, abs=1e-3)


# ---------- Bộ phân tích minh bạch ----------

def test_analyze_game_on_random_draws_is_within_noise():
    rng = np.random.default_rng(11)
    spec = GAMES["vietlott_645"]
    draws = [rng.choice(np.arange(1, 46), 6, replace=False).tolist() for _ in range(600)]
    dates = [f"2020-01-{(i % 28) + 1:02d}" for i in range(600)]
    report = analyze_game(draws, dates, spec)

    freq = report["frequency"]
    assert len(freq["numbers"]) == 45
    assert sum(r["hits"] for r in freq["numbers"]) == 600 * 6
    assert freq["expected_rate"] == pytest.approx(6 / 45, abs=1e-4)
    for key in ("frequency", "gaps", "sums", "parity"):
        assert 0 <= report[key]["chi_square"]["p_value"] <= 1
    assert sum(report["sums"]["histogram"]["observed"]) <= 600
    assert sum(report["parity"]["histogram"]["observed"]) == 600
    assert report["sums"]["expected_mean"] == pytest.approx(138.0)


def test_analyze_game_requires_minimum_sample():
    with pytest.raises(ValueError):
        analyze_game([[1, 2, 3, 4, 5, 6]] * 10, ["2020-01-01"] * 10, GAMES["vietlott_655"])


def test_bac_nho_follower_includes_base_rate():
    from engine.analytics.bac_nho_analyzer import build_followers

    next_hits = np.array([30] + [10] * 99)
    base_hits = np.array([250] * 100)
    rows = build_followers(next_hits, 100, base_hits, 1000, {}, top=3)
    assert rows[0]["number"] == "00"
    assert rows[0]["rate"] == 30.0
    assert rows[0]["base_rate"] == 25.0
    assert rows[0]["ci_low"] < 30.0 < rows[0]["ci_high"]
    # 30/100 so với nền 25%: chênh lệch nằm trong dao động ngẫu nhiên sau hiệu chỉnh 100 phép so sánh
    assert rows[0]["p_value_adjusted"] == 1.0 or rows[0]["p_value_adjusted"] > 0.05
