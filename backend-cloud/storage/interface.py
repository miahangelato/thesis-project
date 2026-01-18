"""Abstract storage interface for cloud-agnostic operations."""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional


class StorageInterface(ABC):
    """Abstract base class defining storage operations."""

    @abstractmethod
    def save_patient_record(self, record: Dict) -> str:
        """Save patient record, return record ID."""
        pass

    @abstractmethod
    def get_patient_record(self, record_id: str) -> Optional[Dict]:
        """Retrieve patient record by ID."""
        pass

    @abstractmethod
    def save_file(
        self, file_data: bytes, filename: str, folder: str = "reports"
    ) -> str:
        """Upload file, return URL."""
        pass

    @abstractmethod
    def get_file_url(self, filename: str, folder: str = "reports") -> str:
        """Get URL for existing file."""
        pass

    @abstractmethod
    def list_records(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """List patient records with pagination."""
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """Check storage backend connectivity."""
        pass
