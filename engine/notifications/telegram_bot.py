import os
import sys
import json
import time
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

        loto_list = xsmb.get("loto_numbers", [])
        counts = {}
        for num in loto_list:
            counts[num] = counts.get(num, 0) + 1
        multi_hits = [f"{num} ({c} nháy)" for num, c in sorted(counts.items()) if c >= 2]
        if multi_hits:
            msg += f"🔥 <b>Lô nổ nhiều nháy:</b> {', '.join(multi_hits)}\n"

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

def send_telegram_alert(summary_file: str = "web/public/data/summary.json") -> bool:
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        logger.warning("Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID. Bỏ qua bước gửi Telegram.")
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

# =========================================================================
# XỬ LÝ LỆNH TRA CỨU TƯƠNG TÁC 2 CHIỀU (TWO-WAY INTERACTIVE COMMANDS)
# =========================================================================

def _load_json_data(data_path: Path):
    if not data_path.exists():
        return None
    try:
        with open(data_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Lỗi đọc JSON {data_path}: {e}")
        return None

def handle_telegram_command(cmd_text: str, data_dir: str = "web/public/data") -> str:
    """Xử lý lệnh từ người dùng và trả về nội dung HTML để phản hồi"""
    text = cmd_text.strip()
    parts = text.split()
    if not parts:
        return "Xin chào! Gõ /help để xem danh sách lệnh tra cứu."

    cmd = parts[0].lower()
    args = parts[1:]
    base_dir = Path(data_dir)

    # 1. /start hoặc /help
    if cmd in ["/start", "/help", "help", "trogiup"]:
        return (
            "🤖 <b>CHÀO MỪNG ĐẾN VỚI BOT TRA CỨU XỔ SỐ & VIETLOTT</b>\n\n"
            "Danh sách lệnh bạn có thể sử dụng:\n"
            "🔴 <b>/xsmb</b> - Kết quả XSMB hôm nay & đầu đuôi\n"
            "🟡 <b>/power</b> hoặc <b>/655</b> - Kết quả Vietlott Power 6/55 mới nhất\n"
            "🔵 <b>/mega</b> hoặc <b>/645</b> - Kết quả Vietlott Mega 6/45 mới nhất\n"
            "🎯 <b>/check &lt;các số&gt;</b> - So khớp vé tức thì (VD: <code>/check 68</code> hoặc <code>/check 07 18 24 35 41 55</code>)\n"
            "⏳ <b>/gan [xsmb|655|645]</b> - Top 10 số gan lì chưa về lâu nhất\n"
            "🧠 <b>/bacnho &lt;số&gt;</b> - Bạc nhớ 20 năm: những số hay về theo sau số này\n"
            "🔥 <b>/hot [655|645]</b> - Top các cặp số có tần suất về cùng nhau cao nhất\n"
            "🌐 <b>/web</b> - Link truy cập nền tảng trực tuyến\n\n"
            "<i>Dữ liệu được cập nhật tự động 100% sau mỗi giờ quay!</i>"
        )

    # 2. /web
    if cmd in ["/web", "/link"]:
        return (
            "🌐 <b>NỀN TẢNG TRA CỨU & PHÂN TÍCH XỔ SỐ CHUYÊN NGHIỆP</b>\n\n"
            "👉 Truy cập ngay tại: https://thieucong98.github.io/vietnam-lottery-hub/\n\n"
            "⚡ Tra cứu 20 năm XSMB, Vietlott 6/55, 6/45, Max 3D, Keno hoàn toàn miễn phí!"
        )

    # 3. /xsmb
    if cmd in ["/xsmb", "/mienbac", "xsmb"]:
        summary = _load_json_data(base_dir / "summary.json")
        if not summary or "xsmb_latest" not in summary:
            return "⚠️ Hiện chưa có dữ liệu XSMB mới nhất. Vui lòng thử lại sau!"
        x = summary["xsmb_latest"]
        p = x.get("raw_prizes", {})
        spec = str(p.get("special", "N/A"))
        spec_2d = spec[-2:] if len(spec) >= 2 else spec
        p1 = str(p.get("prize1", "N/A"))

        resp = f"🔴 <b>KẾT QUẢ XSMB NGÀY {x.get('date', '')}</b>\n\n"
        resp += f"⭐ <b>Giải Đặc Biệt:</b> <code>{spec}</code> (Đề: <b>{spec_2d}</b>)\n"
        resp += f"🥇 <b>Giải Nhất:</b> <code>{p1}</code>\n\n"

        loto = x.get("loto_numbers", [])
        counts = {}
        for num in loto:
            counts[num] = counts.get(num, 0) + 1
        multi = [f"<b>{num}</b> ({c} nháy)" for num, c in sorted(counts.items()) if c >= 2]
        if multi:
            resp += f"🔥 <b>Lô nổ nhiều nháy:</b> {', '.join(multi)}\n\n"

        heads = x.get("heads", {})
        cam = [h for h, tails in heads.items() if len(tails) == 0]
        if cam:
            resp += f"⚠️ <b>Đầu câm:</b> Đầu {', '.join(cam)}\n"

        resp += "\n👉 <i>Chi tiết 27 giải: https://thieucong98.github.io/vietnam-lottery-hub/</i>"
        return resp

    # 4. /power hoặc /655
    if cmd in ["/power", "/655", "power", "655"]:
        summary = _load_json_data(base_dir / "summary.json")
        if not summary or "vietlott_655_latest" not in summary:
            return "⚠️ Chưa có dữ liệu Power 6/55 mới nhất."
        v = summary["vietlott_655_latest"]
        res = v.get("result", [])
        balls = " - ".join(f"<b>{b:02d}</b>" for b in res[:6])
        bonus = f" ★ <b>{res[6]:02d}</b> (Jackpot 2)" if len(res) > 6 else ""

        return (
            f"🟡 <b>VIETLOTT POWER 6/55 - KỲ #{v.get('id', '')}</b>\n"
            f"📅 Ngày quay: {v.get('date', '')}\n\n"
            f"🎯 Bộ số mở thưởng: [ {balls} ]{bonus}\n\n"
            f"👉 <i>So khớp vé bao & tra cứu bộ số: https://thieucong98.github.io/vietnam-lottery-hub/</i>"
        )

    # 5. /mega hoặc /645
    if cmd in ["/mega", "/645", "mega", "645"]:
        summary = _load_json_data(base_dir / "summary.json")
        if not summary or "vietlott_645_latest" not in summary:
            return "⚠️ Chưa có dữ liệu Mega 6/45 mới nhất."
        v = summary["vietlott_645_latest"]
        res = v.get("result", [])
        balls = " - ".join(f"<b>{b:02d}</b>" for b in res[:6])

        return (
            f"🔵 <b>VIETLOTT MEGA 6/45 - KỲ #{v.get('id', '')}</b>\n"
            f"📅 Ngày quay: {v.get('date', '')}\n\n"
            f"🎯 Bộ số mở thưởng: [ {balls} ]\n\n"
            f"👉 <i>So khớp vé bao & tra cứu bộ số: https://thieucong98.github.io/vietnam-lottery-hub/</i>"
        )

    # 6. /gan
    if cmd in ["/gan", "gan", "/logan"]:
        target_prod = args[0].lower() if args else "xsmb"
        if target_prod in ["655", "power"]:
            idx_file = base_dir / "vietlott_655_index.json"
            title = "VIETLOTT POWER 6/55"
            unit = "kỳ"
        elif target_prod in ["645", "mega"]:
            idx_file = base_dir / "vietlott_645_index.json"
            title = "VIETLOTT MEGA 6/45"
            unit = "kỳ"
        else:
            idx_file = base_dir / "xsmb_index.json"
            title = "XSMB (LÔ GAN)"
            unit = "ngày"

        idx_data = _load_json_data(idx_file)
        if not idx_data or "top_gan" not in idx_data:
            return "⚠️ Không thể đọc dữ liệu lô gan lúc này."

        resp = f"⏳ <b>TOP 10 SỐ GAN LÌ NHẤT {title}</b>\n\n"
        for i, item in enumerate(idx_data["top_gan"][:10], 1):
            resp += f"{i}. Số <b>{item['number']}</b>: Chưa về <b>{item['days_since']}</b> {unit} (Kỷ lục: {item['max_gap']} {unit})\n"
        return resp

    # 7. /bacnho <số>
    if cmd in ["/bacnho", "bacnho"]:
        if not args:
            return "⚠️ Vui lòng nhập số cần tra cứu bạc nhớ. Ví dụ: <code>/bacnho 68</code>"
        target_num = args[0].zfill(2)
        bn_data = _load_json_data(base_dir / "bac_nho.json")
        if not bn_data or "by_loto" not in bn_data:
            return "⚠️ Chưa tải được dữ liệu Bạc Nhớ 20 năm."

        item = bn_data["by_loto"].get(target_num)
        if not item:
            return f"⚠️ Không có dữ liệu bạc nhớ cho số {target_num}."

        resp = f"🧠 <b>BẠC NHỚ 20 NĂM: KHI LÔ {target_num} VỀ HÔM NAY</b>\n"
        resp += f"📊 Đã ghi nhận {item.get('total_triggers', 0)} lần xuất hiện trong lịch sử.\n\n"
        resp += "<b>Những số có xác suất nổ cao nhất ngày kế tiếp:</b>\n"
        for f in item.get("top_followers", [])[:6]:
            rate_pct = f.get("rate", 0) * 100
            resp += f"• Số <b>{f['number']}</b>: nổ <b>{f['hits']}</b> lần ({rate_pct:.1f}%)\n"
        return resp

    # 8. /hot
    if cmd in ["/hot", "hot"]:
        target_prod = "vietlott_645" if (args and args[0] in ["645", "mega"]) else "vietlott_655"
        cooc = _load_json_data(base_dir / "vietlott_cooccurrence.json")
        if not cooc or target_prod not in cooc:
            return "⚠️ Chưa có dữ liệu ma trận đồng xuất hiện."

        pairs = cooc[target_prod].get("top_pairs", [])[:7]
        prod_name = "POWER 6/55" if target_prod == "vietlott_655" else "MEGA 6/45"
        resp = f"🔥 <b>TOP CẶP SỐ CÙNG VỀ NHIỀU NHẤT ({prod_name})</b>\n\n"
        for i, p in enumerate(pairs, 1):
            nums_str = " - ".join(p["numbers"])
            resp += f"{i}. Cặp [ <b>{nums_str}</b> ]: cùng về <b>{p['hits']}</b> kỳ\n"
        return resp

    # 9. /check <danh sách số>
    if cmd in ["/check", "check", "/tra", "tra"]:
        if not args:
            return "⚠️ Vui lòng nhập số cần kiểm tra. Ví dụ: <code>/check 68</code> hoặc <code>/check 07 18 24 35 41 55</code>"

        tokens = [t.zfill(2) for t in args if t.isdigit()]
        if not tokens:
            return "⚠️ Các số không hợp lệ. Vui lòng chỉ nhập số!"

        # A. Tra cứu Đơn Số (1 số)
        if len(tokens) == 1:
            num = tokens[0]
            xsmb_idx = _load_json_data(base_dir / "xsmb_index.json")
            v655_idx = _load_json_data(base_dir / "vietlott_655_index.json")

            resp = f"🎯 <b>KẾT QUẢ TRA CỨU NHANH CHO SỐ: {num}</b>\n\n"
            if xsmb_idx and "numbers" in xsmb_idx and num in xsmb_idx["numbers"]:
                xd = xsmb_idx["numbers"][num]
                resp += f"🔴 <b>XSMB:</b>\n"
                resp += f"• Tổng lần về: <b>{xd['total_hits']}</b> nháy (Đặc biệt: {xd.get('special_hits', 0)} lần)\n"
                resp += f"• Lần gần nhất: {xd['last_seen_date']} (cách đây <b>{xd['days_since_last']}</b> ngày)\n"
                resp += f"• Chu kỳ trung bình: <b>{xd['average_gap']}</b> ngày/lần (Kỷ lục gan: {xd['max_gap_historical']} ngày)\n\n"

            int_num = int(num)
            if v655_idx and "numbers" in v655_idx and 1 <= int_num <= 55 and num in v655_idx["numbers"]:
                vd = v655_idx["numbers"][num]
                resp += f"🟡 <b>Vietlott Power 6/55:</b>\n"
                resp += f"• Tổng lần về: <b>{vd['total_hits']}</b> kỳ\n"
                resp += f"• Lần gần nhất: {vd['last_seen_date']} (cách đây <b>{vd['days_since_last']}</b> ngày)\n"
                resp += f"• Kỷ lục gan: <b>{vd['max_gap_historical']}</b> ngày\n\n"

            resp += "👉 <i>Xem toàn bộ lịch sử chi tiết: https://thieucong98.github.io/vietnam-lottery-hub/</i>"
            return resp

        # B. Tra cứu Bộ Số (2 - 18 số) so khớp với Vietlott
        int_nums = [int(t) for t in tokens if 1 <= int(t) <= 55]
        if len(int_nums) >= 2:
            full_draws = _load_json_data(base_dir / "vietlott_full_draws.json")
            if not full_draws:
                return "⚠️ Không thể tải dữ liệu lịch sử Vietlott."

            combo_set = set(int_nums)
            draws_655 = full_draws.get("vietlott_655", [])
            jp1 = 0
            jp2 = 0
            p1 = 0
            p2 = 0
            p3 = 0

            for d in draws_655:
                main_hits = len([b for b in d.get("balls", []) if b in combo_set])
                special_hit = d.get("special") in combo_set if d.get("special") else False
                if main_hits >= 6:
                    jp1 += 1
                elif main_hits == 5 and special_hit:
                    jp2 += 1
                elif main_hits == 5:
                    p1 += 1
                elif main_hits == 4:
                    p2 += 1
                elif main_hits == 3:
                    p3 += 1

            balls_str = " - ".join(f"<b>{n:02d}</b>" for n in sorted(int_nums))
            ticket_type = f"Vé đơn 6 số" if len(int_nums) == 6 else f"Vé Bao {len(int_nums)}" if len(int_nums) > 6 else f"Tổ hợp {len(int_nums)} số"

            resp = f"🏆 <b>KẾT QUẢ SO KHỚP BỘ SỐ VIETLOTT POWER 6/55</b>\n"
            resp += f"Bộ số: [ {balls_str} ] ({ticket_type})\n"
            resp += f"Đã so khớp qua toàn bộ <b>{len(draws_655)}</b> kỳ quay lịch sử:\n\n"
            resp += f"🥇 <b>Jackpot 1 (6/6):</b> {jp1} lần\n"
            resp += f"🥈 <b>Jackpot 2 (5+1):</b> {jp2} lần\n"
            resp += f"⭐ <b>Giải Nhất (5/6):</b> {p1} lần\n"
            resp += f"🔹 <b>Giải Nhì (4/6):</b> {p2} lần\n"
            resp += f"🔸 <b>Giải Ba (3/6):</b> {p3} lần\n\n"
            resp += f"👉 <i>Kiểm tra tài chính & chi tiết từng kỳ: https://thieucong98.github.io/vietnam-lottery-hub/</i>"
            return resp

    return "⚠️ Lệnh không hợp lệ. Gõ <b>/help</b> để xem hướng dẫn sử dụng."

def run_telegram_bot_polling(data_dir: str = "web/public/data"):
    """Vòng lặp Long Polling nhận tin nhắn và phản hồi tức thì từ Telegram Bot"""
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.error("Chưa cấu hình biến môi trường TELEGRAM_BOT_TOKEN!")
        return

    logger.info("Khởi động Telegram Bot Long Polling Runner...")
    offset = None
    url = f"https://api.telegram.org/bot{token}/getUpdates"
    send_url = f"https://api.telegram.org/bot{token}/sendMessage"

    while True:
        try:
            params = {"timeout": 30}
            if offset is not None:
                params["offset"] = offset

            res = requests.get(url, params=params, timeout=35)
            if res.status_code != 200:
                logger.warning(f"Lỗi kết nối getUpdates: {res.status_code}")
                time.sleep(5)
                continue

            data = res.json()
            if not data.get("ok"):
                time.sleep(5)
                continue

            updates = data.get("result", [])
            for update in updates:
                offset = update["update_id"] + 1
                msg = update.get("message", {})
                chat_id = msg.get("chat", {}).get("id")
                text = msg.get("text", "")

                if chat_id and text:
                    logger.info(f"Nhận tin nhắn từ {chat_id}: '{text}'")
                    reply_html = handle_telegram_command(text, data_dir=data_dir)
                    requests.post(send_url, json={
                        "chat_id": chat_id,
                        "text": reply_html,
                        "parse_mode": "HTML",
                        "disable_web_page_preview": True
                    }, timeout=10)

        except requests.exceptions.RequestException as e:
            logger.warning(f"Lỗi mạng polling: {e}")
            time.sleep(5)
        except KeyboardInterrupt:
            logger.info("Dừng bot theo yêu cầu người dùng.")
            break
        except Exception as e:
            logger.error(f"Lỗi không xác định trong polling loop: {e}")
            time.sleep(3)

if __name__ == "__main__":
    if "--poll" in sys.argv:
        run_telegram_bot_polling()
    else:
        send_telegram_alert()
