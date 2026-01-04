"use client";

import { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "@/contexts/session-context";
import { sessionAPI } from "@/lib/api";
// axios removed
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import { StepNavigation } from "@/components/layout/step-navigation";
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
  Fingerprint,
  RefreshCcw,
  Shield,
  AlertTriangle,
  Pause,
  Play,
  Lightbulb,
  FileText,
} from "lucide-react";
import { HandGuide } from "@/components/features/scan/hand-guide";
import FingerprintScanner from "@/components/features/scan/fingerprint-scanner";
import { ScanAssistantSubtitle } from "@/components/features/scan/scan-assistant-subtitle";
import { FINGER_ORDER, FingerName } from "@/types/fingerprint";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { SessionEndModal } from "@/components/modals/session-end-modal";
import {
  AnalysisLoadingOverlay,
  FinishConfirmationModal,
} from "@/components/modals/finish-modal";
import { ROUTES, STEPS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { ScanConfirmationModal } from "@/components/modals/scan-confirmation-modal";

const FINGER_NAMES: { [key: string]: string } = {
  left_thumb: "Left Thumb",
  left_index: "Left Index",
  left_middle: "Left Middle",
  left_ring: "Left Ring",
  left_pinky: "Left Pinky",
  right_thumb: "Right Thumb",
  right_index: "Right Index",
  right_middle: "Right Middle",
  right_ring: "Right Ring",
  right_pinky: "Right Pinky",
};

// Helper component to manage object URL lifecycle and debugging
const ScanPreview = ({
  file,
  fingerName,
}: {
  file?: File;
  fingerName: string;
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }

    console.log(
      `Creating object URL for ${fingerName}, size: ${file.size}, type: ${file.type}`
    );
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
      className="w-full h-full object-contain select-none pointer-events-none"
      draggable={false}
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
  const [fingerFiles, setFingerFiles] = useState<{
    [key in FingerName]?: File;
  }>({});
  const [demographics, setDemographics] = useState<any>(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null); // Countdown for auto-advance
  const [scannerReady, setScannerReady] = useState(false); // NEW: Track scanner readiness
  const [scanningStarted, setScanningStarted] = useState(false); // Track if scanning has been initiated
  const [showScanConfirmModal, setShowScanConfirmModal] = useState(false); // Confirmation modal for starting scan
  const [showCancelModal, setShowCancelModal] = useState(false); // Cancel session modal
  const [paused, setPaused] = useState(false); // Track if auto-advance is paused
  const [isFirstScan, setIsFirstScan] = useState(true); // Track if this is the very first scan
  type ScannerState = 'idle' | 'waiting' | 'detecting' | 'captured' | 'paused' | 'error';
  const [scannerState, setScannerState] = useState<ScannerState>('idle');


  const { showModal, handleConfirm, handleCancel, promptBackNavigation } = useBackNavigation(true);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false); // New modal state

  // Reset Session Handler
  const handleResetSession = () => {
      setFingerFiles({});
      setCurrentFingerIndex(0);
      // scannedCount is derived, so no need to set it
      setScanningStarted(false);
      setScannerReady(false);
      setPaused(false);
      setShowResetConfirmModal(false);
      console.log("🔄 Session Reset Confirmed");
  };

  // Calculate derived values
  const totalFingers = FINGER_ORDER.length;
  const scannedCount = Object.keys(fingerFiles).length;
  
  // Log state changes
  useEffect(() => {
    console.log(`📊 Scan State: ${scanningStarted ? 'ACTIVE' : 'STOPPED'} | Count: ${scannedCount}/${totalFingers}`);
  }, [scanningStarted, scannedCount, totalFingers]);

  // Countdown timer effect - manages countdown and respects paused state
  useEffect(() => {
    if (countdown === null || countdown <= 0 || paused) {
      return; // Don't run timer if no countdown, finished, or paused
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) {
          return 0; // Go to 0, not null
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, paused]); // Re-run when countdown or paused changes

  // Auto-advance effect - triggers when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && !paused) {
      setCountdown(null);
      
      // DEBUG: Log current state
      console.log("\n🔍 === COUNTDOWN FINISHED ===");
      console.log(`  - Ready to scan: ${FINGER_ORDER[currentFingerIndex]}`);
      
      // We don't need to advance here anymore, we did it in handleScanComplete
      // Just waiting for the user to place their finger now.
      setScannerReady(false); // Ensure scanner re-initializes
    }
  }, [countdown, paused, currentFingerIndex]);

  // Fetch session demographics on mount
  useEffect(() => {
    const storedDemo = sessionStorage.getItem("demographics");
    if (storedDemo) {
      try {
        setDemographics(JSON.parse(storedDemo));
      } catch (e) {
        console.error("Failed to parse demographics:", e);
      }
    }
  }, []);

  const currentFinger = FINGER_ORDER[currentFingerIndex];
  const [handRaw, fingerRaw] = currentFinger
    ? currentFinger.split("_")
    : ["", ""];
  const hand = handRaw as "right" | "left";
  const highlight = fingerRaw as
    | "thumb"
    | "index"
    | "middle"
    | "ring"
    | "pinky";
  const isScanned = !!fingerFiles[currentFinger];

  const handleScanComplete = (fingerName: FingerName, file: File) => {
    console.log("\n🎉 === FINGER SCAN COMPLETE ===");
    console.log(`📸 Captured: ${fingerName}`);
    console.log(`📁 File size: ${file.size} bytes`);
    
    setFingerFiles((prev) => {
      const updated = { ...prev, [fingerName]: file };
      return updated;
    });
    
    setScannerReady(false); // Reset for next finger
    setIsFirstScan(false); // No longer first scan

    // Immediately advance to next unscanned finger
    let nextIndex = currentFingerIndex;
    let foundNext = false;
    
    // Search forward
    for (let i = currentFingerIndex + 1; i < totalFingers; i++) {
        if (!fingerFiles[FINGER_ORDER[i]]) {
            nextIndex = i;
            foundNext = true;
            break;
        }
    }
    
    // If not found forward, search from beginning
    if (!foundNext) {
         for (let i = 0; i < currentFingerIndex; i++) {
            if (!fingerFiles[FINGER_ORDER[i]]) {
                nextIndex = i;
                foundNext = true;
                break;
            }
        }
    }

    if (foundNext) {
        console.log(`➡️ Advancing to next finger: ${FINGER_ORDER[nextIndex]}`);
        setCurrentFingerIndex(nextIndex);
        setCountdown(5); // Start countdown for next finger
        console.log("⏱️ Starting 5s countdown for next finger");
    } else {
        console.log("✅ All fingers scanned!");
        setCountdown(null);
    }
    console.log("================================\n");
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
    if (loading) return;
    setLoading(true);
    try {
      let activeSessionId =
        sessionId || sessionStorage.getItem("current_session_id");

      if (!activeSessionId) {
        console.error("No session ID available");
        alert("No session ID. Please restart the workflow.");
        setLoading(false);
        return;
      }

      console.log(
        `Uploading ${Object.keys(fingerFiles).length} fingerprints...`
      );

      // Upload all files
      const uploadPromises = Object.entries(fingerFiles).map(
        async ([finger, file]) => {
          return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64 = reader.result as string;
              try {
                console.log(`Uploading ${finger}...`);
                await sessionAPI.submitFingerprint(activeSessionId, {
                  finger_name: finger,
                  image: base64,
                });
                console.log(`${finger} uploaded successfully`);
                resolve();
              } catch (e) {
                console.error(`Failed to upload ${finger}:`, e);
                reject(e);
              }
            };
            reader.onerror = () =>
              reject(new Error(`Failed to read file for ${finger}`));
            reader.readAsDataURL(file);
          });
        }
      );

      await Promise.all(uploadPromises);
      console.log("All fingerprints uploaded successfully");

      // Trigger analysis
      console.log("Triggering analysis...");
      const analyzeResponse = await sessionAPI.analyze(activeSessionId);
      console.log("Analysis API response:", analyzeResponse);
      console.log("Analysis completed successfully");

      // Store results in sessionStorage for the results page
      const resultsData = {
        data: analyzeResponse.data,
        expiry: Date.now() + 3600000, // 1 hour expiry
      };
      // Encode with UTF-8 safe base64 to handle emoji/unicode in AI text
      const json = JSON.stringify(resultsData);
      const utf8Bytes = new TextEncoder().encode(json);
      let binary = "";
      utf8Bytes.forEach((b) => {
        binary += String.fromCharCode(b);
      });
      const encodedData = btoa(binary);
      sessionStorage.setItem(activeSessionId, encodedData);
      sessionStorage.setItem("current_session_id", activeSessionId);
      console.log("💾 Stored results in sessionStorage");

      console.log("🔄 Setting current step to RESULTS:", STEPS.RESULTS);
      flushSync(() => {
        setCurrentStep(STEPS.RESULTS); // Moving to results page (step 4)
      });

      console.log("🚀 About to navigate to:", ROUTES.RESULTS);
      router.push(ROUTES.RESULTS);
      console.log("✅ router.push called");
    } catch (err) {
      console.error("Submission failed:", err);
      const message = getErrorMessage(err);
      alert(`Failed to submit: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishClick = () => {
    if (loading) return;
    setShowFinishModal(true);
  };

  const handleFinishConfirm = async () => {
    if (loading) return;
    setShowFinishModal(false);
    await handleSubmit();
    // Modal will close automatically when navigation happens
  };

  const handleFinishCancel = () => {
    setShowFinishModal(false);
  };

  return (
    <ProtectedRoute requireSession={true} requiredStep={STEPS.SCAN}>
      <>
        <FinishConfirmationModal
          isOpen={showFinishModal}
          loading={loading}
          onConfirm={handleFinishConfirm}
          onCancel={handleFinishCancel}
        />

        <SessionEndModal
          isOpen={showModal}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />

        <ScanConfirmationModal
          isOpen={showScanConfirmModal}
          onConfirm={() => {
            setShowScanConfirmModal(false);
            setScanningStarted(true);
          }}
          onCancel={() => setShowScanConfirmModal(false)}
        />

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Shield className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Scanning?</h3>
                        <p className="text-gray-600 mb-8">
                            Are you sure you want to cancel? All progress for this session will be lost and you will have to start over.
                        </p>
                        <div className="flex gap-3 w-full">
                            <Button 
                                variant="outline" 
                                className="flex-1 h-12 text-base"
                                onClick={() => setShowCancelModal(false)}
                            >
                                Continue Scanning
                            </Button>
                            <Button 
                                variant="destructive" 
                                className="flex-1 h-12 text-base bg-red-600 hover:bg-red-700"
                                onClick={() => {
                                    handleResetSession();
                                    setShowCancelModal(false);
                                }}
                            >
                                Yes, Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {showResetConfirmModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <RefreshCcw className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Restart Session?</h3>
                        <p className="text-gray-600 mb-8">
                            This will clear all 10 scanned fingerprints and you will have to start over. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 w-full">
                            <Button 
                                variant="outline" 
                                className="flex-1 h-12 text-base"
                                onClick={() => setShowResetConfirmModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="destructive" 
                                className="flex-1 h-12 text-base bg-red-600 hover:bg-red-700"
                                onClick={handleResetSession}
                            >
                                Yes, Restart
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <AnalysisLoadingOverlay isOpen={loading} />

        <div className="h-screen px-28 py-4 bg-white flex flex-col overflow-hidden">
          <main className="flex-1 w-full flex flex-col">
            <div className="h-full flex flex-col px-6">
              <ProgressHeader
                currentStep={STEPS.SCAN}
                totalSteps={4}
                title="Fingerprint Scan"
                subtitle="Securely scan your fingerprints for analysis"
                accentColor="#00c2cb"
                onEndSession={promptBackNavigation}
              />

              <div>
                <div className="grid grid-cols-12 gap-2 h-full select-none">
                  {/* Left Panel - Scanning Interface - FIXED WIDTH */}
                  <div className="col-span-7 flex flex-col h-full">


                    {/* Main Scanning Card */}
                    <Card className="border-2 border-gray-300 rounded-xl shadow-lg">
                      <CardHeader className="pb-3 px-5 py-4 bg-linear-to-r from-teal-50 to-cyan-50 border-b-2 border-teal-200">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-2xl font-bold text-teal-800 flex items-center">
                            <Fingerprint className="w-7 h-7 mr-3 text-teal-600" />
                            Scan Assistant
                          </CardTitle>
                          <div className="flex items-center space-x-3">
                            <span className="text-base text-gray-600 font-semibold">
                              {scannedCount}/{totalFingers} Scanned
                            </span>
                            <div className="w-32 bg-gray-200 rounded-full h-3 shadow-inner">
                              <div
                                className="bg-linear-to-r from-teal-500 to-cyan-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                                style={{
                                  width: `${
                                    (scannedCount / totalFingers) * 100
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-lg font-bold text-teal-600">
                              {scannedCount}/{totalFingers}
                            </span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-5">
                        {/* Header Section - Moved outside grid for alignment */}
                        <div className="text-center mb-6">

                            <p className="text-lgtext-gray-600">
                              Follow the instructions to scan your fingerprints
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-5 mb-2">
                          {/* Left Col: Hand Guide */}
                          <div className="flex flex-col items-center">
                            {/* Hand Label - Top of Column */}
                            <span className={`text-lg font-bold mb-3 px-6 py-1.5 rounded-full shadow-sm ${
                              hand === 'left' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {FINGER_NAMES[currentFinger]}
                            </span>
                            
                            <div className="w-56 h-56 bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl border-3 border-dashed border-blue-300 flex items-center justify-center mb-3 shadow-inner relative">
                              <HandGuide
                                hand={hand}
                                highlightFinger={highlight}
                                className="w-48 h-48"
                              />
                            </div>
                            
                            {/* Scan Assistant Status */}
                            {(() => {
                              const currentState = (
                                scannedCount >= totalFingers ? 'completed' :
                                !scanningStarted ? 'idle' :
                                paused ? 'paused' :
                                (countdown !== null && countdown > 0) ? 'countdown' :
                                scannerReady ? 'waiting' :
                                (isFirstScan && scannedCount === 0) ? 'initializing' :
                                'preparing'
                              );
                              
                              return (
                                <div className="w-full">
                                  <ScanAssistantSubtitle
                                    scannerState={currentState as any}
                                    currentFinger={FINGER_NAMES[currentFinger]}
                                    countdown={countdown}
                                    onStartScanning={() => setShowScanConfirmModal(true)}
                                    isPaused={paused}
                                  />
                                </div>
                              );
                            })()}

                            {/* Hidden Scanner Component */}
                            {scanningStarted && scannedCount < totalFingers && (
                              <div className="hidden">
                                <FingerprintScanner
                                  onScanComplete={handleScanComplete}
                                  currentFinger={currentFinger}
                                  participantData={demographics}
                                  autoStart={scanningStarted && countdown === null}
                                  paused={paused}
                                  onScannerReady={() => setScannerReady(true)}
                                />
                              </div>
                            )}
                          </div>

                          {/* Right Col: Scan Result */}
                          <div className="flex flex-col items-center">
                             {/* Result Label - Top of Column (Aligned with Hand Label) */}
                             <span className="text-lg font-bold mb-3 px-6 py-1.5 rounded-full bg-gray-100 text-gray-700 shadow-sm">
                                Scan Result
                            </span>

                            <div className="w-56 h-56 bg-gray-100 rounded-2xl border-3 border-gray-300 flex items-center justify-center mb-3 overflow-hidden relative shadow-lg">
                              {(() => {
                                const currentFile = fingerFiles[currentFinger];
                                const capturedKeys = Object.keys(fingerFiles);
                                const lastKey = capturedKeys.length > 0 ? capturedKeys[capturedKeys.length - 1] as FingerName : null;
                                const fallbackFile = lastKey ? fingerFiles[lastKey] : null;

                                const fileToShow = currentFile || fallbackFile;
                                const isCurrent = !!currentFile;
                                const isFallback = !currentFile && !!fallbackFile;
                                const fingerNameToShow = isCurrent ? FINGER_NAMES[currentFinger] : (lastKey ? FINGER_NAMES[lastKey] : '');

                                if (fileToShow) {
                                  return (
                                    <>
                                      <div className="relative w-full h-full">
                                        <Image
                                          src={URL.createObjectURL(fileToShow)}
                                          alt={`Captured ${fingerNameToShow}`}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                      
                                      <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg ${
                                          isCurrent ? "bg-green-600 text-white" : "bg-gray-800 text-white backdrop-blur-sm"
                                      }`}>
                                        <CheckCircle className="w-4 h-4" />
                                        {isCurrent ? "Already Done" : "Latest Scan"}
                                      </div>
                                      
                                      <div className="absolute bottom-3 left-0 right-0 text-center">
                                          <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-md">
                                              {fingerNameToShow}
                                          </span>
                                      </div>
                                    </>
                                  );
                                } else {
                                  return (
                                    <div className="text-center">
                                      <Clock className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                                      <div className="text-lg font-semibold text-gray-500">
                                        Awaiting Scan
                                      </div>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Control Bar Separator */}
                        <hr className="border-t-2 border-dashed border-gray-100 my-4" />

                        {/* Dedicated Control Bar - Dynamic Buttons */}
                        <div className="flex items-center justify-center gap-4 mb-4">
                            {/* State 1: Not Started - Show Start Button */}
                            {!scanningStarted ? (
                              <Button
                                onClick={() => setShowScanConfirmModal(true)}
                                size="lg"
                                className="min-w-[200px] h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-md transition-all transform hover:scale-105"
                              >
                                <Play className="w-5 h-5 mr-2" />
                                Start Scanning
                              </Button>
                            ) : scannedCount < totalFingers ? (
                              /* State 2: Scanning - Show Pause/Resume, Restart, Cancel */
                              <>
                                {/* Pause/Resume Button */}
                                <Button
                                  onClick={() => {
                                      if (paused) {
                                          // RESUMING: Jump to the first unscanned finger
                                          const firstUnscanned = FINGER_ORDER.findIndex(f => !fingerFiles[f]);
                                          if (firstUnscanned !== -1) {
                                              setCurrentFingerIndex(firstUnscanned);
                                          }
                                          setPaused(false);
                                      } else {
                                          setPaused(true);
                                      }
                                  }}
                                  variant={paused ? "default" : "outline"}
                                  className={`min-w-[140px] font-semibold h-11 ${
                                    paused 
                                    ? "bg-green-600 hover:bg-green-700 text-white" 
                                    : "border-amber-500 text-amber-700 hover:bg-amber-50"
                                  }`}
                                >
                                  {paused ? (
                                    <>
                                      <Play className="w-4 h-4 mr-2" />
                                      Resume Scan
                                    </>
                                  ) : (
                                    <>
                                      <Pause className="w-4 h-4 mr-2" />
                                      Pause Scan
                                    </>
                                  )}
                                </Button>

                                {/* Restart Finger (Rescan) */}
                                {scannerReady && (
                                  <Button
                                    onClick={() => {
                                       setScannerReady(false);
                                       setTimeout(() => setScannerReady(true), 500); 
                                    }}
                                    variant="outline"
                                    className="min-w-[140px] h-11 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Rescan Finger
                                  </Button>
                                )}

                                {/* Cancel Session Button - Red */}
                                <Button
                                  onClick={() => setShowCancelModal(true)} // Assuming we have this, or just reload
                                  variant="ghost"
                                  className="text-red-500 hover:bg-red-50 hover:text-red-700 font-semibold h-11 px-4"
                                >
                                  Cancel
                                </Button>
                                </>
                            ) : (
                                /* State 3: Completed (10/10) - Show Restart Button */
                                <Button
                                    onClick={() => setShowResetConfirmModal(true)}
                                    variant="outline"
                                    className="min-w-[200px] h-12 border-2 border-dashed border-gray-300 text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 font-bold text-lg shadow-sm transition-all"
                                >
                                    <RefreshCcw className="w-5 h-5 mr-2" />
                                    Restart Session
                                </Button>
                            )}
                        </div>
                        
                        {/* Bottom Navigation Bar - Full Width */}
                        <div className="flex gap-4 items-center pt-2 border-t border-gray-100 mt-2">
                              <Button
                                onClick={handlePreviousFinger}
                                disabled={currentFingerIndex === 0 || (scanningStarted && !paused && scannedCount < totalFingers)}
                                variant="ghost"
                                size="lg"
                                className="flex-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                              >
                                <ChevronLeft className="w-5 h-5 mr-2" />
                                Previous
                              </Button>
                              <Button
                                onClick={handleNextFinger}
                                disabled={
                                    currentFingerIndex === totalFingers - 1 || 
                                    (scanningStarted && !paused && scannedCount < totalFingers) ||
                                    // Prevent going forward if the current finger hasn't been scanned AND we aren't done yet
                                    (scannedCount < totalFingers && currentFingerIndex >= (() => {
                                        const firstUnscanned = FINGER_ORDER.findIndex(f => !fingerFiles[f]);
                                        return firstUnscanned === -1 ? totalFingers - 1 : firstUnscanned;
                                    })())
                                }
                                variant="ghost"
                                size="lg"
                                className="flex-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                              >
                                Next Finger
                                <ChevronRight className="w-5 h-5 ml-2" />
                              </Button>
                        </div>
                      </CardContent>
                    </Card>


                    
                  </div>

                  {/* Right Panel - Instructions and Progress - FIXED WIDTH */}
                  <div className="col-span-5 flex flex-col space-y-3">

                      {/* Scanning Tips - Static */}
                <div className="col-span-4 flex flex-col space-y-3 overflow-y-auto pr-3 pb-8 scrollbar-thin scrollbar-thumb-gray-200">
                  
                  {/* 1️⃣ Session / User Info (Compact Pill) */}
                  <div className="bg-gray-50 rounded-full px-5 py-3 flex items-center gap-3 text-gray-600 shrink-0 w-fit max-w-full border border-gray-100 shadow-sm">
                    <User className="w-5 h-5 text-gray-400 shrink-0" />
                    <span className="text-base font-bold truncate">
                       {demographics?.age || '--'} yrs · <span className="capitalize">{demographics?.gender || '--'}</span> · {demographics?.weight || '--'} kg · {demographics?.height || '--'} cm · Blood: {demographics?.bloodType || 'Unknown'}
                    </span>
                  </div>

                  {/* 2️⃣ Scanning Tips (Passive Help Text) */}
                  <div className="bg-blue-50 rounded-2xl p-5 shrink-0">
                    <div className="flex items-center gap-2.5 mb-4">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                      <h4 className="font-bold text-blue-900 text-lg">Scanning Tips</h4>
                    </div>
                    <ul className="text-base text-blue-800 space-y-3 font-medium">
                      <li className="flex items-start gap-3">
                        <span className="text-xl leading-none opacity-80 pt-0.5">🧼</span>
                        <span>Clean finger and scanner surface</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-xl leading-none opacity-80 pt-0.5">👆</span>
                        <span>Press firmly but gently</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-xl leading-none opacity-80 pt-0.5">🎯</span>
                        <span>Keep finger centered and still</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-xl leading-none opacity-80 pt-0.5">💧</span>
                        <span>If too dry, lightly moisten finger</span>
                      </li>
                    </ul>
                  </div>

                  {/* 4️⃣ Important Warning */}
                  <div className="flex items-start gap-3 text-xl font-black text-gray-800 px-2 leading-snug shrink-0">
                    <AlertTriangle className="w-7 h-7 text-red-600 shrink-0" />
                    <span>This is a screening tool — not a medical diagnosis.</span>
                  </div>

                  {/* 3️⃣ Legal Disclaimer */}
                  <div className="px-2 shrink-0">
                     <p className="text-sm text-gray-500 leading-relaxed font-bold">
                       This tool provides predictive insights based on fingerprint and demographic data. It does not replace laboratory tests or medical diagnosis. Always consult healthcare professionals.
                     </p>
                  </div>
                </div>
                      {/* Right Column - Static Content Area */}
                      <div className="space-y-6">
                        {/* TODO: Add static content here */}
                        
                      </div>
   
                </div>
              </div>

            </div> {/* Close line 367 wrapper div */}
            </div> {/* Close line 358 h-full flex flex-col px-6 */}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-6 mb-4 select-none">
                <StepNavigation
                  onBack={promptBackNavigation}
                  isSubmit={false}
                  loading={loading}
                  isNextDisabled={loading || scannedCount < totalFingers}
                  nextLabel="Finish & Analyze"
                  onNext={handleFinishClick}
                />
              </div>

          </main>

          <Footer transparent customContent={<>No needles • Non-invasive • Privacy-first</>} />
        </div>
      </>
    </ProtectedRoute>
  );
}