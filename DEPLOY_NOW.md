# 🎯 PRE-DEPLOYMENT ACTION ITEMS
## What You Need to Do Before Deploying

**Status**: ✅ Critical issues FIXED, ready for final steps

---

## ✅ COMPLETED AUTOMATICALLY

1. **✅ Removed hardcoded API key** from `test_security.py`
2. **✅ Enhanced .gitignore** with production env files and certificates
3. **✅ Created security audit report**

---

## 🔴 CRITICAL - DO THESE NOW (15 minutes)

### **1. Generate New API Keys** (Old key was exposed!)

```bash
# Run these commands to generate strong keys:
python -c "import secrets; print('BACKEND_API_KEY=' + secrets.token_urlsafe(32))"
python -c "import secrets; print('DJANGO_SECRET_KEY=' + secrets.token_urlsafe(50))"
```

**Copy the output and save it!**

### **2. Set Environment Variables in Railway**

Go to Railway Dashboard → Your Project → Click on your service → Variables:

```
BACKEND_API_KEY=<paste-generated-key-from-step-1>
DJANGO_SECRET_KEY=<paste-generated-key-from-step-1>
GEMINI_API_KEY=<your-gemini-key>
DEBUG=False
ALLOWED_HOSTS=your-app.railway.app
```

### **3. Set Environment Variables in Vercel**

Go to Vercel Dashboard → Your Project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-app.railway.app/api
NEXT_PUBLIC_SCANNER_URL=http://localhost:5000
```

### **4. Create Local .env Files** (NOT committed to Git)

**edge-node/.env**:
```bash
CLOUD_API_URL=https://your-app.railway.app/api
SCANNER_SECRET=<generate-another-strong-secret>
```

**frontend-web/.env.local** (for local testing):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SCANNER_URL=http://localhost:5000
```

---

## 🟡 OPTIONAL - CLEANUP (10 minutes)

### **Remove Unused Tailscale Files**

Since you're not using Tailscale for the thesis:

```bash
# Option A: Delete
rm backend-cloud/scripts/start-with-tailscale.sh
rm backend-cloud/scripts/setup-tailscale.sh
rm backend-cloud/Dockerfile  # Only if it's empty/template

# Option B: Keep for future reference
mkdir -p docs/future-work
mv backend-cloud/scripts/*tailscale* docs/future-work/
```

---

## ✅ VERIFICATION CHECKLIST

### **Before Git Push:**

```bash
# 1. Verify no .env files tracked
git ls-files | grep "\.env"
# Expected output: Empty

# 2. Check what's being committed
git status

# Expected: Only code files, no .env, no secrets

# 3. Search for API keys in tracked files
git grep -i "978641" # Part of old compromised key
# Expected: Empty (key removed)
```

### **After Railway Deployment:**

```bash
# Test API key authentication
curl -X POST https://your-app.railway.app/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"consent": true}'

# Expected: 403 Forbidden (no API key)

# Now with API key:
curl -X POST https://your-app.railway.app/api/session/start \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-new-key-here" \
  -d '{"consent": true}'

# Expected: 200 OK + session_id
```

---

## 📋 DEPLOYMENT ORDER

**1. Backend First (Railway)**
```bash
cd backend-cloud
git add .
git commit -m "Security: Remove hardcoded keys, add privacy features"
git push origin main

# Railway will auto-deploy
# Wait for build to complete (~3-5 minutes)
```

**2. Then Frontend (Vercel)**
```bash
cd frontend-web
git add .
git commit -m "Add privacy features and session management"
git push origin main

# Vercel will auto-deploy
# Wait for build (~2-3 minutes)
```

**3. Edge Node (Local)**
```bash
# Just create .env file (don't commit!)
# Start the scanner:
python app.py
```

---

## 🎯 FINAL DEPLOYMENT CHECKLIST

- [x] Hardcoded secrets removed
- [x] .gitignore updated
- [ ] New API keys generated
- [ ] Railway environment variables set
- [ ] Vercel environment variables set
- [ ] Local .env files created (not committed)
- [ ] No .env files in git: `git ls-files | grep env`
- [ ] Tested API key auth works
- [ ] Tested frontend → backend connection
- [ ] Tested scanner → localhost connection

---

## 🚨 IF YOU SEE ERRORS AFTER DEPLOYMENT

### **Error: "Invalid API key"**
**Fix**: Double-check Railway environment variables, redeploy

### **Error: "GEMINI_API_KEY not found"**
**Fix**: Add GEMINI_API_KEY to Railway variables

### **Error: "CORS error"**
**Fix**: Check ALLOWED_ORIGINS in backend includes your Vercel URL

### **Error: "Session not found"**
**Fix**: Backend might have restarted (sessions are in-memory), create new session

---

## 🎓 FOR YOUR THESIS DEFENSE

If advisor asks: **"How did you secure the application?"**

**Your answer**:
> "We implemented multiple security layers:
> 1. **Transport**: All communication uses HTTPS encryption
> 2. **Authentication**: API key required for all backend endpoints
> 3. **Access Control**: CORS restricts scanner API to our frontend only
> 4. **Privacy**: Session-scoped data with automatic expiration (10min/30min)
> 5. **Data Minimization**: Biometric data in-memory only, never persisted
> 6. **Secrets Management**: All keys in environment variables, not in code
> 
> For production, we would add: rate limiting, WAF, and regular security audits."

---

## ✅ YOU'RE READY WHEN:

All checkboxes above are checked! Good luck with your deployment! 🚀

**Estimated total time**: 25-30 minutes
