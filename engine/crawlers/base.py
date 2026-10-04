from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import date

class BaseLotteryCrawler(ABC):
    """Lớp trừu tượng cho tất cả crawler xổ số."""

    @abstractmethod
    def fetch_date(self, selected_date: date) -> Optional[Dict[str, Any]]:
        """Cào kết quả cho một ngày cụ thể."""
        pass

    @abstractmethod
    def sync_latest(self) -> int:
        """Đồng bộ các kết quả mới nhất cho đến ngày hôm nay. Trả về số kỳ quay mới cào được."""
        pass
