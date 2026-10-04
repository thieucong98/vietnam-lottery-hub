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
from engine.ml.render_insights import generate_ml_insights

def main():
    logger.info("==================================================")
    logger.info("   VIETNAM LOTTERY & VIETLOTT PIPELINE RUNNER     ")
    logger.info("==================================================")

    # 1. Sync XSMB
    logger.info("Bước 1/5: Đồng bộ kết quả XSMB...")
    try:
        xsmb_crawler = XSMBCrawler()
        n_xsmb = xsmb_crawler.sync_latest()
        logger.info(f"-> XSMB: Đã thêm {n_xsmb} ngày mới.")
    except Exception as e:
        logger.error(f"Lỗi khi cào XSMB: {e}")

    # 2. Sync Vietlott
    logger.info("Bước 2/5: Đồng bộ các sản phẩm Vietlott...")
    try:
        viet_crawler = VietlottCrawler()
        n_viet = viet_crawler.sync_latest()
        logger.info(f"-> Vietlott: Đã thêm {n_viet} kỳ quay mới.")
    except Exception as e:
        logger.error(f"Lỗi khi cào Vietlott: {e}")

    # 3. Missing backfill
    logger.info("Bước 3/5: Kiểm tra và cào bù các kỳ bị thiếu...")
    try:
        detector = MissingDetector()
        filled = detector.backfill_xsmb(max_days=5)
        logger.info(f"-> Đã bù {filled} kỳ.")
    except Exception as e:
        logger.warning(f"Lỗi kiểm tra kỳ thiếu: {e}")

    # 4. Build Indexes & Parquet
    logger.info("Bước 4/5: Xây dựng ma trận thưa và chỉ mục tra cứu tốc độ cao...")
    try:
        builder = IndexBuilder()
        builder.build_all_indexes()
        logger.info("-> Xây dựng ma trận và chỉ mục thành công.")
    except Exception as e:
        logger.error(f"Lỗi khi xây dựng chỉ mục: {e}")

    # 5. Bac Nho 20 years
    logger.info("Bước 5/7: Phân tích ma trận Bạc Nhớ 20 năm...")
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
