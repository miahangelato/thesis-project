# 🖐️ Kiosk Scanner App

A standalone Flask-based API server for DigitalPersona fingerprint scanners, designed for kiosk deployment.

## ✅ Working Components

- **DigitalPersona U.are.U SDK Integration** - Real fingerprint capture
- **Flask API Server** - RESTful endpoints for scanner operations  
- **PIL Image Processing** - Automatic PNG conversion
- **CORS Support** - Frontend integration ready
- **Windows Service Deployment** - Production ready

## 🛠️ Requirements

- **Windows 10/11** (64-bit)
- **Python 3.8+**
- **DigitalPersona U.are.U Scanner** (U4500, U5000, etc.)
- **Administrator privileges** (for scanner access)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Server
```bash
# Option 1: Use the startup script
start.bat

# Option 2: Run directly  
python app.py
```

### 3. Test the Scanner
```bash
# In another terminal
python test_app.py
```

## 🌐 API Endpoints

### Health Check
```http
GET /api/health
```
Response:
```json
{
  "status": "healthy",
  "service": "kiosk-scanner-api", 
  "scanner_available": true,
  "platform": "windows"
}
```

### Scanner Status
```http
GET /api/scanner/status
```
Response:
```json
{
  "scanner_available": true,
  "status": "ready",
  "message": "Scanner is ready for capture",
  "platform": "windows"
}
```

### Capture Fingerprint
```http
POST /api/scanner/capture
Content-Type: application/json

{}
```
Response:
```json
{
  "success": true,
  "image_data": "iVBORw0KGgoAAAANSUhEUgAAAUAAAAF...",
  "format": "png",
  "width": 320,
  "height": 360,
  "timestamp": "2025-09-05T15:30:45.123456"
}
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Kiosk Scanner   │    │ DigitalPersona  │
│   (Vercel)      │───▶│  Flask API       │───▶│ U.are.U SDK     │
│                 │    │  (Local)         │    │ (Hardware)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │
                               ▼
                       ┌──────────────────┐
                       │ Cloud Backend    │
                       │ (Railway)        │
                       │ AI Processing    │
                       └──────────────────┘
```

## 📁 Project Structure

```
kiosk-scanner-app/
├── app.py                     # Main Flask application
├── scanner_real.py           # DigitalPersona SDK integration
├── config.py                 # Configuration settings
├── requirements.txt          # Python dependencies
├── deploy.py                 # Windows service installer
├── test_app.py              # Complete test suite
├── start.bat                # Quick startup script
├── README.md                # This file
└── sdk/                     # DigitalPersona SDK files
    ├── RTE/                 # Runtime Environment
    ├── SDK/                 # Software Development Kit  
    └── Docs/                # Documentation
```

## 🔧 Configuration
  
Edit `config.py` to customize:

```python
# Server settings
HOST = '0.0.0.0'  # Allow network access
PORT = 8000       # API port

# Cloud backend URL  
CLOUD_API_URL = "https://your-app.railway.app/api"

# CORS settings for frontend
CORS_ORIGINS = [
    "http://localhost:3000",     # Local development
    "https://your-app.vercel.app" # Production frontend
]
```

## 🖥️ Mini PC Deployment

### 1. Copy Files
```bash
# Copy entire folder to mini PC
xcopy /E /I kiosk-scanner-app C:\kiosk-scanner-app
```

### 2. Install as Windows Service
```bash
cd C:\kiosk-scanner-app
python deploy.py
```

### 3. Configure Network
- Set static IP for mini PC
- Update frontend to use mini PC IP: `http://192.168.1.100:8000/api`

## 🧪 Testing

### Automated Tests
```bash
python test_app.py
```

### Manual Testing
1. Visit `http://localhost:8000/api/health`
2. Check scanner status: `http://localhost:8000/api/scanner/status`  
3. Use Postman to test capture endpoint

### Frontend Integration Example
```javascript
// Auto-detect kiosk vs web environment
const isKiosk = window.location.hostname === 'localhost';
const API_BASE = isKiosk 
  ? 'http://localhost:8000/api'
  : 'https://your-cloud-api.railway.app/api';

// Capture fingerprint
const response = await fetch(`${API_BASE}/scanner/capture`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});

const result = await response.json();
if (result.success) {
  const img = new Image();
  img.src = `data:image/png;base64,${result.image_data}`;
  document.body.appendChild(img);
}
```

## 🛠️ Troubleshooting

### Scanner Not Found
- Ensure DigitalPersona driver is installed
- Check Windows Device Manager for "U.are.U" device
- Run as Administrator

### API Connection Issues  
- Check Windows Firewall settings
- Verify port 8000 is not blocked
- Test with `telnet localhost 8000`

### Capture Fails
- Place finger properly on scanner surface
- Clean scanner surface
- Check scanner LED indicators

## 📝 Logs

Application logs are saved to:
- Console output (real-time)
- `fingerprint_scanner.log` (detailed)
- Windows Event Viewer (if installed as service)

## 🔗 Related Projects

- **Backend**: Railway cloud deployment with AI processing
- **Frontend**: Vercel deployment with React/Next.js
- **Models**: AWS S3 bucket for ML model storage

---

**Status**: ✅ Ready for production deployment  
**Last Updated**: September 2025  
**Tested With**: DigitalPersona U.are.U 4500, Windows 10/11
