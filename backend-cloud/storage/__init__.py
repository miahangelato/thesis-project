"""Storage abstraction layer for cloud-agnostic data operations."""

import os

def get_storage():
    """Factory function returning configured storage backend."""
    backend = os.getenv("STORAGE_BACKEND", "supabase")
    
    if backend == "supabase":
        from .supabase_storage import SupabaseStorage
        return SupabaseStorage()
    elif backend == "aws":
        from .aws_storage import AWSStorage
        return AWSStorage()
    else:
        raise ValueError(f"Unknown storage backend: '{backend}'")

__all__ = ['get_storage']
