"""Storage abstraction layer for cloud-agnostic data operations."""

import os


def get_storage():
    """Factory function returning configured storage backend."""
    backend = os.getenv("STORAGE_BACKEND", "supabase")

    if backend == "supabase":
        from .supabase_storage import SupabaseStorage  # noqa: PLC0415

        return SupabaseStorage()
    elif backend == "aws":
        from .aws_storage import AWSStorage  # noqa: PLC0415

        return AWSStorage()
    elif backend == "local":
        from .local_storage import LocalStorage  # noqa: PLC0415

        return LocalStorage()
    else:
        raise ValueError(f"Unknown storage backend: '{backend}'")


__all__ = ["get_storage"]
