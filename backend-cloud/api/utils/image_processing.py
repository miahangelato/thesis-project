"""Image processing utilities for fingerprint handling."""

import base64
import io
import logging

import numpy as np
from PIL import Image

from ..constants import (
    ALLOWED_IMAGE_FORMATS,
    MAX_IMAGE_SIZE_BYTES,
    MAX_IMAGE_SIZE_MB,
)
from ..exceptions import ImageSizeLimitError, InvalidImageError, NoValidImagesError

logger = logging.getLogger(__name__)


def decode_base64_image(b64_string: str) -> np.ndarray:
    """
    Decode a base64 string to numpy array.

    Args:
        b64_string: Base64 encoded image string (with or without data URI prefix)

    Returns:
        numpy.ndarray: Decoded image as numpy array

    Raises:
        InvalidImageError: If image cannot be decoded or is invalid
        ImageSizeLimitError: If image exceeds size limit
    """
    try:
        # Remove data URI prefix if present
        if "," in b64_string:
            b64_string = b64_string.split(",", 1)[1]

        # Decode base64
        img_bytes = base64.b64decode(b64_string)

        # Check file size
        size_mb = len(img_bytes) / (1024 * 1024)
        if len(img_bytes) > MAX_IMAGE_SIZE_BYTES:
            raise ImageSizeLimitError(size_mb, MAX_IMAGE_SIZE_MB)

        # Open and validate image
        img = Image.open(io.BytesIO(img_bytes))

        # Validate format
        if img.format and img.format not in ALLOWED_IMAGE_FORMATS:
            raise InvalidImageError(
                f"Unsupported format: {img.format}. Allowed: {ALLOWED_IMAGE_FORMATS}"
            )

        # Convert to numpy array
        img_array = np.array(img)

        # Validate dimensions
        if img_array.ndim not in [2, 3]:
            raise InvalidImageError(f"Invalid image dimensions: {img_array.shape}")

        logger.debug(f"Decoded image: shape={img_array.shape}, size={size_mb:.2f}MB")
        return img_array

    except base64.binascii.Error as e:
        raise InvalidImageError(f"Invalid base64 encoding: {e!s}") from e
    except OSError as e:
        raise InvalidImageError(f"Cannot open image: {e!s}") from e
    except Exception as e:
        if isinstance(e, (InvalidImageError, ImageSizeLimitError)):
            raise
        raise InvalidImageError(f"Image decoding failed: {e!s}") from e


def decode_base64_images(b64_strings: list[str]) -> list[np.ndarray]:
    """
    Decode multiple base64 images, skipping invalid ones.

    Args:
        b64_strings: List of base64 encoded image strings

    Returns:
        list[np.ndarray]: List of decoded images as numpy arrays

    Raises:
        NoValidImagesError: If no valid images could be decoded
    """
    images = []
    errors = []

    for idx, b64_string in enumerate(b64_strings):
        try:
            img_array = decode_base64_image(b64_string)
            images.append(img_array)
        except (InvalidImageError, ImageSizeLimitError) as e:
            logger.warning(f"Failed to decode image {idx}: {e}")
            errors.append((idx, str(e)))
            continue

    if len(images) == 0:
        raise NoValidImagesError()

    logger.info(f"Decoded {len(images)}/{len(b64_strings)} images successfully")
    return images


def decode_fingerprints_from_dict(fingerprints_dict: dict) -> list[np.ndarray]:
    """
    Decode fingerprints from a dictionary of finger names to base64 images.

    Args:
        fingerprints_dict: Dict mapping finger names to base64 images

    Returns:
        list[np.ndarray]: List of decoded fingerprint images

    Raises:
        NoValidImagesError: If no valid images could be decoded
    """
    b64_images = list(fingerprints_dict.values())
    return decode_base64_images(b64_images)
