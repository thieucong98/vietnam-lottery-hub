from abc import ABC, abstractmethod
from typing import List, Set
import numpy as np

class BaseStrategy(ABC):
    """Lớp chiến lược chọn bộ số mẫu cơ sở (chỉ minh họa thống kê)."""

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def pick(self, history: List[List[int]], k: int = 6, max_number: int = 55) -> List[int]:
        """Chọn k số theo quy tắc của thuật toán trên dữ liệu lịch sử.

        Kết quả chỉ để minh họa: các kỳ quay là biến cố độc lập, nên bộ số này
        không làm tăng xác suất trúng so với chọn ngẫu nhiên.
        """
        pass
