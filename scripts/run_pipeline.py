#!/usr/bin/env python
import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from loguru import logger
from engine.crawlers.xsmb import XSMBCrawler
from engine.crawlers.vietlott import VietlottCrawler
from engine.missing_detector import MissingDetector
from engine.analytics.index_builder import IndexBuilder
import os
from pathlib import Path
from engine.ml.render_insights import generate_ml_insights

def write_github_output(name: str, value: str):
    """Ghi biến đầu ra vào GITHUB_OUTPUT nếu đang chạy trên GitHub Actions."""
    gh_output = os.environ.get("GITHUB_OUTPUT")
    if gh_output and os.path.exists(gh_output):
        try:
            with open(gh_output, "a", encoding="utf-8") as f:
                f.write(f"{name}={value}\n")
        except Exception as e:
            logger.warning(f"Không thể ghi vào GITHUB_OUTPUT: {e}")

def main():
    force_run = "--force" in sys.argv
    summary_file = Path("web/public/data/summary.json")

    logger.info("==================================================")
    logger.info("   VIETNAM LOTTERY & VIETLOTT PIPELINE RUNNER     ")
    logger.info("==================================================")

    # 1. Sync XSMB
    logger.info("Bước 1/8: Đồng bộ kết quả XSMB...")
    n_xsmb = 0
    try:
        xsmb_crawler = XSMBCrawler()
        n_xsmb = xsmb_crawler.sync_latest()
        logger.info(f"-> XSMB: Đã thêm {n_xsmb} ngày mới.")
    except Exception as e:
        logger.error(f"Lỗi khi cào XSMB: {e}")

    # 2. Sync Vietlott
    logger.info("Bước 2/8: Đồng bộ các sản phẩm Vietlott...")
    n_viet = 0
    try:
        viet_crawler = VietlottCrawler()
        n_viet = viet_crawler.sync_latest()
        logger.info(f"-> Vietlott: Đã thêm {n_viet} kỳ quay mới.")
    except Exception as e:
        logger.error(f"Lỗi khi cào Vietlott: {e}")

    # 3. Missing backfill
    logger.info("Bước 3/8: Kiểm tra và cào bù các kỳ bị thiếu...")
    filled = 0
    try:
        detector = MissingDetector()
        filled = detector.backfill_xsmb(max_days=5)
        logger.info(f"-> Đã bù {filled} kỳ.")
    except Exception as e:
        logger.warning(f"Lỗi kiểm tra kỳ thiếu: {e}")

    total_new = n_xsmb + n_viet + filled
    has_summary = summary_file.exists()

    if total_new == 0 and not force_run and has_summary:
        logger.info("⚡ Không có kỳ quay mới nào phát sinh và tệp chỉ mục đã đầy đủ.")
        logger.info("-> Tự động dừng sớm (Fast Exit) để tiết kiệm thời gian & tài nguyên.")
        write_github_output("has_new_data", "false")
        return

    logger.info(f"🔔 Phát hiện {total_new} kỳ quay mới hoặc kích hoạt chế độ bắt buộc (force={force_run}). Tiến hành phân tích toàn diện...")
    write_github_output("has_new_data", "true")

    # 4. Build Indexes & Parquet
    logger.info("Bước 4/8: Xây dựng ma trận thưa và chỉ mục tra cứu tốc độ cao...")
    try:
        builder = IndexBuilder()
        builder.build_all_indexes()
        logger.info("-> Xây dựng ma trận và chỉ mục thành công.")
    except Exception as e:
        logger.error(f"Lỗi khi xây dựng chỉ mục: {e}")

    # 5. Bac Nho 20 years
    logger.info("Bước 5/8: Phân tích ma trận Bạc Nhớ 20 năm...")
    try:
        from engine.analytics.bac_nho_analyzer import BacNhoAnalyzer
        analyzer = BacNhoAnalyzer()
        analyzer.analyze()
        logger.info("-> Xuất dữ liệu Bạc Nhớ 20 năm thành công.")
    except Exception as e:
        logger.error(f"Lỗi khi phân tích Bạc Nhớ: {e}")

    # 6. Vietlott Full Draws & Combination Matrix
    logger.info("Bước 6/8: Phân tích bộ số và ma trận cặp/bộ ba Vietlott...")
    try:
        from engine.analytics.vietlott_combination_analyzer import VietlottCombinationAnalyzer
        v_analyzer = VietlottCombinationAnalyzer()
        v_analyzer.run()
        logger.info("-> Xuất dữ liệu bộ số và cặp/bộ ba Vietlott thành công.")
    except Exception as e:
        logger.error(f"Lỗi khi phân tích bộ số Vietlott: {e}")

    # 7. ML Insights & Backtest
    logger.info("Bước 7/8: Phân tích chiến lược AI/ML và đo lường Backtest...")
    try:
        generate_ml_insights()
        logger.info("-> Xuất báo cáo AI & Backtest thành công.")
    except Exception as e:
        logger.error(f"Lỗi khi tạo dự đoán ML: {e}")

    # 8. Render README
    logger.info("Bước 8/8: Cập nhật bảng kết quả sống động vào README.md...")
    try:
        from engine.render_readme import render_readme
        render_readme()
        logger.info("-> Đã cập nhật README.md thành công.")
    except Exception as e:
        logger.error(f"Lỗi khi cập nhật README: {e}")

    logger.info("==================================================")
    logger.info("       PIPELINE ĐÃ HOÀN TẤT THÀNH CÔNG!           ")
    logger.info("==================================================")

if __name__ == "__main__":
    main()
