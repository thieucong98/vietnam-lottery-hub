import pytest
from pathlib import Path
from engine.notifications.telegram_bot import handle_telegram_command, format_telegram_message

def test_telegram_commands():
    data_dir = "web/public/data"
    
    # 1. /help
    help_resp = handle_telegram_command("/help", data_dir=data_dir)
    assert "/xsmb" in help_resp
    assert "/power" in help_resp
    assert "/check" in help_resp
    assert "/keno" in help_resp
    assert "/3d" in help_resp
    
    # 2. /web
    web_resp = handle_telegram_command("/web", data_dir=data_dir)
    assert "https://thieucong98.github.io/vietnam-lottery-hub/" in web_resp
    
    # 3. /xsmb
    xsmb_resp = handle_telegram_command("/xsmb", data_dir=data_dir)
    assert "XSMB" in xsmb_resp or "Đặc Biệt" in xsmb_resp
    
    # 4. /power
    power_resp = handle_telegram_command("/power", data_dir=data_dir)
    assert "POWER 6/55" in power_resp or "Bộ số mở thưởng" in power_resp
    
    # 5. /gan
    gan_resp = handle_telegram_command("/gan", data_dir=data_dir)
    assert "GAN" in gan_resp
    
    # 6. /check 1 số
    check_single = handle_telegram_command("/check 35", data_dir=data_dir)
    assert "35" in check_single
    assert "Tổng lần về" in check_single
    
    # 7. /check bộ 6 số
    check_combo = handle_telegram_command("/check 07 18 24 35 41 55", data_dir=data_dir)
    assert "POWER 6/55" in check_combo
    assert "Jackpot 1" in check_combo
    assert "Giải Ba" in check_combo

    # 8. /legal
    legal_resp = handle_telegram_command("/legal", data_dir=data_dir)
    assert "CHÍNH SÁCH PHÁP LÝ" in legal_resp
    assert "18+" in legal_resp
    assert "Điều 321" in legal_resp
    assert "LEGAL_DISCLAIMER.md" in legal_resp

    # 9. /keno
    keno_resp = handle_telegram_command("/keno", data_dir=data_dir)
    assert "KENO" in keno_resp
    assert "20 số mở thưởng" in keno_resp
    assert "Tổng điểm" in keno_resp

    # 10. /3d và /3d pro
    d3_resp = handle_telegram_command("/3d", data_dir=data_dir)
    assert "MAX 3D" in d3_resp
    assert "Giải Đặc Biệt" in d3_resp

    d3pro_resp = handle_telegram_command("/3d pro", data_dir=data_dir)
    assert "MAX 3D PRO" in d3pro_resp
    assert "Giải Đặc Biệt" in d3pro_resp

def test_telegram_broadcast_message():
    import json
    data_path = Path("web/public/data/summary.json")
    if data_path.exists():
        with open(data_path, "r", encoding="utf-8") as f:
            summary_data = json.load(f)
        msg = format_telegram_message(summary_data)
        assert "XSMB" in msg
        assert "POWER 6/55" in msg
        assert "KENO" in msg
        assert "MAX 3D" in msg


