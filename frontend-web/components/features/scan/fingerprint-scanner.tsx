"use client";

import React, { useState } from "react";
import axios from "axios";
import { FingerName } from "@/types/fingerprint";
import { Fingerprint, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScannerProps {
  onScanComplete: (
    fingerName: FingerName,
    imageFile: File,
    scanData?: unknown
  ) => void;
  currentFinger: FingerName;
  participantData?: unknown;
}

// Fallback to localhost if not set
const SCANNER_BASE_URL = process.env.NEXT_PUBLIC_SCANNER_BASE_URL || "http://localhost:5000";


export default function FingerprintScanner({
  onScanComplete,
  currentFinger,
  participantData,
}: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScan = async () => {
    setScanning(true);
    setError(null);

    try {
      // Logic for Scanner App
      // If we are in dev/demo mode where scanner app might not be running, we can simulate or allow upload
      // For now, I will try to hit the scanner app as per design
      
      const response = await axios.post(
        `${SCANNER_BASE_URL}/api/scanner/capture`,
        {
          finger_name: currentFinger,
          // participant_data: participantData // Optional: Include if scanner app needs it
        },
        {
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          timeout: 30000 // 30s timeout - scanner needs time to wait for finger placement
        }
      );

      if (response.data.success) {
        let base64Data = response.data.data.image_data;
        
        // Debug logging
        console.log("Received base64 data length:", base64Data?.length);
        console.log("First 100 chars:", base64Data?.substring(0, 100));
        
        // Remove data URL prefix if present (e.g., "data:image/png;base64,")
        if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1];
          console.log("Stripped data URL prefix");
        }
        
        // Convert base64 to blob
        try {
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          console.log("Converted to byte array, length:", byteArray.length);
          
          // Verify Header
          const header = Array.from(byteArray.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
          console.log("PNG Magic Bytes:", header); // Expect: 89 50 4e 47 0d 0a 1a 0a

          const blob = new Blob([byteArray], { type: "image/png" });
          console.log("Created blob, size:", blob.size);
          
          const file = new File([blob], `${currentFinger}.png`, {
            type: "image/png",
          });
          console.log("Created file, size:", file.size);

          onScanComplete(currentFinger, file, response.data.data);
        } catch (conversionError) {
          console.error("Image conversion error:", conversionError);
          throw new Error("Failed to convert image data");
        }
      } else {
        throw new Error(response.data.message || "Scan failed");
      }
    } catch (err) {
      console.error("Scan error:", err);
      // Fallback: Allow file upload simulation for dev
        setError("Scanner not connected. Please use upload fallback if available.");
    } finally {
      setScanning(false);
    }
  };
  
  // Hidden file input for fallback
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onScanComplete(currentFinger, e.target.files[0]);
      }
  };

  return (
    <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
            <button
                onClick={startScan}
                disabled={scanning}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
                {scanning ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning...
                </>
                ) : (
                <>
                    <Fingerprint className="w-4 h-4" />
                    Scan {currentFinger.replace("_", " ")}
                </>
                )}
            </button>
            
            {/* Fallback Upload Button (Hidden or visible based on error?) 
                Let's make it visible as a secondary option for now since I can't guarantee scanner hardware
            */}
             <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 h-auto"
                title="Upload image if scanner is not available"
             >
                <Upload className="w-4 h-4" />
             </Button>
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
             />
        </div>

      {error && (
        <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
