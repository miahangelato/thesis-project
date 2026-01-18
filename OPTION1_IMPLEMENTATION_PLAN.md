# Option 1: Direct Supabase URLs Implementation Plan

## Overview
Implement PDF download functionality using direct Supabase Storage URLs with signed URLs for secure, time-limited access.

## Why Option 1?
- ✅ **Simple & Fast**: Uses Supabase's built-in signed URL system
- ✅ **No Database Overhead**: No need for token tracking tables
- ✅ **Scalable**: Supabase handles URL generation and expiry
- ✅ **Secure**: Signed URLs expire automatically (configurable duration)
- ✅ **Cost-Effective**: No additional backend processing

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Scanner   │─────▶│   Backend    │─────▶│  Supabase   │
│   (Edge)    │      │   (Django)   │      │   Storage   │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │                     │
       │                     ▼                     │
       │            Generate PDF                   │
       │            Upload to Supabase             │
       │                     │                     │
       │                     ▼                     │
       │            Get Signed URL ◀───────────────┘
       │            (expires in 24hrs)             │
       │                     │                     │
       ▼                     ▼                     │
  Display QR Code    Return URL to Scanner        │
       │                     │                     │
       └────────▶ Scan QR ──▶│                     │
                             │                     │
                    Direct Download ◀──────────────┘
```

## Implementation Steps

### Phase 1: Backend - PDF Generation & Upload (✅ EXISTING)
**Location**: `backend-cloud/api/workflow_api.py` - `/generate-pdf` endpoint

Current implementation already:
1. Generates PDF using `pdf_service.py`
2. Uploads to Supabase Storage
3. Creates signed URL with 24-hour expiry
4. Returns the signed URL in response

**No changes needed** - this is already working correctly!

### Phase 2: Backend - Session Storage Update (✅ EXISTING)
**Location**: `backend-cloud/api/workflow_api.py` - `/generate-pdf` endpoint

Current implementation already:
1. Stores PDF URL in session data under `pdf_url` key
2. Scanner can retrieve this URL via `/session/{session_id}` endpoint

**No changes needed** - this is already working!

### Phase 3: Edge Scanner - QR Code Generation (✅ EXISTING)
**Location**: `edge-node/scanner_real.py`

Current implementation already:
1. Calls `/generate-pdf` endpoint after scan completion
2. Receives signed URL in response
3. Generates QR code pointing to the signed URL
4. Displays QR code on scanner screen

**No changes needed** - this works correctly!

### Phase 4: Frontend - Results Page (🔧 NEEDS UPDATE)
**Location**: `frontend-web/app/results/page.tsx`

**Current Issue**: Frontend might be trying to access backend URLs instead of direct Supabase URLs

**Changes Needed**:
```typescript
// ✅ CORRECT: Use the direct Supabase URL from session
const pdfUrl = sessionData.pdf_url; // This is already a signed Supabase URL

// ❌ WRONG: Don't construct backend proxy URLs
// const downloadUrl = `${API_URL}/download/${sessionId}`;

// ✅ CORRECT: For download button
<a href={pdfUrl} download="health-report.pdf">
  Download PDF
</a>

// ✅ CORRECT: For QR code
<QRCode value={pdfUrl} />
```

### Phase 5: Verification & Testing (📋 TODO)

#### Test Checklist:
- [ ] Backend generates PDF and uploads to Supabase
- [ ] Signed URL is created with correct expiry (24 hours)
- [ ] Scanner displays QR code with correct URL
- [ ] Scanning QR code downloads PDF directly from Supabase
- [ ] URL expires after 24 hours
- [ ] Frontend results page shows correct download link
- [ ] Frontend QR code contains direct Supabase URL

## File Changes Summary

### Files to Modify:
1. **`frontend-web/app/results/page.tsx`** (or similar results display component)
   - Ensure it uses `sessionData.pdf_url` directly
   - Remove any backend proxy URL construction
   - Verify QR code uses the direct Supabase URL

### Files Already Correct (No Changes):
- ✅ `backend-cloud/api/workflow_api.py` - PDF generation works
- ✅ `backend-cloud/api/pdf_service.py` - Supabase upload works
- ✅ `edge-node/scanner_real.py` - QR generation works

### Files Removed:
- ✅ Removed `DownloadToken` model from `models.py` (Option 3 artifact)

## Security Considerations

### ✅ Secure Aspects:
- Signed URLs expire after 24 hours (configurable)
- URLs are generated dynamically per session
- Supabase validates signatures server-side
- No permanent public access to PDFs

### ⚠️ Limitations:
- Anyone with the URL can download within 24 hours
- No download tracking/analytics
- Cannot revoke access before expiry
- No one-time download enforcement

### 🔒 If More Security Needed:
Consider Option 2 (Backend Proxy) or Option 3 (Token System) for:
- Download analytics/tracking
- Manual URL revocation
- One-time download links
- IP-based restrictions

## Configuration

### Backend Environment Variables:
```bash
# Supabase credentials (already configured)
SUPABASE_URL=your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Optional: Customize signed URL expiry
PDF_URL_EXPIRY_SECONDS=86400  # 24 hours (default)
```

### Supabase Storage Bucket:
- **Bucket Name**: `patient-reports` (or your configured name)
- **Public**: No (private bucket)
- **Access**: Via signed URLs only
- **File Path**: `reports/{session_id}/report.pdf`

## Deployment Checklist

### Railway (Backend):
- [ ] Verify Supabase credentials are set
- [ ] Confirm storage bucket exists and is private
- [ ] Test PDF generation endpoint
- [ ] Verify signed URL generation

### Vercel (Frontend):
- [ ] Update results page to use direct URLs
- [ ] Deploy and test QR code generation
- [ ] Verify download links work correctly

### Raspberry Pi (Scanner):
- [ ] Ensure scanner calls correct backend endpoint
- [ ] Verify QR code display functionality
- [ ] Test end-to-end flow: scan → PDF → QR → download

## Success Criteria

✅ **Option 1 is fully implemented when**:
1. PDF generates and uploads to Supabase successfully
2. Signed URL is returned with 24-hour expiry
3. Scanner displays QR code with direct Supabase URL
4. Scanning QR code downloads PDF directly (no backend proxy)
5. Frontend shows correct download button using direct URL
6. URL expires after configured time period

## Next Steps

1. **Review Frontend Results Page** - Check if it's using direct URLs or trying to proxy
2. **Test Complete Flow** - Scan → Generate → Download via QR code
3. **Verify URL Expiry** - Confirm URLs expire after 24 hours
4. **Update Documentation** - Document the direct URL approach for team

## Troubleshooting

### Issue: PDF download fails
- Check Supabase storage bucket permissions
- Verify signed URL hasn't expired
- Check browser console for CORS errors

### Issue: QR code doesn't work
- Verify QR contains full URL (not session ID)
- Test URL directly in browser
- Check URL encoding/special characters

### Issue: Frontend shows wrong URL
- Inspect `sessionData.pdf_url` value
- Ensure not constructing backend proxy URLs
- Verify API response structure

## References

- **Supabase Signed URLs**: https://supabase.com/docs/guides/storage/serving/downloads#creating-signed-urls
- **Current Implementation**: `backend-cloud/api/pdf_service.py`
- **QR Generation**: `edge-node/scanner_real.py`
