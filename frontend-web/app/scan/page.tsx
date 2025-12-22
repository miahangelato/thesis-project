"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/contexts/session-context";
import { sessionAPI } from "@/lib/api";
// axios removed
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Info,
  Activity,
  CheckCircle,
  Clock,
  Fingerprint
} from "lucide-react";
import { FingerName, FINGER_ORDER } from "@/types/fingerprint";
import { HandGuide } from "@/components/features/scan/hand-guide";
import FingerprintScanner from "@/components/features/scan/fingerprint-scanner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { SessionEndModal } from "@/components/modals/session-end-modal";
import { ROUTES, STEPS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";

const FINGER_NAMES: { [key: string]: string } = {
  "left_thumb": "Left Thumb",
  "left_index": "Left Index", 
  "left_middle": "Left Middle",
  "left_ring": "Left Ring",
  "left_pinky": "Left Pinky",
  "right_thumb": "Right Thumb",
  "right_index": "Right Index",
  "right_middle": "Right Middle", 
  "right_ring": "Right Ring",
  "right_pinky": "Right Pinky"
};

// Helper component to manage object URL lifecycle and debugging
const ScanPreview = ({ file, fingerName }: { file?: File, fingerName: string }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }

    console.log(`Creating object URL for ${fingerName}, size: ${file.size}, type: ${file.type}`);
    if (file.size === 0) {
        console.warn(`File for ${fingerName} has 0 bytes!`);
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, fingerName]);

  if (!objectUrl) return null;

  return (
    <img
      src={objectUrl}
      alt={fingerName}
      className="w-full h-full object-contain"
      onError={(e) => {
        console.error(`Failed to load image for ${fingerName}`);
        console.error("Source URL:", objectUrl);
      }}
    />
  );
};

