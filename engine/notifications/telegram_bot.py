import html
import os
import sys
import json
import time
from pathlib import Path
import requests
from loguru import logger

from engine.notifications.subscriptions import PRODUCTS as SUB_PRODUCTS, SubscriptionStore, parse_products
from engine.notifications.ticket_check import VIETLOTT, check_ticket_lines

WEB_URL = "https://thieucong98.github.io/vietnam-lottery-hub/"

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
        msg += f"⭐ <b>Giải Đặc Biệt:</b> <code>{special}</code> (2 số cuối: <b>{special_2d}</b>)\n"
        msg += f"🥇 <b>Giải Nhất:</b> <code>{prize1}</code>\n"

        loto_list = xsmb.get("loto_numbers", [])
        counts = {}
        for num in loto_list:
            counts[num] = counts.get(num, 0) + 1
        multi_hits = [f"{num} ({c} lần)" for num, c in sorted(counts.items()) if c >= 2]
        if multi_hits:
            msg += f"🔁 <b>Số xuất hiện từ 2 lần:</b> {', '.join(multi_hits)}\n"

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

    # Vietlott Max 3D
    v3d = summary_data.get("vietlott_3d_latest", {})
    if v3d and "result" in v3d:
        p_special = v3d["result"].get("Giải Đặc biệt", [])
        if p_special:
            msg += f"🎲 <b>VIETLOTT MAX 3D:</b> ĐB <code>{' - '.join(p_special)}</code>\n\n"

    msg += "👉 <b>Tra cứu 20 năm & Thống kê xác suất:</b> https://thieucong98.github.io/vietnam-lottery-hub/\n"
    msg += "⚖️ <i>Dữ liệu thống kê XSKT & Vietlott hợp pháp. Chơi có trách nhiệm (18+).</i>"
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

