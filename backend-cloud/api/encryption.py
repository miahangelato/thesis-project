import base64
import logging
import os

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)


class EncryptionManager:
    """
    Handles application-level encryption for sensitive patient data.
    Uses Fernet (AES-128 in CBC mode with SHA256 HMAC) for symmetric encryption.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        key = os.getenv("E2E_ENCRYPTION_KEY")
        if not key:
            # For development safety, warn heavily but allow fallback or error
            # In production, this should hard fail.
            logger.warning(
                "⚠️ E2E_ENCRYPTION_KEY not set! Using insecure dummy key for DEV only."
            )
            key = "insecure_dev_key_DO_NOT_USE_IN_PROD"

        # Derive a secure key if provided key is not readily 32 url-safe base64 bytes
        # or just use it as a passphrase to derive the actual key
        salt = os.getenv("E2E_SALT", "default_salt_change_me").encode()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key_bytes = base64.urlsafe_b64encode(kdf.derive(key.encode()))
        self.cipher = Fernet(key_bytes)
        logger.info("🔐 EncryptionManager initialized")

    def encrypt_value(self, value: str | int | float) -> str:
        """Encrypt a single value. Returns URL-safe base64 string."""
        if value is None:
            return None
        return self.cipher.encrypt(str(value).encode()).decode()

    def decrypt_value(self, encrypted_value: str) -> str:
        """Decrypt a single value. Returns string."""
        if not encrypted_value:
            return None
        try:
            return self.cipher.decrypt(encrypted_value.encode()).decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return None

    def encrypt_data(self, data: dict, sensitive_fields: list[str]) -> dict:
        """
        Encrypts specified fields in a dictionary.
        Returns a NEW dictionary with encrypted values for those fields.
        Original data is left untouched.
        """
        encrypted_data = data.copy()
        for field in sensitive_fields:
            if field in encrypted_data and encrypted_data[field] is not None:
                encrypted_data[field] = self.encrypt_value(encrypted_data[field])
        return encrypted_data


def get_encryption_manager():
    return EncryptionManager()
