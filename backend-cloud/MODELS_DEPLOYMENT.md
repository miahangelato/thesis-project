# ML Models Deployment Guide

This document explains how to set up ML models for deployment on Railway.

## Overview

The backend requires 6 ML model files that are too large to commit to Git:
1. `final_no_age_model.pkl` - Diabetes prediction model
2. `final_no_age_scaler.pkl` - Feature scaler for diabetes model
3. `final_no_age_imputer.pkl` - Feature imputer for diabetes model
4. `improved_pattern_cnn_model_retrained.h5` - Fingerprint pattern recognition CNN
5. `blood_type_triplet_embedding.h5` - Blood group prediction model
6. `blood_support_embeddings.npz` - Pre-computed support set embeddings

## Setup Instructions

### Option 1: GitHub Releases (Recommended)

1. **Create a GitHub Release**
   ```bash
   # Tag your models release
   git tag models-v1.0
   git push origin models-v1.0
   ```

2. **Upload Model Files to Release**
   - Go to your GitHub repository
   - Click on "Releases" → "Create a new release"
   - Choose tag: `models-v1.0`
   - Upload all 6 model files as release assets
   - Publish the release

3. **Configure Railway Environment Variables**
   Set these in your Railway project settings:
   ```
   GITHUB_REPO=miahangelo/thesis-project-be
   MODELS_RELEASE_TAG=models-v1.0
   ```

The `download_models.py` script will automatically download models during deployment.

### Option 2: Direct URL (Alternative)

If you have models hosted elsewhere (e.g., Google Drive, S3, etc.):

1. **Set the MODEL_STORAGE_URL environment variable** in Railway:
   ```
   MODEL_STORAGE_URL=https://your-storage-url.com/models/
   ```

2. The `ml_service.py` will download files from `{MODEL_STORAGE_URL}/{filename}`

## Local Development

For local development, place the model files in:
```
backend-cloud/shared-models/
├── final_no_age_model.pkl
├── final_no_age_scaler.pkl
├── final_no_age_imputer.pkl
├── improved_pattern_cnn_model_retrained.h5
├── blood_type_triplet_embedding.h5
└── blood_support_embeddings.npz
```

These files are git-ignored to avoid bloating the repository.

## Deployment Process

When you deploy to Railway:

1. **Build Phase**: Railway builds your Docker container
2. **Release Phase** (defined in `Procfile`):
   - `download_models.py` downloads models from GitHub releases
   - `collectstatic` gathers static files
3. **Run Phase**: Gunicorn starts the Django server

If model download fails, check Railway logs and verify:
- GitHub repository is public or Railway has access
- Release tag exists
- All model files are uploaded to the release

## Troubleshooting

### Models Not Downloading
- Check Railway logs for error messages
- Verify `GITHUB_REPO` and `MODELS_RELEASE_TAG` environment variables
- Ensure GitHub release is public (or provide a GitHub token)

### Out of Memory During Model Loading
- Models are lazy-loaded on first API request
- Consider upgrading Railway plan if needed
- Check TensorFlow/Keras memory usage

### Models Already Exist Warning
- This is normal - the script skips downloading existing files
- To force re-download, delete models from Railway's persistent storage