def handle_telegram_command(
    cmd_text: str,
    data_dir: str = "web/public/data",
    chat_id: int | str | None = None,
    store: SubscriptionStore | None = None,
) -> str:
    """Xử lý lệnh từ người dùng và trả về nội dung HTML để phản hồi.

    chat_id/store chỉ cần cho /dangky, /huydangky (đăng ký nhận kết quả là opt-in).
    """
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
            "🤖 <b>BOT TRA CỨU KẾT QUẢ XỔ SỐ & VIETLOTT</b>\n\n"
            "<b>Kết quả</b>\n"
            "🔴 <b>/xsmb</b> - Kết quả XSMB mới nhất\n"
            "🟡 <b>/power</b> hoặc <b>/655</b> - Power 6/55 mới nhất\n"
            "🔵 <b>/mega</b> hoặc <b>/645</b> - Mega 6/45 mới nhất\n"
            "🟢 <b>/keno</b> - Keno mới nhất\n"
            "🎲 <b>/3d</b> hoặc <b>/max3d</b> - Max 3D & Max 3D Pro\n"
            "📅 <b>/lichquay</b> - Lịch quay và giá trị Jackpot\n\n"
            "<b>Dò vé</b>\n"
            "🎫 <b>/dove &lt;vé&gt;</b> - Dò vé theo cơ cấu giải (VD: <code>/dove 74129</code>, <code>/dove 655 2026-11-10 01 02 21 38 39 51</code>). "
            "Trên web, mục <b>Vé của tôi</b> có nút sao chép lệnh dò cho các vé đã lưu.\n\n"
            "<b>Thống kê mô tả dữ liệu lịch sử</b>\n"
            "🎯 <b>/check &lt;các số&gt;</b> - Thống kê một số, hoặc số lần một bộ số từng trùng các kỳ Power 6/55\n"
            "⏳ <b>/gan [xsmb|655|645]</b> - 10 số lâu chưa về nhất\n"
            "🧠 <b>/bacnho &lt;số&gt;</b> - Thống kê có điều kiện: số xuất hiện ngày kế tiếp sau số này\n"
            "🔥 <b>/hot [655|645]</b> - Các cặp số cùng xuất hiện nhiều nhất\n\n"
            "<b>Nhận kết quả (tự chọn)</b>\n"
            "🔔 <b>/dangky [xsmb|655|645]</b> - Đăng ký nhận kết quả khi có kỳ mới\n"
            "🔕 <b>/huydangky</b> - Hủy đăng ký, xóa thông tin đăng ký\n\n"
            "🌐 <b>/web</b> - Trang web • ⚖️ <b>/legal</b> - Pháp lý • 💚 <b>/trachnhiem</b> - Chơi có trách nhiệm\n\n"
            "<i>Dữ liệu cập nhật tự động sau giờ quay, có thể chậm hoặc sai sót.</i>\n\n"
            "⚠️ <b>Lưu ý:</b> Chỉ thống kê dữ liệu lịch sử của XSKT & Vietlott hợp pháp. Không có công cụ nào làm tăng xác suất trúng "
            f"(Power 6/55 Jackpot 1: {VIETLOTT['vietlott_655']['odds']}; Mega 6/45: {VIETLOTT['vietlott_645']['odds']}). "
            "Nghiêm cấm sử dụng cho lô đề, cờ bạc bất hợp pháp. Chỉ dành cho người từ 18 tuổi.\n\n"
            "🔎 Kết quả chính thức: https://vietlott.vn/ • https://xosothudo.com.vn/"
        )

    # 1b. /trachnhiem: công cụ chơi có trách nhiệm
    if cmd in ["/trachnhiem", "/ngansach", "/responsible"]:
        return (
            "💚 <b>CHƠI CÓ TRÁCH NHIỆM</b>\n\n"
            "• Xổ số là trò chơi giải trí, giá trị kỳ vọng của mỗi vé thấp hơn giá vé. Chỉ dùng số tiền bạn chấp nhận mất.\n"
            "• Đặt trước ngân sách mỗi tháng và dừng khi hết; không vay mượn, không mua thêm để gỡ.\n"
            "• Trang web có công cụ tự đặt ngân sách và ghi chép chi tiêu, dữ liệu chỉ lưu trên máy của bạn:\n"
            f"{WEB_URL}#/choi-co-trach-nhiem\n\n"
            "Nếu thấy khó kiểm soát việc chơi, hãy nói với người thân hoặc tìm bác sĩ, chuyên gia tâm lý. Khẩn cấp: gọi 115."
        )

    # 2. /legal hoặc /policy
    if cmd in ["/legal", "/policy", "/dieukhoan"]:
        return (
            "⚖️ <b>CHÍNH SÁCH PHÁP LÝ & CHƠI CÓ TRÁCH NHIỆM (18+)</b>\n\n"
            "1. <b>Tính Hợp Pháp Của Xổ Số Nhà Nước:</b> Xổ số kiến thiết truyền thống và Xổ số điện toán Vietlott là hoạt động vui chơi giải trí hợp pháp tại Việt Nam (theo Nghị định 30/2007/NĐ-CP, Thông tư 75/2013/TT-BTC, Quyết định 1108/QĐ-TTg).\n\n"
            "2. <b>Nghiêm Cấm Lô Đề Bất Hợp Pháp:</b> Nền tảng <b>tuyệt đối không liên quan, không cổ súy và nghiêm cấm</b> việc sử dụng dữ liệu vào hành vi lô đề, cờ bạc ngầm (vi phạm Điều 321, 322 Bộ luật Hình sự 2015 & Nghị định 144/2021/NĐ-CP).\n\n"
            "3. <b>Mục Đích Học Thuật:</b> Toàn bộ thuật toán chỉ nhằm phân tích thống kê xác suất dữ liệu lịch sử, không có giá trị cam kết hay đảm bảo kết quả tương lai.\n\n"
            "4. <b>Chơi Có Trách Nhiệm:</b> Chỉ dành cho người từ đủ 18 tuổi trở lên. Tuyệt đối không vay mượn để tham gia các trò chơi may rủi.\n\n"
            "📄 Xem toàn văn: https://github.com/thieucong98/vietnam-lottery-hub/blob/main/LEGAL_DISCLAIMER.md"
        )

    # 3. /web
    if cmd in ["/web", "/link"]:
        return (
            "🌐 <b>NỀN TẢNG TRA CỨU & PHÂN TÍCH XỔ SỐ CHUYÊN NGHIỆP</b>\n\n"
            "👉 Truy cập ngay tại: https://thieucong98.github.io/vietnam-lottery-hub/\n\n"
            "⚡ Tra cứu kết quả, dò vé, lịch quay và thống kê XSMB, Vietlott 6/55, 6/45, Max 3D, Keno, miễn phí và không cần tài khoản."
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
        resp += f"⭐ <b>Giải Đặc Biệt:</b> <code>{spec}</code> (2 số cuối: <b>{spec_2d}</b>)\n"
        resp += f"🥇 <b>Giải Nhất:</b> <code>{p1}</code>\n\n"

        loto = x.get("loto_numbers", [])
        counts = {}
        for num in loto:
            counts[num] = counts.get(num, 0) + 1
        multi = [f"<b>{num}</b> ({c} lần)" for num, c in sorted(counts.items()) if c >= 2]
        if multi:
            resp += f"🔁 <b>Số xuất hiện từ 2 lần:</b> {', '.join(multi)}\n\n"

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

    # 6. /keno
    if cmd in ["/keno", "keno"]:
        summary = _load_json_data(base_dir / "summary.json")
        if not summary or "vietlott_keno_latest" not in summary:
            return "⚠️ Chưa có dữ liệu Keno mới nhất."
        k = summary["vietlott_keno_latest"]
        res = k.get("result", [])
        if not res:
            return "⚠️ Dữ liệu 20 số Keno chưa sẵn sàng."

        balls = [f"{b:02d}" for b in res]
        total_sum = sum(res)
        even_cnt = len([b for b in res if b % 2 == 0])
        odd_cnt = len(res) - even_cnt
        small_cnt = len([b for b in res if b <= 40])
        big_cnt = len(res) - small_cnt

        sum_verdict = "Tài (Lớn hơn 810)" if total_sum > 810 else "Xỉu (Nhỏ hơn 810)" if total_sum < 810 else "Hòa (Đúng 810)"
        cl_verdict = f"Chẵn ({even_cnt} số)" if even_cnt > odd_cnt else f"Lẻ ({odd_cnt} số)" if odd_cnt > even_cnt else "Chẵn Lẻ Hòa (10-10)"

        resp = f"🟢 <b>VIETLOTT KENO - KỲ {k.get('id', '')}</b>\n"
        resp += f"📅 Ngày mở thưởng: {k.get('date', '')}\n\n"
        resp += f"🎯 <b>20 số mở thưởng:</b>\n<code>{' '.join(balls)}</code>\n\n"
        resp += f"📊 <b>Thuộc tính kỳ quay:</b>\n"
        resp += f"• Tổng điểm 20 bóng: <b>{total_sum}</b> ➔ <b>{sum_verdict}</b>\n"
        resp += f"• Phân bố Chẵn/Lẻ: <b>{cl_verdict}</b>\n"
        resp += f"• Tỷ lệ Lớn/Nhỏ: <b>{small_cnt} số (01-40)</b> | <b>{big_cnt} số (41-80)</b>\n\n"
        resp += f"👉 <i>Thử vé Bậc 1-10 & Thống kê Keno: https://thieucong98.github.io/vietnam-lottery-hub/</i>"
        return resp

    # 7. /3d hoặc /max3d [pro]
    if cmd in ["/3d", "/max3d", "3d", "max3d", "/3dpro", "/max3dpro"]:
        is_pro = (cmd in ["/3dpro", "/max3dpro"]) or (args and args[0].lower() in ["pro", "3dpro"])
        summary = _load_json_data(base_dir / "summary.json")
        if not summary:
            return "⚠️ Chưa có dữ liệu Max 3D mới nhất."

        target_key = "vietlott_3d_pro_latest" if is_pro else "vietlott_3d_latest"
        title = "VIETLOTT MAX 3D PRO" if is_pro else "VIETLOTT MAX 3D"
        d3 = summary.get(target_key)
        if not d3 or "result" not in d3:
            return f"⚠️ Chưa có dữ liệu {title} mới nhất."

        res = d3["result"]
        resp = f"🎲 <b>{title} - KỲ #{d3.get('id', '')}</b>\n"
        resp += f"📅 Ngày mở thưởng: {d3.get('date', '')}\n\n"

        special = " - ".join(f"<code>{x}</code>" for x in res.get("Giải Đặc biệt", []))
        p1 = " - ".join(f"<code>{x}</code>" for x in res.get("Giải Nhất", []))
        p2 = " - ".join(f"<code>{x}</code>" for x in res.get("Giải Nhì", []))
        p3 = " - ".join(f"<code>{x}</code>" for x in res.get("Giải ba", []))

        resp += f"⭐ <b>Giải Đặc Biệt:</b>\n{special}\n\n"
        resp += f"🥇 <b>Giải Nhất:</b>\n{p1}\n\n"
        resp += f"🥈 <b>Giải Nhì:</b>\n{p2}\n\n"
        resp += f"🥉 <b>Giải Ba:</b>\n{p3}\n\n"
        if not is_pro:
            resp += "💡 <i>Mẹo: Gõ <code>/3d pro</code> để xem kết quả Max 3D Pro!</i>\n"
        resp += "👉 <i>Tra cứu tần suất 3D & cơ cấu giải: https://thieucong98.github.io/vietnam-lottery-hub/</i>"
        return resp

    # 8. /gan
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

        resp = f"⏳ <b>10 SỐ LÂU CHƯA VỀ NHẤT (GAN) {title}</b>\n\n"
        for i, item in enumerate(idx_data["top_gan"][:10], 1):
            resp += f"{i}. Số <b>{item['number']}</b>: Chưa về <b>{item['days_since']}</b> {unit} (Kỷ lục: {item['max_gap']} {unit})\n"
        resp += "\n<i>Thống kê lịch sử. Số lâu chưa về không có khả năng về cao hơn ở kỳ sau.</i>"
        return resp

    # 7. /bacnho <số>
    if cmd in ["/bacnho", "bacnho"]:
        if not args:
            return "⚠️ Vui lòng nhập số cần tra cứu bạc nhớ. Ví dụ: <code>/bacnho 68</code>"
        if not args[0].isdigit():
            escaped_val = html.escape(args[0])
            return f"⚠️ Giá trị '<code>{escaped_val}</code>' không hợp lệ. Vui lòng chỉ nhập số từ 00 đến 99!"
        target_num = args[0].zfill(2)
        bn_data = _load_json_data(base_dir / "bac_nho.json")
        if not bn_data or "by_loto" not in bn_data:
            return "⚠️ Chưa tải được dữ liệu Bạc Nhớ 20 năm."

        item = bn_data["by_loto"].get(target_num)
        if not item:
            return f"⚠️ Không có dữ liệu bạc nhớ cho số <b>{target_num}</b>."

        resp = f"🧠 <b>THỐNG KÊ CÓ ĐIỀU KIỆN (BẠC NHỚ): SAU NHỮNG NGÀY CÓ SỐ {target_num}</b>\n"
        resp += f"📊 Cỡ mẫu: {item.get('total_triggers', 0)} ngày có số {target_num}.\n\n"
        resp += "<b>Tỷ lệ ngày kế tiếp có số (so với tần suất nền của một ngày bất kỳ):</b>\n"
        for f in item.get("top_followers", [])[:6]:
            # "rate" và "base_rate" đã là phần trăm
            base = f" | nền {f['base_rate']:.1f}%" if "base_rate" in f else ""
            resp += f"• Số <b>{f['number']}</b>: {f['hits']} lần ({f.get('rate', 0):.1f}%{base})\n"
        resp += "\n<i>Thống kê lịch sử. Các kỳ quay độc lập, tỷ lệ có điều kiện không cho biết trước kết quả và không làm tăng xác suất trúng.</i>"
        return resp

    # 8. /hot
    if cmd in ["/hot", "hot"]:
        target_prod = "vietlott_645" if (args and args[0] in ["645", "mega"]) else "vietlott_655"
        cooc = _load_json_data(base_dir / "vietlott_cooccurrence.json")
        if not cooc or target_prod not in cooc:
            return "⚠️ Chưa có dữ liệu ma trận đồng xuất hiện."

        pairs = cooc[target_prod].get("top_pairs", [])[:7]
        prod_name = "POWER 6/55" if target_prod == "vietlott_655" else "MEGA 6/45"
        resp = f"🔥 <b>CÁC CẶP SỐ CÙNG XUẤT HIỆN NHIỀU NHẤT ({prod_name})</b>\n\n"
        for i, p in enumerate(pairs, 1):
            nums_str = " - ".join(p["numbers"])
            resp += f"{i}. Cặp [ <b>{nums_str}</b> ]: cùng về <b>{p['hits']}</b> kỳ\n"
        resp += "\n<i>Thống kê lịch sử, không làm tăng xác suất trúng.</i>"
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
                resp += f"• Tổng lần về: <b>{xd['total_hits']}</b> lần (Đặc biệt: {xd.get('special_hits', 0)} lần)\n"
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

            resp = f"📊 <b>THỐNG KÊ LỊCH SỬ BỘ SỐ VIETLOTT POWER 6/55</b>\n"
            resp += f"Bộ số: [ {balls_str} ] ({ticket_type})\n"
            resp += f"Đã so khớp qua toàn bộ <b>{len(draws_655)}</b> kỳ quay lịch sử:\n\n"
            resp += f"🥇 <b>Jackpot 1 (6/6):</b> {jp1} lần\n"
            resp += f"🥈 <b>Jackpot 2 (5+1):</b> {jp2} lần\n"
            resp += f"⭐ <b>Giải Nhất (5/6):</b> {p1} lần\n"
            resp += f"🔹 <b>Giải Nhì (4/6):</b> {p2} lần\n"
            resp += f"🔸 <b>Giải Ba (3/6):</b> {p3} lần\n\n"
            resp += f"<i>Đây là số kỳ trong quá khứ bộ số từng trùng, không phải dò vé. Dò vé một kỳ: /dove. Xác suất Jackpot 1 của một vé 6 số: {VIETLOTT['vietlott_655']['odds']}.</i>\n"
            resp += f"👉 <i>Chi tiết từng kỳ: {WEB_URL}</i>"
            return resp

    # 10. /dove: dò vé theo cơ cấu giải. Mỗi dòng sau lệnh là một vé; bot không lưu vé.
    if cmd in ["/dove", "dove"]:
        lines = text.splitlines()
        first_rest = lines[0].split(maxsplit=1)[1:] if lines else []
        ticket_lines = first_rest + lines[1:]
        recent = _load_json_data(base_dir / "xsmb_recent_draws.json") or []
        full = _load_json_data(base_dir / "vietlott_full_draws.json") or {}
        return check_ticket_lines(
            ticket_lines,
            recent if isinstance(recent, list) else [],
            {"vietlott_655": full.get("vietlott_655", []), "vietlott_645": full.get("vietlott_645", [])},
        )

    # 11. /lichquay hoặc /jackpot
    if cmd in ["/lichquay", "/lich", "/jackpot"]:
        return format_schedule_message(_load_json_data(base_dir / "jackpot.json"))

    # 12. /dangky, /huydangky: đăng ký nhận kết quả (opt-in)
    if cmd in ["/dangky", "/subscribe"]:
        if store is None or chat_id is None:
            return "⚠️ Bot đang chạy ở chế độ không hỗ trợ đăng ký."
        products = parse_products(args)
        if products is None:
            return "⚠️ Mã không hợp lệ. Dùng: <code>/dangky</code> (tất cả) hoặc <code>/dangky xsmb 655 645</code>."
        store.subscribe(chat_id, products)
        names = ", ".join(SUB_PRODUCTS[p]["label"] for p in products)
        return (
            f"🔔 Đã đăng ký nhận kết quả: <b>{names}</b>.\n"
            "Bot chỉ lưu mã cuộc trò chuyện và các trò chơi bạn chọn, để gửi kết quả khi có kỳ mới. "
            "Gõ /huydangky bất cứ lúc nào để hủy và xóa thông tin này."
        )
    if cmd in ["/huydangky", "/unsubscribe", "/stop"]:
        if store is None or chat_id is None:
            return "⚠️ Bot đang chạy ở chế độ không hỗ trợ đăng ký."
        if store.unsubscribe(chat_id):
            return "🔕 Đã hủy đăng ký và xóa thông tin đăng ký của bạn."
        return "Bạn chưa đăng ký nhận kết quả."

    return "⚠️ Lệnh không hợp lệ. Gõ <b>/help</b> để xem hướng dẫn sử dụng."


# Lịch quay theo giờ Việt Nam (0 = Thứ Hai theo datetime.weekday), giống web/src/utils/drawSchedule.ts
DRAW_SCHEDULE = [
    ("XSMB", "Hằng ngày", 18, 15, set(range(7))),
    ("Power 6/55", "Thứ Ba, Thứ Năm, Thứ Bảy", 18, 0, {1, 3, 5}),
    ("Mega 6/45", "Thứ Tư, Thứ Sáu, Chủ Nhật", 18, 0, {2, 4, 6}),
    ("Max 3D", "Thứ Hai, Thứ Tư, Thứ Sáu", 18, 0, {0, 2, 4}),
    ("Max 3D Pro", "Thứ Ba, Thứ Năm, Thứ Bảy", 18, 0, {1, 3, 5}),
]
WEEKDAY_VN = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]


