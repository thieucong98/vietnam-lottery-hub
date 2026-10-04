from abc import ABC, abstractmethod
from typing import List, Set
import numpy as np

class BaseStrategy(ABC):
    """Lớp chiến lược dự đoán cơ sở."""

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def predict(self, history: List[List[int]], k: int = 6, max_number: int = 55) -> List[int]:
        """Dự đoán k số có khả năng xuất hiện cao nhất dựa trên lịch sử các kỳ quay trước đó."""
        pass
