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

