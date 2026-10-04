from engine.ml.strategies.all_strategies import (
    FrequencyStrategy,
    LongAbsenceStrategy,
    ExponentialDecayStrategy,
    MarkovChainStrategy,
)

def test_strategies_prediction():
    mock_history = [
        [1, 5, 12, 23, 34, 45],
        [2, 5, 14, 25, 36, 45],
        [3, 8, 12, 28, 39, 50],
        [1, 9, 15, 23, 40, 52],
    ]
    strategies = [
        FrequencyStrategy(window=3),
        LongAbsenceStrategy(),
        ExponentialDecayStrategy(),
        MarkovChainStrategy(),
    ]
    for strat in strategies:
        pred = strat.predict(mock_history, k=6, max_number=55)
        assert len(pred) == 6, f"{strat.name} phải trả về 6 số"
        assert len(set(pred)) == 6, f"{strat.name} không được có số trùng lặp"
        for num in pred:
            assert 1 <= num <= 55, f"{strat.name}: số {num} phải nằm trong khoảng 1 đến 55"
