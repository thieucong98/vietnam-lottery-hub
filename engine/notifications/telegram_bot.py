import os
import sys
import json
from pathlib import Path
import requests
from loguru import logger

def format_telegram_message(summary_data: dict, gan_data: dict = None) -> str:
    """Format kết quả xổ số thành thông báo HTML đẹp mắt cho Telegram"""
    xsmb = summary_data.get("xsmb_latest", {})
    v655 = summary_data.get("vietlott_655_latest", {})
    v645 = summary_data.get("vietlott_645_latest", {})
    keno = summary_data.get("vietlott_keno_latest", {})

    msg = "🏆 <b>KẾT QUẢ XỔ SỐ & VIETLOTT HÔM NAY</b> 🏆\n"
    msg += f"📅 <i>Cập nhật: {xsmb.get('date', 'Hôm nay')}</i>\n\n"

    # XSMB
    if xsmb:
        prizes = xsmb.get("raw_prizes", {})
        special = str(prizes.get("special", "N/A"))
        prize1 = str(prizes.get("prize1", "N/A"))
        special_2d = special[-2:] if len(special) >= 2 else special

        msg += "🔴 <b>XỔ SỐ KIẾN THIẾT MIỀN BẮC (XSMB)</b>\n"
        msg += f"⭐ <b>Giải Đặc Biệt:</b> <code>{special}</code> (Đề: <b>{special_2d}</b>)\n"
        msg += f"🥇 <b>Giải Nhất:</b> <code>{prize1}</code>\n"

        # Lô tô về nhiều nháy
        loto_list = xsmb.get("loto_numbers", [])
        counts = {}
        for num in loto_list:
            counts[num] = counts.get(num, 0) + 1
        multi_hits = [f"{num} ({c} nháy)" for num, c in sorted(counts.items()) if c >= 2]
        if multi_hits:
            msg += f"🔥 <b>Lô nổ nhiều nháy:</b> {', '.join(multi_hits)}\n"

        # Đầu câm / Đuôi câm
        heads = xsmb.get("heads", {})
        cam_heads = [h for h, tails in heads.items() if len(tails) == 0]
        if cam_heads:
            msg += f"⚠️ <b>Đầu câm:</b> Đầu {', '.join(cam_heads)}\n"
        msg += "\n"

    # Vietlott 6/55
    if v655 and "result" in v655:
        balls = [f"{b:02d}" for b in v655["result"][:6]]
        extra_ball = f" ★ <b>{v655['result'][6]:02d}</b> (Jackpot 2)" if len(v655["result"]) > 6 else ""
        msg += "🟡 <b>VIETLOTT POWER 6/55</b>\n"
        msg += f"Kỳ #{v655.get('id', '')} ({v655.get('date', '')}):\n"
        msg += f"🎯 [ {' - '.join(balls)} ]{extra_ball}\n\n"

    # Vietlott 6/45
    if v645 and "result" in v645:
        balls = [f"{b:02d}" for b in v645["result"][:6]]
        msg += "🔵 <b>VIETLOTT MEGA 6/45</b>\n"
        msg += f"Kỳ #{v645.get('id', '')} ({v645.get('date', '')}):\n"
        msg += f"🎯 [ {' - '.join(balls)} ]\n\n"

    # Vietlott Keno
    if keno and "result" in keno:
        balls = [f"{b:02d}" for b in keno["result"][:10]]
        rule = f" | {keno.get('big_small', '')} - {keno.get('odd_even', '')}"
        msg += "🟢 <b>VIETLOTT KENO (QUAY NHANH)</b>\n"
        msg += f"🎯 [ {' '.join(balls)} ... ]{rule}\n\n"

    msg += "👉 <b>Tra cứu 20 năm & Soi cầu:</b> https://thieucong98.github.io/vietnam-lottery-hub/"
    return msg

def send_telegram_alert(summary_file: str = "web/public/data/summary.json"):
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        logger.warning("Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong môi trường. Bỏ qua bước gửi Telegram.")
        logger.info("Mẹo: Để kích hoạt, hãy thêm TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID vào GitHub Secrets hoặc file .env")
        return False

    summary_path = Path(summary_file)
    if not summary_path.exists():
        logger.error(f"Không tìm thấy tệp {summary_file}")
        return False

    with open(summary_path, "r", encoding="utf-8") as f:
        summary_data = json.load(f)

    message = format_telegram_message(summary_data)
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }

    try:
        res = requests.post(url, json=payload, timeout=15)
        if res.status_code == 200:
            logger.info("Đã gửi thông báo kết quả xổ số qua Telegram thành công!")
            return True
        else:
            logger.error(f"Lỗi gửi Telegram (mã {res.status_code}): {res.text}")
            return False
    except Exception as e:
        logger.error(f"Ngoại lệ khi gửi Telegram: {e}")
        return False

if __name__ == "__main__":
    send_telegram_alert()
