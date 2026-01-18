# Quick DNS Setup Reference

## 🌐 DNS Records to Add at name.com

Replace `yourdomain.com` with your actual domain.

### Root Domain → Frontend (Vercel)
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 300
```

### WWW Subdomain → Frontend (Vercel)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 300
```

### API Subdomain → Backend (Railway)
```
Type: CNAME
Name: api
Value: your-project-name.up.railway.app
TTL: 300
```

**Note**: Get the exact Railway domain from:
Railway Dashboard → Your Project → Settings → Networking → Custom Domain

---

## 🔄 Propagation Time
- **Typical**: 5-30 minutes
- **Maximum**: Up to 48 hours (rare)
- **Check status**: https://dnschecker.org

---

## ✅ Verification Commands

```bash
# Check if domain resolves to Vercel
nslookup yourdomain.com
# Should show: 76.76.21.21

# Check API subdomain
nslookup api.yourdomain.com
# Should show: CNAME to Railway

# Check WWW subdomain
nslookup www.yourdomain.com
# Should show: CNAME to Vercel
```

---

## 🚀 After DNS is Configured

### 1. Vercel (Frontend)
- Dashboard → Project → Settings → Domains
- Add: `yourdomain.com`
- Add: `www.yourdomain.com` (optional)
- Set environment variable:
  - `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com/api`
- **Redeploy**

### 2. Railway (Backend)
- Dashboard → Project → Settings → Networking
- Add custom domain: `api.yourdomain.com`
- Set environment variables:
  - `ALLOWED_HOSTS` = `api.yourdomain.com,yourdomain.com`
  - `CORS_ALLOWED_ORIGINS` = `https://yourdomain.com,https://www.yourdomain.com`
  - `PUBLIC_BASE_URL` = `https://api.yourdomain.com`
- **Redeploy**

---

## 🎯 Final URLs

| Component | URL | Platform |
|-----------|-----|----------|
| Homepage | `https://yourdomain.com` | Vercel |
| Download Page | `https://yourdomain.com/download` | Vercel |
| Results Page | `https://yourdomain.com/results` | Vercel |
| API Health | `https://api.yourdomain.com/api/health` | Railway |
| PDF Files | Supabase Storage URLs | Supabase |

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "Site can't be reached" | DNS not propagated yet. Wait 10-30 mins |
| SSL/HTTPS error | Wait for auto-provisioning (5-10 mins) |
| CORS errors | Check Railway env vars, redeploy |
| 400 Invalid Host | Add domain to `ALLOWED_HOSTS`, redeploy |
| Old QR codes | Update `PUBLIC_BASE_URL`, regenerate PDFs |

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs/concepts/projects/domains
- **Railway Docs**: https://docs.railway.app/deploy/exposing-your-app#custom-domains
- **name.com Support**: https://www.name.com/support