def next_draw(days: set[int], hour: int, minute: int, now=None):
    from datetime import datetime, timedelta
    from zoneinfo import ZoneInfo

    tz = ZoneInfo("Asia/Ho_Chi_Minh")
    now = now or datetime.now(tz)
    for i in range(8):
        d = (now + timedelta(days=i)).date()
        at = datetime(d.year, d.month, d.day, hour, minute, tzinfo=tz)
        if d.weekday() in days and at > now:
            return at
    return None


def _vnd(v) -> str:
    return f"{int(v):,}".replace(",", ".") + "đ"


def format_schedule_message(jackpot: dict | None, now=None) -> str:
    resp = "📅 <b>LỊCH QUAY (GIỜ VIỆT NAM)</b>\n\n"
    for label, days_label, hour, minute, days in DRAW_SCHEDULE:
        nxt = next_draw(days, hour, minute, now)
        when = f"{WEEKDAY_VN[nxt.weekday()]} {nxt:%d/%m} lúc {nxt:%H:%M}" if nxt else "?"
        resp += f"• <b>{label}</b> ({days_label}, {hour:02d}:{minute:02d}): kỳ tới {when}\n"
    resp += "\n🏆 <b>JACKPOT</b>\n"
    for key, label in [("vietlott_655", "Power 6/55"), ("vietlott_645", "Mega 6/45")]:
        latest = ((jackpot or {}).get(key) or {}).get("latest")
        if latest:
            jp2 = f", Jackpot 2: {_vnd(latest['jackpot2'])}" if latest.get("jackpot2") else ""
            resp += f"• {label} kỳ #{latest['id']} ({latest['date']}): Jackpot 1 <b>{_vnd(latest['jackpot1'])}</b>{jp2}\n"
        else:
            resp += f"• {label}: chưa có dữ liệu, xem https://vietlott.vn/\n"
    resp += (
        f"\n<i>Xác suất Jackpot 1 của một vé 6 số không đổi theo giá trị Jackpot: Power 6/55 {VIETLOTT['vietlott_655']['odds']}, "
        f"Mega 6/45 {VIETLOTT['vietlott_645']['odds']}. Lịch có thể thay đổi dịp Tết.</i>"
    )
    return resp


