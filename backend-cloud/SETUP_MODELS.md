# Quick Setup: ML Models Deployment

## 🎯 What You Need to Do

You need to upload your ML model files to a GitHub release so Railway can download them during deployment.

## 📋 Step-by-Step Instructions

### Step 1: Locate Your Model Files
Find these 6 files on your local machine (they should be in `shared-models/` directory):
```
✓ final_no_age_model.pkl
✓ final_no_age_scaler.pkl  
✓ final_no_age_imputer.pkl
✓ improved_pattern_cnn_model_retrained.h5
✓ blood_type_triplet_embedding.h5
✓ blood_support_embeddings.npz
```

### Step 2: Create a GitHub Release
1. Go to https://github.com/miahangelo/thesis-project-be/releases
2. Click **"Create a new release"**
3. Click **"Choose a tag"** and type: `models-v1.0`
4. Select **"Create new tag: models-v1.0 on publish"**
5. Title: `ML Models v1.0`
6. Description: `Machine learning models for diabetes and blood group prediction`

### Step 3: Upload Model Files
1. In the release editor, scroll to **"Attach binaries"**
2. Drag and drop all 6 model files (or click to browse)
3. Wait for all uploads to complete
4. Click **"Publish release"**

### Step 4: Configure Railway Environment Variables
1. Go to your Railway dashboard
2. Open your `thesis-project-be` project
3. Go to **"Variables"** tab
4. Add these two variables:
   ```
   GITHUB_REPO=miahangelo/thesis-project-be
   MODELS_RELEASE_TAG=models-v1.0
   ```
5. Click **"Save"**

### Step 5: Trigger Redeploy
Railway should automatically redeploy after the variable changes. If not:
1. Go to **"Deployments"** tab
2. Click the three dots menu
3. Select **"Redeploy"**

## ✅ Verification

After deployment, check Railway logs. You should see:
```
INFO: Downloading models from GitHub: miahangelo/thesis-project-be @ models-v1.0
INFO: Target directory: /app/shared-models
INFO: Downloading final_no_age_model.pkl...
INFO:   ✓ Downloaded successfully
...
INFO: ✓ All models downloaded successfully!
```

## ❓ Troubleshooting

### Error: "File not found (404)"
- Make sure the GitHub release is **public**
- Verify all 6 files are attached to the release
- Check the release tag name matches exactly: `models-v1.0`

### Error: "Repository not accessible"
- If your repo is private, you may need to use a GitHub Personal Access Token
- Or make the repository public temporarily for deployment

### Models Already Downloaded
- This is normal on subsequent deployments
- The script skips files that already exist

## 📚 More Information

See `MODELS_DEPLOYMENT.md` for detailed documentation.
