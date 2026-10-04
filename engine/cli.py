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
from engine.ml.render_insights import generate_ml_insights

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
    generate_ml_insights()
    typer.echo("Đã hoàn tất xây dựng ma trận và xuất chỉ mục tra cứu!")

@app.command()
def run_all():
    """Chạy toàn bộ pipeline: Cào XSMB -> Cào Vietlott -> Bù thiếu -> Xây dựng chỉ mục & AI."""
    logger.info("=== BẮT ĐẦU CHẠY TOÀN BỘ PIPELINE ===")
    sync_xsmb()
    sync_vietlott("all")
    backfill()
    build_index()
    logger.info("=== HOÀN TẤT TOÀN BỘ PIPELINE ===")

if __name__ == "__main__":
    app()
