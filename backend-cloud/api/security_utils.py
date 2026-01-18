"""Security utilities for input sanitization and validation."""

import html
import re
from typing import Any


def sanitize_html(text: str) -> str:
    """Escape HTML special characters to prevent XSS attacks.
    
    Args:
        text: Raw text that may contain HTML
        
    Returns:
        HTML-escaped text safe for display
    """
    if not text:
        return ""
    return html.escape(str(text))


def sanitize_ai_content(content: str) -> str:
    """Sanitize AI-generated content for safe display.
    
    This function:
    - Escapes HTML tags
    - Removes potentially dangerous patterns
    - Preserves newlines and basic formatting
    
    Args:
        content: AI-generated text content
        
    Returns:
        Sanitized content safe for frontend display
    """
    if not content:
        return ""
    
    # Convert to string if needed
    text = str(content)
    
    # Remove any script tags (shouldn't happen with AI, but defense in depth)
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove any onclick, onerror, etc. event handlers
    text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
    
    # Escape HTML special characters
    text = html.escape(text)
    
    # Preserve newlines (they're safe after escaping)
    text = text.replace('\\n', '\n')
    
    return text


def validate_uuid(value: str) -> bool:
    """Validate UUID v4 format to prevent path traversal.
    
    Args:
        value: String to validate
        
    Returns:
        True if valid UUID format, False otherwise
    """
    uuid_pattern = r'^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
    return bool(re.match(uuid_pattern, value.lower()))


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal attacks.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename safe for file system operations
    """
    # Remove path separators
    filename = filename.replace('/', '').replace('\\', '')
    
    # Remove null bytes
    filename = filename.replace('\x00', '')
    
    # Keep only alphanumeric, dash, underscore, and dot
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    
    # Prevent hidden files
    if filename.startswith('.'):
        filename = '_' + filename[1:]
    
    return filename[:255]  # Filesystem limit


def validate_base64_image(data: str, max_size_mb: int = 10) -> bool:
    """Validate base64 encoded image data.
    
    Args:
        data: Base64 encoded string
        max_size_mb: Maximum allowed size in MB
        
    Returns:
        True if valid, False otherwise
    """
    import base64
    
    try:
        # Remove data URI prefix if present
        if ',' in data:
            data = data.split(',')[1]
        
        # Try to decode
        decoded = base64.b64decode(data)
        
        # Check size
        size_mb = len(decoded) / (1024 * 1024)
        if size_mb > max_size_mb:
            return False
        
        return True
    except Exception:
        return False
