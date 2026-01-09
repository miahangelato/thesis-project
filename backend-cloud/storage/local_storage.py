"""Local filesystem implementation of the storage interface.

Used for local development/testing when you don't want to depend on Supabase.

Files are written under a media root (default: backend-cloud/media) and can be
served by Django in DEBUG via MEDIA_URL (/media/).

URLs are built from a backend base URL. If PUBLIC_BASE_URL is not set, it
defaults to http://localhost:8000.
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from .interface import StorageInterface


class LocalStorage(StorageInterface):
    def __init__(self):
        media_root = os.getenv("LOCAL_MEDIA_ROOT")
        self.media_root = (
            Path(media_root)
            if media_root
            else Path(__file__).resolve().parent.parent / "media"
        )

        # What base URL clients should use to fetch media files.
        # Kept as localhost by default (per current request).
        self.public_base_url = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000").rstrip(
            "/"
        )

        self.records_dir = self.media_root / "records"

    def _ensure_dir(self, path: Path) -> None:
        path.mkdir(parents=True, exist_ok=True)

    def _file_url(self, folder: str, filename: str) -> str:
        folder_clean = folder.strip("/")
        filename_clean = filename.lstrip("/")
        return f"{self.public_base_url}/media/{folder_clean}/{filename_clean}"

    def save_patient_record(self, record: Dict) -> str:
        self._ensure_dir(self.records_dir)

        record_id = record.get("id")
        if not record_id:
            record_id = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")

        record_path = self.records_dir / f"{record_id}.json"
        payload = {**record}
        payload.setdefault("created_at", datetime.utcnow().isoformat())

        record_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return str(record_id)

    def get_patient_record(self, record_id: str) -> Optional[Dict]:
        record_path = self.records_dir / f"{record_id}.json"
        if not record_path.exists():
            return None
        try:
            return json.loads(record_path.read_text(encoding="utf-8"))
        except Exception:
            return None

    def save_file(self, file_data: bytes, filename: str, folder: str = "reports") -> str:
        folder_path = self.media_root / folder
        self._ensure_dir(folder_path)

        file_path = folder_path / filename
        file_path.write_bytes(file_data)

        return self._file_url(folder, filename)

    def get_file_url(self, filename: str, folder: str = "reports") -> str:
        file_path = self.media_root / folder / filename
        if not file_path.exists():
            raise FileNotFoundError(filename)
        return self._file_url(folder, filename)

    def list_records(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        if not self.records_dir.exists():
            return []

        files = sorted(
            self.records_dir.glob("*.json"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        sliced = files[offset : offset + limit]

        records: List[Dict] = []
        for path in sliced:
            try:
                records.append(json.loads(path.read_text(encoding="utf-8")))
            except Exception:
                continue
        return records

    def health_check(self) -> bool:
        try:
            self._ensure_dir(self.media_root)
            return True
        except Exception:
            return False
