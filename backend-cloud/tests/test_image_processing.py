"""Tests for image processing utilities."""

import base64
import io

import numpy as np
import pytest
from PIL import Image

from api.exceptions import InvalidImageError, NoValidImagesError
from api.utils.image_processing import (
    decode_base64_image,
    decode_base64_images,
    decode_fingerprints_from_dict,
)


class TestDecodeBase64Image:
    """Tests for decode_base64_image function."""

    def create_test_image(self, size=(100, 100), format="PNG"):
        """Helper to create a test image as base64."""
        img = Image.new("RGB", size, color="blue")
        buffer = io.BytesIO()
        img.save(buffer, format=format)
        img_bytes = buffer.getvalue()
        b64_string = base64.b64encode(img_bytes).decode("utf-8")
        return b64_string

    def test_decode_valid_image(self):
        """Test decoding a valid base64 image."""
        b64_image = self.create_test_image()
        result = decode_base64_image(b64_image)

        assert isinstance(result, np.ndarray)
        assert result.shape == (100, 100, 3)

    def test_decode_image_with_data_uri(self):
        """Test decoding image with data URI prefix."""
        b64_image = self.create_test_image()
        data_uri = f"data:image/png;base64,{b64_image}"

        result = decode_base64_image(data_uri)

        assert isinstance(result, np.ndarray)
        assert result.shape == (100, 100, 3)

    def test_decode_invalid_base64(self):
        """Test decoding invalid base64 string."""
        with pytest.raises(InvalidImageError, match="Invalid base64 encoding"):
            decode_base64_image("not-a-valid-base64-string!!!")

    def test_decode_corrupted_image(self):
        """Test decoding corrupted image data."""
        # Valid base64 but not an image
        invalid_data = base64.b64encode(b"not an image").decode("utf-8")

        with pytest.raises(InvalidImageError, match="Cannot open image"):
            decode_base64_image(invalid_data)


class TestDecodeBase64Images:
    """Tests for decode_base64_images function."""

    def create_test_image(self, size=(100, 100)):
        """Helper to create a test image as base64."""
        img = Image.new("RGB", size, color="red")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        img_bytes = buffer.getvalue()
        return base64.b64encode(img_bytes).decode("utf-8")

    def test_decode_multiple_valid_images(self):
        """Test decoding multiple valid images."""
        images = [self.create_test_image() for _ in range(3)]

        result = decode_base64_images(images)

        assert len(result) == 3
        assert all(isinstance(img, np.ndarray) for img in result)

    def test_decode_with_some_invalid(self):
        """Test decoding with some invalid images (should skip them)."""
        valid_image = self.create_test_image()
        invalid_image = "invalid-base64"
        images = [valid_image, invalid_image, valid_image]

        result = decode_base64_images(images)

        # Should return 2 valid images
        assert len(result) == 2

    def test_decode_all_invalid(self):
        """Test decoding when all images are invalid."""
        invalid_images = ["invalid1", "invalid2", "invalid3"]

        with pytest.raises(NoValidImagesError):
            decode_base64_images(invalid_images)


class TestDecodeFingerprintsFromDict:
    """Tests for decode_fingerprints_from_dict function."""

    def create_test_image(self):
        """Helper to create a test image as base64."""
        img = Image.new("L", (200, 200), color=128)  # Grayscale
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        img_bytes = buffer.getvalue()
        return base64.b64encode(img_bytes).decode("utf-8")

    def test_decode_fingerprints_dict(self):
        """Test decoding fingerprints from dictionary."""
        fingerprints = {
            "thumb_left": self.create_test_image(),
            "index_left": self.create_test_image(),
            "middle_left": self.create_test_image(),
        }

        result = decode_fingerprints_from_dict(fingerprints)

        assert len(result) == 3
        assert all(isinstance(img, np.ndarray) for img in result)