def format_subscription_message(product: str, summary: dict, data_dir: str = "web/public/data") -> str:
    cmd = SUB_PRODUCTS[product]["command"]
    body = handle_telegram_command(cmd, data_dir=data_dir)
    return body + "\n\n🔕 <i>Bạn nhận tin này vì đã đăng ký. Gõ /huydangky để hủy.</i>"


MAX_RETRY_AFTER = 30  # giây, chặn trên thời gian chờ khi Telegram trả 429

def _retry_after(res) -> int:
    try:
        value = int(res.json().get("parameters", {}).get("retry_after", 1))
    except Exception:
        value = 1
    return max(1, min(value, MAX_RETRY_AFTER))

def send_subscription_updates(token: str, data_dir: str, store: SubscriptionStore, post=None, sleep=None) -> int:
    """Gửi kết quả kỳ mới cho người đã đăng ký. Trả về số tin đã gửi."""
    post = post or requests.post
    sleep = sleep or time.sleep
    summary = _load_json_data(Path(data_dir) / "summary.json") or {}
    due = store.due_products(summary)
    if not due:
        return 0
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    sent = 0
    for product in due:
        text = format_subscription_message(product, summary, data_dir)
        for chat_id, products in store.subscribers().items():
            if product not in products:
                continue
            payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML", "disable_web_page_preview": True}
            try:
                res = post(url, json=payload, timeout=10)
                status = getattr(res, "status_code", 200)
                if status == 429:
                    # Telegram giới hạn tốc độ: chờ theo retry_after rồi gửi lại một lần
                    sleep(_retry_after(res))
                    res = post(url, json=payload, timeout=10)
                    status = getattr(res, "status_code", 200)
                if status == 403:
                    # Người dùng đã chặn bot: xóa đăng ký
                    store.unsubscribe(chat_id)
                elif status == 200:
                    sent += 1
                else:
                    logger.warning(f"Gửi kết quả đăng ký thất bại: HTTP {status}")
            except requests.exceptions.RequestException as e:
                logger.warning(f"Lỗi gửi kết quả đăng ký: {e}")
        store.mark_sent(product, summary)
    return sent

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
    store = SubscriptionStore()
    last_broadcast_check = 0.0

    while True:
        try:
            # Kiểm tra kỳ mới cho người đã đăng ký mỗi 5 phút
            if time.time() - last_broadcast_check > 300:
                last_broadcast_check = time.time()
                try:
                    n = send_subscription_updates(token, data_dir, store)
                    if n:
                        logger.info(f"Đã gửi {n} tin kết quả cho người đăng ký.")
                except Exception as e:
                    logger.warning(f"Lỗi gửi tin đăng ký: {e}")

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
                    # Không ghi nội dung tin nhắn vào log (có thể chứa số vé)
                    logger.info(f"Nhận lệnh {text.split()[0][:20]!r}")
                    reply_html = handle_telegram_command(text, data_dir=data_dir, chat_id=chat_id, store=store)
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
