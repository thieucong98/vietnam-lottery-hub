"""
Script khởi động Telegram Bot ở chế độ Long Polling tương tác 2 chiều.
Người dùng có thể chat trực tiếp với Bot để tra cứu XSMB, Vietlott, lô gan, bạc nhớ và so khớp vé.

Cách chạy:
    uv run python scripts/run_telegram_bot.py
"""
import sys
from pathlib import Path

# Thêm thư mục gốc vào PYTHONPATH
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from engine.notifications.telegram_bot import run_telegram_bot_polling

if __name__ == "__main__":
    data_directory = str(project_root / "web" / "public" / "data")
    run_telegram_bot_polling(data_dir=data_directory)
