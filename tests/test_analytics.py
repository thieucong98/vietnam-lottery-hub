from engine.ml.strategies.all_strategies import (
    FrequencyStrategy,
    LongAbsenceStrategy,
    ExponentialDecayStrategy,
    MarkovChainStrategy,
)

def test_strategies_sample_picks():
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
        picks = strat.pick(mock_history, k=6, max_number=55)
        assert len(picks) == 6, f"{strat.name} phải trả về 6 số"
        assert len(set(picks)) == 6, f"{strat.name} không được có số trùng lặp"
        for num in picks:
            assert 1 <= num <= 55, f"{strat.name}: số {num} phải nằm trong khoảng 1 đến 55"

def test_ml_insights_schema_v2():
    import json
    import tempfile
    from pathlib import Path
    from engine.ml.render_insights import SCHEMA_VERSION, generate_ml_insights

    with tempfile.TemporaryDirectory() as tmp_dir:
        generate_ml_insights(out_dir=Path(tmp_dir))
        out_file = Path(tmp_dir) / "ml_insights.json"
        assert out_file.exists(), "Tệp ml_insights.json phải được tạo"
        with open(out_file, "r", encoding="utf-8") as f:
            payload = json.load(f)

    assert payload["schema_version"] == SCHEMA_VERSION == 2
    assert "predictions" not in payload
    assert payload["jackpot_odds"] == "1/28.989.675"
    assert "không làm tăng xác suất trúng" in payload["disclaimer"]
    assert len(payload["sample_sets"]) == 4
    for item in payload["sample_sets"]:
        assert "predicted_numbers" not in item
        assert len(item["sample_picks"]) == 6
        assert "chỉ minh họa" in item["description"]

def test_bac_nho_analysis():
    from engine.analytics.bac_nho_analyzer import BacNhoAnalyzer
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        analyzer = BacNhoAnalyzer(output_path=tmp_path)
        data = analyzer.analyze()
        assert "metadata" in data
        assert "by_loto" in data
        assert "by_special" in data
        assert "00" in data["by_loto"]
        assert len(data["by_loto"]["00"]["top_followers"]) > 0
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def test_vietlott_combination_analysis():
    from engine.analytics.vietlott_combination_analyzer import VietlottCombinationAnalyzer
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp_draws:
        tmp_draws_path = tmp_draws.name
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp_cooc:
        tmp_cooc_path = tmp_cooc.name

    try:
        analyzer = VietlottCombinationAnalyzer(
            output_draws_path=tmp_draws_path,
            output_matrix_path=tmp_cooc_path
        )
        full_draws = analyzer.extract_full_draws()
        assert "vietlott_655" in full_draws
        assert "vietlott_645" in full_draws
        assert len(full_draws["vietlott_655"]) > 1000

        cooc = analyzer.analyze_cooccurrence(full_draws)
        assert "vietlott_655" in cooc
        assert len(cooc["vietlott_655"]["top_pairs"]) > 0
        assert len(cooc["vietlott_655"]["top_triplets"]) > 0
    finally:
        if os.path.exists(tmp_draws_path):
            os.remove(tmp_draws_path)
        if os.path.exists(tmp_cooc_path):
            os.remove(tmp_cooc_path)

def test_xsmb_recent_draws_export():
    from engine.analytics.index_builder import IndexBuilder
    from pathlib import Path
    import tempfile
    import json

    with tempfile.TemporaryDirectory() as tmp_dir:
        builder = IndexBuilder(
            data_dir_xsmb=Path("data/xsmb"),
            data_dir_vietlott=Path("data/vietlott"),
            web_data_dir=Path(tmp_dir),
        )
        builder.export_xsmb_recent_draws(limit=10)
        output_file = Path(tmp_dir) / "xsmb_recent_draws.json"
        assert output_file.exists(), "Tệp xsmb_recent_draws.json phải được tạo"
        with open(output_file, "r", encoding="utf-8") as f:
            draws = json.load(f)
        assert len(draws) == 10, "Phải xuất đúng 10 kỳ quay"
        first = draws[0]
        assert "date" in first
        assert "special" in first
        assert "special_2d" in first
        assert "raw_prizes" in first
        assert "heads" in first
        assert "tails" in first
        assert len(first["raw_prizes"]) == 27
        assert len(first["loto_numbers"]) == 27

