from pathlib import Path
import json
import polars as pl

def test_xsmb_data_integrity():
    csv_file = Path("data/xsmb/xsmb.csv")
    assert csv_file.exists(), "Tệp xsmb.csv phải tồn tại"
    df = pl.read_csv(csv_file)
    assert not df.is_empty(), "Dữ liệu XSMB không được rỗng"
    assert "date" in df.columns
    assert "special" in df.columns
    assert len(df.columns) == 28, f"XSMB phải có đúng 28 cột (date + 27 giải), hiện có {len(df.columns)}"

def test_vietlott_data_integrity():
    p655_file = Path("data/vietlott/power655.jsonl")
    assert p655_file.exists(), "Tệp power655.jsonl phải tồn tại"
    df = pl.read_ndjson(p655_file)
    assert not df.is_empty(), "Dữ liệu Power 6/55 không được rỗng"
    sample = df["result"].to_list()[-1]
    assert len(sample) >= 6, "Kỳ quay 6/55 phải có ít nhất 6 số"
    for n in sample[:6]:
        assert 1 <= n <= 55, f"Số {n} phải nằm trong khoảng 1 đến 55"

def test_lookup_indexes_integrity():
    xsmb_idx = Path("web/public/data/xsmb_index.json")
    viet_idx = Path("web/public/data/vietlott_655_index.json")
    assert xsmb_idx.exists(), "Tệp xsmb_index.json phải tồn tại"
    assert viet_idx.exists(), "Tệp vietlott_655_index.json phải tồn tại"

    with open(xsmb_idx, "r", encoding="utf-8") as f:
        data_xsmb = json.load(f)
    assert "numbers" in data_xsmb
    assert len(data_xsmb["numbers"]) == 100, "XSMB phải lập chỉ mục đủ 100 số từ 00 đến 99"
    assert "68" in data_xsmb["numbers"]
    assert "days_since_last" in data_xsmb["numbers"]["68"]
    assert "first_seen_date" in data_xsmb["numbers"]["68"], "Phải có trường first_seen_date"
    assert "yearly_distribution" in data_xsmb["numbers"]["68"], "Phải có trường yearly_distribution"

    with open(viet_idx, "r", encoding="utf-8") as f:
        data_viet = json.load(f)
    assert "numbers" in data_viet
    assert len(data_viet["numbers"]) == 55, "Power 6/55 phải lập chỉ mục đủ 55 số từ 01 đến 55"

    # Kiểm tra history chunk files
    hist_68 = Path("web/public/data/history/xsmb/68.json")
    assert hist_68.exists(), "Tệp lịch sử chi tiết 68.json phải tồn tại"
    with open(hist_68, "r", encoding="utf-8") as f:
        records_68 = json.load(f)
    assert len(records_68) > 0, "Lịch sử của số 68 không được rỗng"
    assert "date" in records_68[0]
    assert "prizes" in records_68[0]
