import importlib.util
import json
import shutil
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "web" / "public" / "data"

def _load(name: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    # dataclasses cần module có trong sys.modules khi nạp từ đường dẫn file
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module

schema = _load("validate_data_schema")
budget = _load("check_size_budget")

@pytest.fixture
def data_copy(tmp_path):
    dst = tmp_path / "data"
    shutil.copytree(DATA_DIR, dst)
    return dst

def _edit(path: Path, fn):
    data = json.loads(path.read_text(encoding="utf-8"))
    fn(data)
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

def test_current_data_matches_schema():
    errors, checked = schema.validate(DATA_DIR)
    assert errors == []
    assert checked >= 200

def test_schema_rejects_legacy_predicted_numbers(data_copy):
    def legacy(d):
        d["schema_version"] = 1
        for s in d["sample_sets"]:
            s["predicted_numbers"] = s.pop("sample_picks")

    _edit(data_copy / "ml_insights.json", legacy)
    errors, _ = schema.validate(data_copy, src_dir=None)
    assert any("ml_insights.json" in e for e in errors)

def test_schema_rejects_bad_draw(data_copy):
    _edit(data_copy / "summary.json", lambda d: d["vietlott_645_latest"]["result"].append(99))
    errors, _ = schema.validate(data_copy, src_dir=None)
    assert any("summary.json" in e and "vietlott_645_latest" in e for e in errors)

def test_schema_detects_missing_history_file(data_copy):
    (data_copy / "history" / "xsmb" / "42.json").unlink()
    errors, _ = schema.validate(data_copy, src_dir=None)
    assert any("history/xsmb" in e and "42" in e for e in errors)

def test_schema_cross_check_latest(data_copy):
    _edit(data_copy / "summary.json", lambda d: d["xsmb_latest"].__setitem__("date", "2001-01-01"))
    errors, _ = schema.validate(data_copy, src_dir=None)
    assert any("kiểm tra chéo" in e for e in errors)

def test_budget_fails_when_over_limit():
    m = budget.Measure("initial_data", raw=500, gz=50)
    failures, warnings = budget.evaluate([m], {"initial_data": {"max_raw": 400, "max_gzip": 100, "target_raw": 100}})
    assert len(failures) == 1 and "raw" in failures[0]
    assert len(warnings) == 1

def test_budget_passes_for_current_data():
    cfg = json.loads((ROOT / "size-budget.json").read_text(encoding="utf-8"))
    measures = budget.measure_data(cfg, DATA_DIR)
    failures, _ = budget.evaluate(measures, cfg["budgets"])
    assert failures == []

def _fake_dist(root: Path) -> Path:
    dist = root / "dist"
    (dist / "assets").mkdir(parents=True)
    (dist / "data").mkdir()
    (dist / "bundles").mkdir()
    (dist / "index.html").write_text('<script type="module" src="./assets/index-abc.js"></script>', encoding="utf-8")
    (dist / "assets" / "index-abc.js").write_text("console.log(1)", encoding="utf-8")
    (dist / "data" / "summary.json").write_text("{}", encoding="utf-8")
    (dist / "bundles" / "xsmb_draws_recent.json").write_text('{"draws":[]}', encoding="utf-8")
    return dist

def test_budget_measures_initial_data_from_dist(tmp_path):
    cfg = json.loads((ROOT / "size-budget.json").read_text(encoding="utf-8"))
    measures = {m.name: m for m in budget.measure_bundle(cfg, _fake_dist(tmp_path))}
    assert measures["initial_data"].raw == len("{}") + len('{"draws":[]}')
    assert measures["largest_bundle_file"].detail == "bundles/xsmb_draws_recent.json"

def test_budget_fails_when_initial_file_missing(tmp_path):
    dist = _fake_dist(tmp_path)
    (dist / "bundles" / "xsmb_draws_recent.json").unlink()
    with pytest.raises(FileNotFoundError):
        budget.measure_bundle({"initial_data_files": ["bundles/xsmb_draws_recent.json"]}, dist)

def test_initial_data_target_is_phase1_criterion():
    cfg = json.loads((ROOT / "size-budget.json").read_text(encoding="utf-8"))
    assert cfg["budgets"]["initial_data"]["max_raw"] <= 100 * 1024

def test_schema_detects_frontend_data_files():
    names = schema.fetched_files(ROOT / "web" / "src")
    assert {"summary.json", "ml_insights.json", "bac_nho.json", "vietlott_cooccurrence.json"} <= names
    assert not any("${" in n for n in names)
