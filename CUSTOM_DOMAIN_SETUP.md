# Custom Domain Setup Guide

## 🎯 Goal
Set up your custom domain from name.com for:
- **Frontend**: `yourdomain.com` (Vercel)
- **Backend API**: `api.yourdomain.com` (Railway)
- **Download Page**: `yourdomain.com/download` (part of frontend)

---

## 📋 Prerequisites
- Custom domain purchased from name.com
- Access to Vercel dashboard (frontend)
- Access to Railway dashboard (backend)
- Access to name.com DNS settings

---

## Step 1: Configure DNS at name.com

Log in to name.com → Your Domain → DNS Records

Add these records:

### For Frontend (Vercel)
```
Type: A
Host: @
Answer: 76.76.21.21
TTL: 300

Type: CNAME  
Host: www
Answer: cname.vercel-dns.com
TTL: 300
```

### For Backend API (Railway)
```
Type: CNAME
Host: api
Answer: <your-project>.up.railway.app
TTL: 300
```

**Note**: Replace `<your-project>` with your actual Railway domain. You'll get this from Railway after adding the custom domain.

---

## Step 2: Configure Vercel (Frontend)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your frontend project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `yourdomain.com`
6. Click **Add**
7. Vercel will verify DNS (may take a few minutes)
8. Repeat for `www.yourdomain.com` (optional)

### Update Environment Variables in Vercel:
Go to **Settings** → **Environment Variables**

Update or add:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

**Important**: Redeploy after changing environment variables!

---

## Step 3: Configure Railway (Backend)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your backend project
3. Go to **Settings** → **Networking** → **Domains**
4. Click **Custom Domain**
5. Enter: `api.yourdomain.com`
6. Railway will show you a CNAME value (e.g., `your-project.up.railway.app`)
7. Copy this value and add it to your name.com DNS (as shown in Step 1)

### Update Environment Variables in Railway:

Add these variables:
```
ALLOWED_HOSTS=api.yourdomain.com,yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
PUBLIC_BASE_URL=https://api.yourdomain.com
```

---

## Step 4: Update Local Environment Files

### Frontend `.env.local` (for local development)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_SCANNER_BASE_URL=http://localhost:5000
NEXT_PUBLIC_KIOSK_API_KEY=9c719864eb9ae54335201428596bb51bc13b5d817a
```

### Backend `.env` (for local development)
```env
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-key
SESSION_ENCRYPTION_KEY=your-encryption-key
SUPABASE_URL=https://mkxedrrmxckgphetzdgm.supabase.co
SUPABASE_KEY=your-supabase-key
OPENAI_API_KEY=your-openai-key
BACKEND_API_KEY=9c719864eb9ae54335201428596bb51bc13b5d817a

# Allow both localhost and production domain
ALLOWED_HOSTS=localhost,127.0.0.1,api.yourdomain.com,yourdomain.com
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com,https://www.yourdomain.com

# For QR codes and PDF links
PUBLIC_BASE_URL=https://api.yourdomain.com
```

---

## Step 5: Update Backend Django Settings

The backend needs to accept requests from your custom domain. This should already be handled by the `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` environment variables, but verify:

### Check `config/settings.py`:
```python
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS", 
    "http://localhost:3000"
).split(",")
```

---

## Step 6: SSL/HTTPS Certificates

Both Vercel and Railway automatically provision SSL certificates for custom domains. No manual action needed! 🎉

- Vercel uses Let's Encrypt
- Railway uses Let's Encrypt

Certificates auto-renew before expiry.

---

## Step 7: Verification & Testing

### 1. Check DNS Propagation
```bash
# Check A record
nslookup yourdomain.com

# Check CNAME records  
nslookup www.yourdomain.com
nslookup api.yourdomain.com
```

Or use: https://dnschecker.org

### 2. Test Frontend
- Visit `https://yourdomain.com`
- Should load your frontend
- Check browser console for any CORS errors

### 3. Test Backend API
```bash
curl https://api.yourdomain.com/api/health
```

Should return health check response.

### 4. Test Complete Flow
1. Start a scan on your frontend
2. Complete demographics
3. Complete fingerprint scanning
4. Generate PDF
5. Verify QR code points to `https://api.yourdomain.com/...`

---

## 🔧 Troubleshooting

### Issue: "DNS_PROBE_FINISHED_NXDOMAIN"
**Solution**: DNS not propagated yet. Wait 5-30 minutes. Check with `dnschecker.org`.

### Issue: SSL Certificate Error
**Solution**: 
- Vercel/Railway may take a few minutes to provision certificates
- Ensure DNS is correctly pointing to their servers
- Try visiting `http://` first, then `https://` will work shortly after

### Issue: CORS Errors in Browser
**Solution**:
1. Check Railway environment variables include your domain in `CORS_ALLOWED_ORIGINS`
2. Redeploy backend after changing env vars
3. Clear browser cache

### Issue: API Returns 400 "Invalid Host"
**Solution**:
1. Add domain to `ALLOWED_HOSTS` in Railway env vars
2. Redeploy backend

### Issue: Old Railway Domain Still in QR Codes
**Solution**:
1. Update `PUBLIC_BASE_URL` in Railway env vars to `https://api.yourdomain.com`
2. Redeploy backend
3. Generate new PDF report

---

## 📝 Summary Checklist

- [ ] DNS records added at name.com
- [ ] Custom domain added in Vercel
- [ ] Custom domain added in Railway
- [ ] Vercel env vars updated with new API URL
- [ ] Railway env vars updated (ALLOWED_HOSTS, CORS, PUBLIC_BASE_URL)
- [ ] Frontend redeployed on Vercel
- [ ] Backend redeployed on Railway
- [ ] DNS propagation verified
- [ ] SSL certificates provisioned
- [ ] Frontend accessible at custom domain
- [ ] Backend API accessible at api subdomain
- [ ] Complete scan-to-download flow tested
- [ ] QR codes point to custom domain

---

## 🎉 Expected Final URLs

After setup:
- **Frontend**: `https://yourdomain.com`
- **Results Page**: `https://yourdomain.com/results`
- **Download Page**: `https://yourdomain.com/download`
- **API Health**: `https://api.yourdomain.com/api/health`
- **PDF URLs**: `https://[supabase].supabase.co/storage/...` (Supabase domain is fine)
- **QR Codes**: Generated by backend, stored in Supabase

---

## 💡 Optional: Subdomain for Scanner

If you want to host the scanner remotely:
```
Type: CNAME
Host: scanner
Answer: <scanner-server-ip-or-domain>
```

Then access at: `https://scanner.yourdomain.com`

---

## 🔄 Future Updates

When you need to change domains:
1. Update DNS at name.com
2. Update Vercel custom domain
3. Update Railway custom domain  
4. Update environment variables in both platforms
5. Redeploy both frontend and backend
