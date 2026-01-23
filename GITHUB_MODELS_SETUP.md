# GitHub Models Setup Guide
## Download Models from Private GitHub Repo to Railway

**You generated token!** ✅  
Now follow these steps:

---

## 📦 **Step 1: Create GitHub Release with Models**

1. **Go to your GitHub repo:**
   ```
   https://github.com/your-username/your-repo
   ```

2. **Create new release:**
   ```
   Click: Releases → Create a new release
   
   Tag: v1.0
   Release title: ML Models v1.0
   Description: Machine learning models for diabetes prediction
   ```

3. **Upload model files:**
   ```
   Drag and drop:
   - final_model_v3.pkl
   - pattern_cnn.h5
   - blood_group_embedding_model.h5
   - blood_group_classifier_model.h5
   - Any other .pkl or .h5 files
   ```

4. **Publish release**

---

## 🔗 **Step 2: Get Download URLs**

After publishing, click on each file to get URLs:

```
Example URLs (replace with yours):
https://github.com/username/repo/releases/download/v1.0/final_model_v3.pkl
https://github.com/username/repo/releases/download/v1.0/pattern_cnn.h5
```

**Base URL** (remove filename):
```
https://github.com/username/repo/releases/download/v1.0/
```

---

## ⚙️ **Step 3: Set Railway Environment Variables**

Go to Railway Dashboard → Variables → Add:

```bash
# Your GitHub token (the one you just generated)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Base URL for model downloads
MODEL_STORAGE_URL=https://github.com/username/repo/releases/download/v1.0/

# Your other variables:
BACKEND_API_KEY=Cmq3Q67MswXwe_whijC-UzfYLCB4tVKuUS_kNAwy89A
DJANGO_SECRET_KEY=U0fZm7awWk9NtEIynpknHB_APck-yfGpNzriVO1tUr3Gr7xaiD77jpC8Po_gtkA4wrk
GEMINI_API_KEY=your-gemini-key
DEBUG=False
```

---

## ✅ **Step 4: Verify It Works**

After deploying to Railway:

1. **Check Railway logs:**
   ```
   Should see:
   "Using GitHub token for authenticated download"
   "✓ Downloaded final_model_v3.pkl"
   "✓ Downloaded pattern_cnn.h5"
   ```

2. **If you see errors:**
   ```
   401 Unauthorized: Token is wrong or expired
   404 Not Found: URL is wrong
   403 Forbidden: Token doesn't have repo access
   ```

---

## 🔒 **Security Notes**

### ✅ **DO:**
- Keep GITHUB_TOKEN in Railway environment variables
- Use "classic" Personal Access Token
- Give only "repo" scope (read access)
- Set expiration to 1 year (or no expiration)

### ❌ **DON'T:**
- Commit token to GitHub
- Share token publicly
- Use token with more permissions than needed

---

## 💰 **Cost Estimate**

**GitHub Releases:**
- ✅ FREE for public and private repos
- ✅ Unlimited downloads
- ✅ No bandwidth costs

**Railway:**
- First download: ~$0.20 (one-time)
- After cached: $0 (uses local files)
- **Total monthly: $1-2** (within FREE $5 credit!)

---

## 🚀 **Alternative: Git LFS** (if files > 100MB each)

If your models are very large:

```bash
# 1. Install Git LFS
git lfs install

# 2. Track model files
git lfs track "*.pkl"
git lfs track "*.h5"
git add .gitattributes

# 3. Add models
git add models/
git commit -m "Add models via LFS"
git push

# 4. Get raw URLs
https://github.com/username/repo/raw/main/models/final_model_v3.pkl
```

**Railway setup (same):**
```bash
GITHUB_TOKEN=ghp_xxx
MODEL_STORAGE_URL=https://github.com/username/repo/raw/main/models/
```

---

## 📋 **Quick Checklist**

- [ ] GitHub token generated (ghp_xxx...)
- [ ] GitHub release created with models uploaded
- [ ] URLs tested (click file in release)
- [ ] GITHUB_TOKEN set in Railway
- [ ] MODEL_STORAGE_URL set in Railway
- [ ] Code updated (ml_service.py) ✅ Done!
- [ ] Deployed to Railway
- [ ] Models downloaded successfully (check logs)

---

## 🆘 **Troubleshooting**

### **Error: "Failed to download: 401"**
**Fix:** Check GITHUB_TOKEN is correct, regenerate if needed

### **Error: "Failed to download: 404"**
**Fix:** Check MODEL_STORAGE_URL matches your release URL exactly

### **Error: "Download failed: timeout"**
**Fix:** Models too large, increase timeout or use Git LFS

### **Models not loading**
**Fix:** Check Railway logs, verify file names match exactly

---

**You're all set!** 🎉  
Your code now supports downloading from private GitHub repos using the token!