export default function ScanPage() {
  const router = useRouter();
  const { sessionId, setCurrentStep } = useSession();
  const [loading, setLoading] = useState(false);
  const [currentFingerIndex, setCurrentFingerIndex] = useState(0);
  const [fingerFiles, setFingerFiles] = useState<{ [key in FingerName]?: File }>({});

  const { showModal, handleConfirm, handleCancel } = useBackNavigation(true);

  // Mock participant data (in real app, fetch from context/API)
  const participant = {
    age: "Unknown", // Placeholder if we don't fetch it back
    gender: "Unknown",
    height: "Unknown",
    weight: "Unknown",
    blood_type: "Unknown",
    wavelength: "Unknown"
  };

  const currentFinger = FINGER_ORDER[currentFingerIndex];
  const [handRaw, fingerRaw] = currentFinger ? currentFinger.split("_") : ["", ""];
  const hand = handRaw as "right" | "left";
  const highlight = fingerRaw as "thumb" | "index" | "middle" | "ring" | "pinky";
  const isScanned = !!fingerFiles[currentFinger];
  const totalFingers = FINGER_ORDER.length;
  const scannedCount = Object.keys(fingerFiles).length;

  const handleScanComplete = (fingerName: FingerName, file: File) => {
    setFingerFiles((prev) => ({ ...prev, [fingerName]: file }));
    
    // Auto advance
    setTimeout(() => {
      for (let i = currentFingerIndex + 1; i < totalFingers; i++) {
        if (!fingerFiles[FINGER_ORDER[i]]) {
            setCurrentFingerIndex(i);
            break;
        }
      }
    }, 500);
  };

  const handleNextFinger = () => {
    if (currentFingerIndex < totalFingers - 1) {
      setCurrentFingerIndex(currentFingerIndex + 1);
    }
  };

  const handlePreviousFinger = () => {
    if (currentFingerIndex > 0) {
      setCurrentFingerIndex(currentFingerIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
        if (!sessionId) {
            console.error("No session ID available");
            alert("No session ID. Please restart the workflow.");
            return;
        }

        console.log(`Uploading ${Object.keys(fingerFiles).length} fingerprints...`);
        
        // Upload all files
        const uploadPromises = Object.entries(fingerFiles).map(async ([finger, file]) => {
             return new Promise<void>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64 = reader.result as string;
                    try {
                        console.log(`Uploading ${finger}...`);
                        await sessionAPI.submitFingerprint(sessionId, {
                            finger_name: finger,
                            image: base64
                        });
                        console.log(`${finger} uploaded successfully`);
                        resolve();
                    } catch (e) {
                        console.error(`Failed to upload ${finger}:`, e);
                        reject(e);
                    }
                };
                reader.onerror = () => reject(new Error(`Failed to read file for ${finger}`));
                reader.readAsDataURL(file);
             });
        });

        await Promise.all(uploadPromises);
        console.log("All fingerprints uploaded successfully");
        
        // Trigger analysis
        console.log("Triggering analysis...");
        try {
          const analyzeResponse = await sessionAPI.analyze(sessionId);
          console.log("Analysis API response:", analyzeResponse);
          console.log("Analysis completed successfully");
        } catch (analyzeError) {
          console.error("Analysis API error:", analyzeError);
          // Error is already logged by api-client logic, but we throw to stop navigation
          throw analyzeError;
        }

        setCurrentStep(STEPS.RESULTS); // Moving to results page (step 4)
        router.push(ROUTES.RESULTS);
    } catch (err) {
        console.error("Submission failed:", err);
        const message = getErrorMessage(err);
        alert(`Failed to submit: ${message}`);
    } finally {
        setLoading(false);
    }
  };

  return (
    <ProtectedRoute requireSession={true} requiredStep={STEPS.SCAN}>
    <>
      <SessionEndModal 
        isOpen={showModal}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    <div className="h-screen bg-white flex flex-col">
      <main className="flex-1 w-full px-6 md:px-12 lg:px-16 xl:px-20 py-4 flex flex-col overflow-y-auto">
        <div className="h-full flex flex-col px-6 py-3">
          <ProgressHeader
            currentStep={STEPS.SCAN}
            totalSteps={4}
            title="Fingerprint Scan"
            subtitle="Securely scan your fingerprints for analysis"
            accentColor="#00c2cb"
          />

          <div className="flex-1 min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              
              {/* Left Panel - Scanning Interface */}
              <div className="lg:col-span-7 flex flex-col h-full">
                {/* Info Card - Simplified for now */}
                <Card className="border border-border rounded-lg mb-3 flex-shrink-0">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-sm font-semibold flex items-center">
                      <User className="w-3 h-3 mr-2 text-primary" />
                      Session Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                     <p className="text-xs text-muted-foreground">Session ID: {sessionId || "N/A"}</p>
                  </CardContent>
                </Card>

                {/* Main Scanning Card */}
                <Card className="border border-border rounded-lg">
                  <CardHeader className="pb-2 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold">
                        {FINGER_NAMES[currentFinger]}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {currentFingerIndex + 1} of {totalFingers}
                        </span>
                        <div className="w-20 bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${(scannedCount / totalFingers) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {scannedCount}/{totalFingers}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3">
                    <div className="grid grid-cols-2 gap-4">
                      
                      {/* Hand Guide */}
                      <div className="flex flex-col items-center">
                        <h4 className="text-xs font-medium mb-2 text-foreground">
                          Position Your {hand === "left" ? "Left" : "Right"} Hand
                        </h4>
                        <div className="w-32 h-32 bg-accent/20 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center mb-2">
                          <HandGuide hand={hand} highlightFinger={highlight} />
                        </div>
                        <p className="text-center text-muted-foreground mb-2 text-xs">
                           Place your <strong>{highlight}</strong> finger
                        </p>

                        <div className="mb-1">
                          <FingerprintScanner
                            onScanComplete={handleScanComplete}
                            currentFinger={currentFinger}
                          />
                        </div>

                        {isScanned && (
                          <Button 
                            onClick={() => setFingerFiles(prev => ({ ...prev, [currentFinger]: undefined }))}
                            variant="outline"
                            size="sm"
                            className="border-border text-foreground text-xs mt-2"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Rescan
                          </Button>
                        )}
                      </div>

                      {/* Scan Result */}
                      <div className="flex flex-col items-center">
                        <h4 className="text-xs font-medium mb-2 text-foreground">
                          Scan Result
                        </h4>
                        <div className="w-32 h-32 bg-muted/30 rounded-lg border-2 border-border flex items-center justify-center mb-2 overflow-hidden relative">
                          {isScanned ? (
                            <ScanPreview 
                                file={fingerFiles[currentFinger]} 
                                fingerName={currentFinger} 
                            />
                          ) : (
                            <div className="text-center">
                              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                              <div className="text-xs font-medium text-muted-foreground">Ready</div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={handlePreviousFinger}
                            disabled={currentFingerIndex === 0}
                            variant="outline"
                            size="sm"
                            className="text-xs px-2 py-1"
                          >
                            <ChevronLeft className="w-3 h-3 mr-1" />
                            Prev
                          </Button>
                          <Button
                            onClick={handleNextFinger}
                            disabled={currentFingerIndex === totalFingers - 1}
                            variant="outline"
                            size="sm"
                            className="text-xs px-2 py-1"
                          >
                            Next
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Progress Overview */}
              <div className="lg:col-span-5 flex flex-col space-y-3">
                 <Card className="border border-border rounded-lg">
                    <CardHeader className="pb-3 pt-4 px-4">
                      <CardTitle className="text-base font-bold flex items-center">
                        <Activity className="w-4 h-4 mr-2 text-primary" />
                        Progress Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-1.5 mb-3">
                        <div className="text-center p-1.5 bg-green-50 rounded border border-green-200">
                          <div className="text-lg font-bold text-green-600">{scannedCount}</div>
                          <div className="text-xs text-muted-foreground">Completed</div>
                        </div>
                        <div className="text-center p-1.5 bg-slate-50 rounded border border-slate-200">
                          <div className="text-lg font-bold text-slate-600">{totalFingers - scannedCount}</div>
                          <div className="text-xs text-muted-foreground">Remaining</div>
                        </div>
                      </div>
                      
                      <div className="max-h-40 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-1">
                          {FINGER_ORDER.map((finger, index) => {
                            const isCompleted = !!fingerFiles[finger];
                            const isCurrent = index === currentFingerIndex;
                            return (
                              <button
                                key={finger}
                                onClick={() => setCurrentFingerIndex(index)}
                                className={`
                                  p-1 text-xs rounded font-medium border transition-all text-left flex items-center
                                  ${isCurrent
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : isCompleted
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                                  }
                                `}
                              >
                                {isCompleted && <CheckCircle className="w-3 h-3 mr-1" />}
                                {index + 1}. {FINGER_NAMES[finger].split(' ')[1]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border">
                         <div className="flex items-start space-x-2">
                            <Info className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                            <div className="text-xs text-foreground space-y-1">
                                <p>1. Position finger on scanner</p>
                                <p>2. Wait for confirmation</p>
                            </div>
                         </div>
                      </div>
                    </CardContent>
                 </Card>
              </div>

            </div>
          </div>

          <div className="flex justify-between items-center pt-3 mt-auto">
             <Button
                variant="outline"
                onClick={() => router.back()}
                className="px-6 py-3 text-sm"
             >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
             </Button>

             <Button
                onClick={handleSubmit}
                disabled={loading || scannedCount === 0}
                className="px-8 py-3 text-sm bg-[#00c2cb] hover:bg-[#00adb5] text-white"
             >
                {loading ? "Processing..." : "Finish & Analyze"}
                <ChevronRight className="w-4 h-4 ml-2" />
             </Button>
          </div>
          
          <Footer />
        </div>
      </main>
    </div>
    </>
    </ProtectedRoute>
  );
}
