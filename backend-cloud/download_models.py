"""Download ML models from GitHub releases for deployment."""

import logging
import os
import sys
from pathlib import Path

# Try to load .env file for local development
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import requests

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Model files to download
REQUIRED_MODELS = [
    "final_model_v3.pkl",
    "pattern_cnn_corrected.h5",
    "blood_type_triplet_embedding.h5",
    "blood_support_embeddings.npz",
]


def download_file(url: str, destination: Path, timeout: int = 120) -> bool:
    """Download a file from URL to destination path."""
    try:
        logger.info(f"Downloading {destination.name}...")
        
        # Add GitHub token if available (for private repos)
        headers = {}
        github_token = os.getenv("GITHUB_TOKEN")
        if github_token:
            headers['Authorization'] = f'token {github_token}'
            logger.info("Using GitHub token for authentication")
        
        response = requests.get(url, stream=True, timeout=timeout, headers=headers)
        
        if response.status_code == 404:
            logger.error(f"File not found (404): {url}")
            return False
        
        response.raise_for_status()
        
        # Get file size if available
        total_size = int(response.headers.get('content-length', 0))
        size_mb = total_size / (1024 * 1024) if total_size else 0
        
        if size_mb > 0:
            logger.info(f"  Size: {size_mb:.2f} MB")
        
        # Create parent directory if needed
        destination.parent.mkdir(parents=True, exist_ok=True)
        
        # Download with progress
        downloaded = 0
        with open(destination, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
        
        logger.info(f"  ✓ Downloaded successfully ({downloaded / (1024 * 1024):.2f} MB)")
        return True
        
    except requests.exceptions.RequestException as e:
        logger.error(f"  ✗ Download failed: {e}")
        return False


def download_models_from_storage():
    """Download all required models from configured storage."""
    # Base directory (same as in ml_service.py)
    base_dir = Path(__file__).parent.parent / "shared-models"
    base_dir.mkdir(parents=True, exist_ok=True)
    
    # Check for MODEL_STORAGE_URL first (direct URL to release downloads)
    storage_url = os.getenv("MODEL_STORAGE_URL")
    github_token = os.getenv("GITHUB_TOKEN")
    
    # Debug logging for token
    if github_token:
        logger.info("GITHUB_TOKEN found: " + github_token[:4] + "*" * 10 + github_token[-4:])
    else:
        logger.warning("GITHUB_TOKEN not found in environment variables!")
    
    if storage_url:
        logger.info(f"Using MODEL_STORAGE_URL: {storage_url}")
        
        # Extract repo info and normalize URL
        # Format: https://github.com/USER/REPO/releases/download/TAG
        # OR: https://github.com/USER/REPO/releases/tag/TAG
        
        # Fix /tag/ -> /download/ for base_url
        if "/releases/tag/" in storage_url:
            base_url = storage_url.replace("/releases/tag/", "/releases/download/")
            logger.info(f"Normalized URL (tag -> download): {base_url}")
        else:
            base_url = storage_url.rstrip("/")

        # Parse the URL to get owner, repo, and tag for API usage
        # Expected parts after removing https://github.com/: [owner, repo, 'releases', 'tag'|'download', tag]
        try:
            parts = storage_url.replace("https://github.com/", "").split("/")
            if len(parts) >= 5:
                owner = parts[0]
                repo = parts[1]
                # parts[2] is 'releases'
                # parts[3] is 'tag' or 'download'
                tag = parts[4]
                
                # Use GitHub API for private repos if token is present
                if github_token:
                    logger.info(f"Attempting GitHub Releases API for private repo: {owner}/{repo}@{tag}")
                    if download_from_github_api(owner, repo, tag, base_dir, github_token):
                        return True
                    logger.warning("GitHub API method failed, falling back to direct download...")
        except Exception as e:
            logger.warning(f"Failed to parse URL for API usage: {e}")
            
    else:
        # Fall back to GITHUB_REPO + MODELS_RELEASE_TAG
        github_repo = os.getenv("GITHUB_REPO", "miahangelato/thesis-project")
        github_tag = os.getenv("MODELS_RELEASE_TAG", "v1.0-models")
        base_url = f"https://github.com/{github_repo}/releases/download/{github_tag}"
        logger.info(f"Using GitHub: {github_repo} @ {github_tag}")
    
    logger.info(f"Target directory: {base_dir}")
    
    success_count = 0
    failed_models = []
    
    for model_file in REQUIRED_MODELS:
        destination = base_dir / model_file
        
        # Skip if already exists and has content
        if destination.exists() and destination.stat().st_size > 0:
            logger.info(f"✓ {model_file} already exists (skipping)")
            success_count += 1
            continue
        
        # Construct download URL
        url = f"{base_url}/{model_file}"
        
        if download_file(url, destination):
            success_count += 1
        else:
            failed_models.append(model_file)
    
    logger.info(f"\nDownload Summary: {success_count}/{len(REQUIRED_MODELS)} successful")
    
    if failed_models:
        logger.error(f"Failed to download: {', '.join(failed_models)}")
        logger.error("\nPlease ensure:")
        logger.error(f"1. MODEL_STORAGE_URL or GITHUB_REPO/MODELS_RELEASE_TAG is set correctly")
        logger.error(f"2. GitHub release is public and accessible")
        logger.error(f"3. All model files are uploaded to the release")
        return False
    
    logger.info("✓ All models downloaded successfully!")
    return True


def download_from_github_api(owner: str, repo: str, tag: str, base_dir: Path, token: str) -> bool:
    """Download release assets using GitHub API (for private repos)."""
    import requests
    
    # Get release info
    api_url = f"https://api.github.com/repos/{owner}/{repo}/releases/tags/{tag}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    try:
        logger.info(f"Fetching release info from GitHub API...")
        response = requests.get(api_url, headers=headers, timeout=30)
        response.raise_for_status()
        release_data = response.json()
        
        assets = release_data.get("assets", [])
        logger.info(f"Found {len(assets)} assets in release")
        
        success_count = 0
        failed_models = []
        
        for model_file in REQUIRED_MODELS:
            destination = base_dir / model_file
            
            # Skip if already exists
            if destination.exists() and destination.stat().st_size > 0:
                logger.info(f"✓ {model_file} already exists (skipping)")
                success_count += 1
                continue
            
            # Find the asset
            asset = next((a for a in assets if a["name"] == model_file), None)
            if not asset:
                logger.error(f"Asset not found in release: {model_file}")
                failed_models.append(model_file)
                continue
            
            # Download using asset URL
            asset_url = asset["url"]
            logger.info(f"Downloading {model_file}...")
            
            # Download with Accept header for asset content
            download_headers = {
                "Authorization": f"token {token}",
                "Accept": "application/octet-stream"
            }
            
            response = requests.get(asset_url, headers=download_headers, stream=True, timeout=120)
            response.raise_for_status()
            
            # Save file
            destination.parent.mkdir(parents=True, exist_ok=True)
            downloaded = 0
            with open(destination, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
            
            logger.info(f"  ✓ Downloaded successfully ({downloaded / (1024 * 1024):.2f} MB)")
            success_count += 1
        
        logger.info(f"\nDownload Summary: {success_count}/{len(REQUIRED_MODELS)} successful")
        
        if failed_models:
            logger.error(f"Failed to download: {', '.join(failed_models)}")
            return False
        
        logger.info("✓ All models downloaded successfully!")
        return True
        
    except Exception as e:
        logger.error(f"GitHub API download failed: {e}")
        return False


if __name__ == "__main__":
    success = download_models_from_storage()
    sys.exit(0 if success else 1)
