# Custom Domain Setup Checklist

Use this checklist to track your progress setting up your custom domain.

## 📝 Pre-Setup

- [ ] Domain purchased at name.com
- [ ] Access to name.com DNS management
- [ ] Access to Vercel dashboard
- [ ] Access to Railway dashboard
- [ ] Know your domain name: ___________________

---

## 🌐 Step 1: DNS Configuration at name.com

- [ ] Log in to name.com
- [ ] Navigate to your domain → DNS Records
- [ ] Add A record: `@` → `76.76.21.21`
- [ ] Add CNAME record: `www` → `cname.vercel-dns.com`
- [ ] Save DNS changes
- [ ] **Wait 10-30 minutes for propagation**

---

## 🎨 Step 2: Frontend Setup (Vercel)

- [ ] Log in to Vercel dashboard
- [ ] Open your frontend project
- [ ] Go to Settings → Domains
- [ ] Click "Add Domain"
- [ ] Enter your domain: ___________________
- [ ] Click Add
- [ ] Wait for Vercel to verify (green checkmark)
- [ ] (Optional) Add `www.yourdomain.com` too
- [ ] Go to Settings → Environment Variables
- [ ] Update `NEXT_PUBLIC_API_URL` to: `https://api.yourdomain.com/api`
- [ ] Click "Redeploy" to apply changes

---

## 🔧 Step 3: Backend Setup (Railway)

- [ ] Log in to Railway dashboard
- [ ] Open your backend project
- [ ] Go to Settings → Networking → Custom Domain
- [ ] Enter: `api.yourdomain.com`
- [ ] Copy the CNAME value shown (e.g., `xyz.up.railway.app`)
- [ ] **Go back to name.com**
- [ ] Add CNAME record: `api` → `[paste Railway domain]`
- [ ] **Back to Railway**
- [ ] Go to Variables tab
- [ ] Add/Update these variables:
  - [ ] `ALLOWED_HOSTS` = `api.yourdomain.com,yourdomain.com`
  - [ ] `CORS_ALLOWED_ORIGINS` = `https://yourdomain.com,https://www.yourdomain.com`
  - [ ] `PUBLIC_BASE_URL` = `https://api.yourdomain.com`
- [ ] Railway will auto-redeploy

---

## ✅ Step 4: Verification

- [ ] Wait 10-30 minutes for DNS to propagate
- [ ] Visit `https://yourdomain.com` → Should load your site
- [ ] Visit `https://api.yourdomain.com/api/health` → Should return JSON
- [ ] Check for SSL (green padlock) on both
- [ ] Test complete flow:
  - [ ] Start new analysis
  - [ ] Enter demographics
  - [ ] Complete fingerprint scan
  - [ ] View results
  - [ ] Generate PDF
  - [ ] Check QR code displays correctly
  - [ ] Scan QR code → PDF downloads

---

## 🔍 Troubleshooting

If something doesn't work:

### Frontend not loading?
- [ ] Check DNS with: `nslookup yourdomain.com`
- [ ] Should return: `76.76.21.21`
- [ ] Wait longer for DNS propagation
- [ ] Check Vercel domain shows green checkmark

### API not working?
- [ ] Check DNS with: `nslookup api.yourdomain.com`
- [ ] Should return CNAME to Railway
- [ ] Verify Railway shows custom domain as "Active"
- [ ] Check Railway logs for errors
- [ ] Verify environment variables are set correctly

### CORS errors in browser console?
- [ ] Check `CORS_ALLOWED_ORIGINS` includes your domain
- [ ] Make sure to include `https://` prefix
- [ ] Redeploy backend after changing env vars
- [ ] Clear browser cache (Ctrl+Shift+R)

### SSL certificate errors?
- [ ] Wait 10 minutes for auto-provisioning
- [ ] Check domain is verified in Vercel/Railway
- [ ] DNS must be correctly configured first

### QR codes still show old Railway domain?
- [ ] Update `PUBLIC_BASE_URL` in Railway to your custom domain
- [ ] Redeploy backend
- [ ] Generate a NEW PDF (old ones will still have old domain)

---

## 📞 Need Help?

- **DNS Propagation Check**: https://dnschecker.org
- **Vercel Status**: https://www.vercel-status.com
- **Railway Status**: https://railway.statuspage.io
- **Reference Docs**: See `CUSTOM_DOMAIN_SETUP.md`

---

## 🎉 Success Criteria

Your setup is complete when:

- ✅ `https://yourdomain.com` loads your frontend
- ✅ `https://www.yourdomain.com` redirects to main domain
- ✅ `https://api.yourdomain.com/api/health` returns JSON
- ✅ Both have SSL (green padlock)
- ✅ Complete workflow works end-to-end
- ✅ PDF generation succeeds
- ✅ QR codes display correctly
- ✅ Scanning QR code downloads PDF

---

**Date Started**: ___________________
**Date Completed**: ___________________
**Notes**:
