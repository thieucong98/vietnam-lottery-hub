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

def test_budget_reads_initial_files_from_app():
    names = budget.initial_data_files([ROOT / "web" / "src" / "App.tsx"])
    assert names[0] == "summary.json"
