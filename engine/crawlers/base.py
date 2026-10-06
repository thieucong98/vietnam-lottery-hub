from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import date

class BaseLotteryCrawler(ABC):
    """Lớp trừu tượng cơ sở cho tất cả crawler xổ số (Universal Contract)."""

    @abstractmethod
    def sync_latest(self) -> int:
        """Đồng bộ các kết quả mới nhất cho đến ngày hôm nay. Trả về số kỳ quay mới cào được."""
        pass

class DateIndexedCrawler(BaseLotteryCrawler):
    """Crawler dành cho các đài xổ số quay theo ngày cố định (ví dụ: XSMB)."""

    @abstractmethod
    def fetch_date(self, selected_date: date) -> Optional[Dict[str, Any]]:
        """Cào kết quả cho một ngày cụ thể."""
        pass

class DrawIndexedCrawler(BaseLotteryCrawler):
    """Crawler dành cho các đài xổ số quay theo kỳ mở thưởng / phân trang (ví dụ: Vietlott)."""

    @abstractmethod
    def fetch_page(self, product: str, page_index: int = 0) -> List[Dict[str, Any]]:
        """Cào kết quả theo sản phẩm và chỉ mục trang."""
        pass
