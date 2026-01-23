# Edge Node + Vercel Frontend Setup Guide

## 🏗️ Architecture

```
KIOSK MACHINE                    INTERNET
┌────────────────────┐          ┌──────────────┐
│ Edge Node          │          │ Vercel       │
│ localhost:5000     │          │ Frontend     │
│ (Python/Flask)     │          │              │
└────────────────────┘          └──────────────┘
         ↑                              ↑
         │                              │
         │  Browser on kiosk can access both:
         │  - localhost:5000 (edge node)
         │  - www.team3thesis.dev (frontend)
         │
┌────────────────────────────────────────┐
│ Browser (on kiosk machine)             │
│ Opens: https://www.team3thesis.dev     │
└────────────────────────────────────────┘
         ↓
┌────────────────────┐
│ Railway Backend    │
│ api.team3thesis.dev│
└────────────────────┘
```

## 🚀 **How to Start**

### **Step 1: Start Edge Node on Kiosk Machine**

Open PowerShell on the kiosk:

```bash
cd "m:\Thesis Project\edge-node"
python app.py
```

**Expected output:**
```
🚀 Starting Kiosk Scanner API with WebSocket support...
📡 Server will run on http://127.0.0.1:5000
✅ Scanner DLLs loaded successfully
✅ Scanner SDK initialized successfully
🔍 Scanner support: Windows
🔌 WebSocket: Enabled (real-time guided scan)
```

**Important:** Keep this terminal window open!

---

### **Step 2: Verify Edge Node is Running**

Open a browser on the same machine and check:

```
http://localhost:5000/api/health
```

**Expected:**
```json
{
  "status": "healthy",
  "service": "kiosk-scanner",
  "timestamp": "..."
}
```

---

### **Step 3: Update Vercel Environment Variables**

1. Go to **Vercel Dashboard** → Your frontend project → **Settings** → **Environment Variables**

2. **Add/Update:**

   **NEXT_PUBLIC_API_URL**
   ```
   https://api.team3thesis.dev/api
   ```

   **NEXT_PUBLIC_SCANNER_URL**
   ```
   http://localhost:5000
   ```

   **NEXT_PUBLIC_SCANNER_PORT**
   ```
   5000
   ```

3. Click **Save**

4. **Redeploy**: Go to **Deployments** → Click **•••** → **Redeploy**

---

### **Step 4: Access Frontend (from Kiosk)**

On the **kiosk machine** browser, open:

```
https://www.team3thesis.dev
```

**Why this works:**
- ✅ Frontend loads from Vercel (internet)
- ✅ Browser can call `localhost:5000` (edge node on same machine)
- ✅ Browser can call `api.team3thesis.dev` (backend on internet)

---

## 🔒 **Security Features**

✅ **Localhost Only:** Edge node only listens on `127.0.0.1`
- Can't be accessed from other computers on network
- No firewall configuration needed

✅ **Non-Privileged Port:** Uses port 5000 instead of 80
- Doesn't require Administrator rights
- Easier to start/stop for testing

✅ **Browser Security Model:**
- Frontend from HTTPS (`www.team3thesis.dev`) can access HTTP (`localhost:5000`)
- This is allowed by browsers for localhost

---

## 🧪 **Testing Checklist**

### **Test 1: Edge Node Health**
```bash
curl http://localhost:5000/api/health
```

**Expected:** `{"status": "healthy", ...}`

### **Test 2: Scanner Status**
```bash
curl http://localhost:5000/api/scanner/status
```

**Expected:** `{"scanner_available": true, ...}` (if scanner is connected)

### **Test 3: Frontend Connection**
1. Open `https://www.team3thesis.dev` on kiosk browser
2. Open DevTools Console (F12)
3. Look for edge node connection messages
4. Try starting a scan

---

## ⚠️ **Troubleshooting**

### **Problem: Frontend Can't Connect to Edge Node**

**Check:**
1. Is edge node running? (`http://localhost:5000/api/health`)
2. Are you accessing frontend from the kiosk machine's browser?
3. Check browser console for errors

**Fix:**
- If accessing from a different computer, this won't work (by design)
- Frontend MUST be accessed from kiosk browser

---

### **Problem: Port 5000 Already in Use**

**Error:** `Address already in use`

**Fix:** Change the port in `.env`:
```bash
KIOSK_SCANNER_PORT=5001
```

Then update Vercel's `NEXT_PUBLIC_SCANNER_PORT` to match.

---

### **Problem: Scanner Not Detected**

**Check:**
1. Is scanner plugged in?
2. Are scanner drivers installed?
3. Is Python running as Administrator?

**Fix:**
```bash
# Run PowerShell as Administrator
cd "m:\Thesis Project\edge-node"
python app.py
```

---

## 📝 **Configuration Files**

### **Edge Node `.env` (Optional)**
Create `m:\Thesis Project\edge-node\.env`:

```env
# Force localhost only
KIOSK_SCANNER_HOST=127.0.0.1
KIOSK_SCANNER_PORT=5000
KIOSK_SCANNER_DEBUG=True
```

### **Vercel Environment Variables**
```
NEXT_PUBLIC_API_URL=https://api.team3thesis.dev/api
NEXT_PUBLIC_SCANNER_URL=http://localhost:5000
NEXT_PUBLIC_SCANNER_PORT=5000
```

---

## ✅ **Daily Startup Checklist**

1. **Turn on kiosk computer**
2. **Start edge node:**
   ```bash
   cd "m:\Thesis Project\edge-node"
   python app.py
   ```
3. **Open browser:** `https://www.team3thesis.dev`
4. **Test scanner:** Click "Start Scan" and verify scanner works
5. **Ready to use!**

---

## 🎯 **Why This Setup is Secure**

| Component | Location | Accessible From |
|-----------|----------|-----------------|
| Edge Node | Kiosk (localhost:5000) | **Only kiosk machine** |
| Frontend | Vercel (www.team3thesis.dev) | **Anyone (public)** |
| Backend | Railway (api.team3thesis.dev) | **Anyone (public API)** |

**Security:**
- ✅ Edge node never exposed to internet
- ✅ Scanner data never leaves kiosk until sent to backend
- ✅ No ngrok or tunnel services needed
- ✅ Simple firewall rules (block port 5000)
