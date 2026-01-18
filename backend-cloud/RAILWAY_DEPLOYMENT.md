# Railway Deployment Configuration Guide

## Current Issue
You're seeing `DisallowedHost` errors even though `ALLOWED_HOSTS` is set in Railway.

## Root Cause
The `ALLOWED_HOSTS=*` wildcard wasn't being properly interpreted by Django's settings parser.

## Solution Applied
Updated `config/settings.py` to:
1. Properly handle the `*` wildcard for `ALLOWED_HOSTS`
2. Automatically detect and add Railway's public domain
3. Strip whitespace from comma-separated values

## Railway Environment Variables Setup

### Required Variables

Go to your Railway project → **backend-cloud service** → **Variables** tab and set:

```bash
# Security Settings
DEBUG=False
SECRET_KEY=<generate-a-long-random-string>

# Host Configuration
# Option 1: Allow all hosts (simpler, less secure)
ALLOWED_HOSTS=*

# Option 2: Specific domains (more secure, recommended)
# ALLOWED_HOSTS=thesis-project-be-production.up.railway.app,yourdomain.com

# CSRF & CORS Protection
# Production URL (required)
CSRF_TRUSTED_ORIGINS=https://thesis-project-5tu3.vercel.app
CORS_ALLOWED_ORIGINS=https://thesis-project-5tu3.vercel.app

# For Vercel Preview Deployments:
# The backend now automatically allows all Vercel preview URLs matching:
# https://thesis-project-5tu3-*.vercel.app
# 
# If you need CSRF protection for previews, add each preview URL manually:
# CSRF_TRUSTED_ORIGINS=https://thesis-project-5tu3.vercel.app,https://thesis-project-5tu3-preview123.vercel.app

# Database (Railway PostgreSQL or Supabase)
DATABASE_URL=${{Postgres.DATABASE_URL}}
# OR for Supabase:
# DATABASE_URL=postgres://postgres:[PASSWORD]@[HOST]:[PORT]/postgres

# Model Storage (GitHub Releases)
MODEL_STORAGE_URL=https://github.com/miahangelato/thesis-project/releases/download/v1.0-models
```

### Important Notes

1. **DEBUG Mode**: The logs show you're running with `DEBUG=True`. This is **DANGEROUS** in production!
   - Make sure `DEBUG=False` is set in Railway

2. **ALLOWED_HOSTS Format**:
   - Use `*` to allow all hosts (easier but less secure)
   - OR use comma-separated domains: `domain1.com,domain2.com` (no spaces!)

3. **CSRF_TRUSTED_ORIGINS**:
   - Must include `https://` prefix
   - Comma-separated, no spaces
   - Should match your Vercel frontend URL

4. **Railway Auto-Detection**:
   - The updated code automatically adds Railway's domain from `RAILWAY_PUBLIC_DOMAIN`
   - You don't need to manually add `*.up.railway.app` domains

## Deployment Steps

1. **Update Railway Variables**:
   - Go to Railway dashboard
   - Select your backend service
   - Click "Variables" tab
   - Add/update the variables above
   - **Most Important**: Set `DEBUG=False`

2. **Commit and Push Changes**:
   ```bash
   cd "M:\Thesis Project\backend-cloud"
   git add config/settings.py env.production.example
   git commit -m "Fix ALLOWED_HOSTS wildcard handling and Railway domain detection"
   git push
   ```

3. **Railway will auto-deploy** the new code

4. **Verify the deployment**:
   - Check Railway logs for any errors
   - Test your API endpoint: `https://thesis-project-be-production.up.railway.app/api/health/`
   - Should return 200 OK without DisallowedHost errors

## Troubleshooting

### Still seeing DisallowedHost errors?

1. **Check Railway Variables**:
   - Ensure `ALLOWED_HOSTS=*` is set (no quotes, no spaces)
   - Verify `DEBUG=False`

2. **Check Railway Logs**:
   - Look for: "ALLOWED_HOSTS = ['*']" in startup logs
   - Should NOT see "DEBUG = True"

3. **Force Redeploy**:
   - In Railway dashboard, click "Deploy" → "Redeploy"

### CORS Errors from Frontend?

Make sure these match your Vercel URL:
```bash
CORS_ALLOWED_ORIGINS=https://your-actual-vercel-url.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-actual-vercel-url.vercel.app
```

## Security Recommendations

For production, use explicit domains instead of `*`:

```bash
ALLOWED_HOSTS=thesis-project-be-production.up.railway.app,api.yourdomain.com
```

This is more secure and prevents host header injection attacks.
