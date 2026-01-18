# Diabetes Risk Assessment Kiosk - Frontend

Modern Next.js 16 frontend for the diabetes risk prediction kiosk system.

## 🚀 Quick Start

```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

## 📁 Project Structure

```
frontend-web/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home/Consent
│   ├── demographics/      # Patient info form
│   ├── scan/              # Fingerprint scanning
│   ├── results/           # Analysis results
│   └── download/          # PDF download + QR
├── components/
│   └── ui/                # ShadCN components
├── contexts/
│   └── session-context.tsx  # Global state
├── lib/
│   ├── api.ts             # Backend API client
│   └── utils.ts           # Helpers
└── types/                 # TypeScript types
```

## 🔌 Backend Integration

This frontend connects to the Django backend at `http://localhost:8000`.

Update the API URL in `lib/api.ts` or set environment variable:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 🎨 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** ShadCN/UI
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **QR Codes:** qrcode.react

## 📱 User Flow

1. **Home** - Start session with consent
2. **Demographics** - Enter age, weight, height, gender
3. **Scan** - Upload 10 fingerprint images
4. **Results** - View diabetes risk & blood group
5. **Download** - Get PDF report via QR code

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Backend Requirements

Ensure the Django backend is running:

```powershell
cd ../backend-cloud
python manage.py runserver
```

## 🧪 Testing

1. Start backend: `python manage.py runserver`
2. Start frontend: `npm run dev`
3. Visit: http://localhost:3000
4. Complete the 5-step workflow

## 📦 Dependencies

Key packages:

- `next` - React framework
- `axios` - HTTP client
- `@radix-ui/*` - Headless UI primitives
- `tailwindcss` - Utility-first CSS
- `lucide-react` - Icons
- `qrcode.react` - QR code generation

Install all:

```powershell
npm install
```

## 🎯 Features

✅ Session-based workflow  
✅ Real-time BMI calculation  
✅ Progress tracking (scan 10 fingerprints)  
✅ AI-powered risk explanations  
✅ Blood group prediction  
✅ PDF report generation  
✅ QR code for mobile download  
✅ Responsive design  
✅ Type-safe API integration

## 📄 License

MIT - Built for thesis research purposes
