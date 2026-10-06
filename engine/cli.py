import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from pathlib import Path
import typer
from loguru import logger

from engine.crawlers.xsmb import XSMBCrawler
from engine.crawlers.vietlott import VietlottCrawler
from engine.missing_detector import MissingDetector
from engine.analytics.index_builder import IndexBuilder
from engine.analytics.bac_nho_analyzer import BacNhoAnalyzer
from engine.analytics.vietlott_combination_analyzer import VietlottCombinationAnalyzer
from engine.ml.render_insights import generate_ml_insights
from engine.render_readme import render_readme

app = typer.Typer(help="CLI quản lý hệ thống dữ liệu Xổ số Việt Nam & Vietlott")

@app.command()
def sync_xsmb():
    """Cào và cập nhật kết quả XSMB mới nhất."""
    logger.info("Bắt đầu đồng bộ kết quả XSMB...")
    crawler = XSMBCrawler()
    added = crawler.sync_latest()
    typer.echo(f"Đã cập nhật {added} kỳ quay XSMB mới.")

@app.command()
def sync_vietlott(product: str = typer.Option("all", help="Sản phẩm cần sync: all, power_655, power_645, 3d, 3d_pro, keno")):
    """Cào và cập nhật kết quả Vietlott mới nhất."""
    crawler = VietlottCrawler()
    if product == "all":
        logger.info("Bắt đầu đồng bộ tất cả sản phẩm Vietlott...")
        added = crawler.sync_latest()
        typer.echo(f"Đã cập nhật tổng cộng {added} kỳ quay Vietlott.")
    else:
        logger.info(f"Bắt đầu đồng bộ Vietlott {product}...")
        added = crawler.sync_product(product, max_pages=3)
        typer.echo(f"Đã cập nhật {added} kỳ quay cho {product}.")

@app.command()
def backfill():
    """Tự động kiểm tra và cào bù các kỳ quay bị thiếu."""
    detector = MissingDetector()
    filled_xsmb = detector.backfill_xsmb()
    typer.echo(f"Đã bù {filled_xsmb} ngày XSMB.")

@app.command()
def build_index():
    """Xây dựng lại toàn bộ ma trận, phân tích lô gan và xuất chỉ mục tra cứu JSON."""
    builder = IndexBuilder()
    builder.build_all_indexes()
    
    logger.info("Phân tích Bạc Nhớ 20 năm...")
    BacNhoAnalyzer().analyze()
    
    logger.info("Phân tích Ma trận Bộ số & Đồng xuất hiện Vietlott...")
    VietlottCombinationAnalyzer().run()
    
    logger.info("Sinh dự đoán AI & Báo cáo Backtest...")
    generate_ml_insights()
    
    typer.echo("Đã hoàn tất xây dựng ma trận và xuất chỉ mục tra cứu!")

@app.command()
def run_all():
    """Chạy toàn bộ pipeline: Cào XSMB -> Cào Vietlott -> Bù thiếu -> Xây dựng chỉ mục & AI -> Render README."""
    logger.info("=== BẮT ĐẦU CHẠY TOÀN BỘ PIPELINE ===")
    sync_xsmb()
    sync_vietlott("all")
    backfill()
    build_index()
    logger.info("Cập nhật README.md...")
    render_readme()
    logger.info("=== HOÀN TẤT TOÀN BỘ PIPELINE ===")

if __name__ == "__main__":
    app()
