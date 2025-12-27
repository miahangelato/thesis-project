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
  Fingerprint,
  RefreshCcw,
} from "lucide-react";
import { FingerName, FINGER_ORDER } from "@/types/fingerprint";
import { HandGuide } from "@/components/features/scan/hand-guide";
import FingerprintScanner from "@/components/features/scan/fingerprint-scanner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { SessionEndModal } from "@/components/modals/session-end-modal";
import {
  AnalysisLoadingOverlay,
  FinishConfirmationModal,
} from "@/components/modals/finish-modal";
import { ROUTES, STEPS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";

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

  const { showModal, handleConfirm, handleCancel } = useBackNavigation(true);

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
                await sessionAPI.submitFingerprint(sessionId, {
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
      const analyzeResponse = await sessionAPI.analyze(sessionId);
      console.log("Analysis API response:", analyzeResponse);
      console.log("Analysis completed successfully");

      // Store results in sessionStorage for the results page
      const resultsData = {
        data: analyzeResponse.data,
        expiry: Date.now() + 3600000, // 1 hour expiry
      };
      const encodedData = btoa(JSON.stringify(resultsData));
      sessionStorage.setItem(sessionId, encodedData);
      console.log("💾 Stored results in sessionStorage");

      console.log("🔄 Setting current step to RESULTS:", STEPS.RESULTS);
      setCurrentStep(STEPS.RESULTS); // Moving to results page (step 4)

      // Clear loading state BEFORE navigation
      setLoading(false);

      console.log("🚀 About to navigate to:", ROUTES.RESULTS);
      router.push(ROUTES.RESULTS);
      console.log("✅ router.push called");
    } catch (err) {
      console.error("Submission failed:", err);
      const message = getErrorMessage(err);
      alert(`Failed to submit: ${message}`);
      setLoading(false);
    }
  };

  const handleFinishClick = () => {
    setShowFinishModal(true);
  };

  const handleFinishConfirm = async () => {
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
              />

              <div>
                <div className="grid grid-cols-12 gap-2 h-full select-none">
                  {/* Left Panel - Scanning Interface */}
                  <div className="lg:col-span-7 flex flex-col h-full">
                    {/* Session Info Card - Now with demographics */}
                    <Card className="border-2 border-teal-200 rounded-lg mb-2 shrink-0 bg-linear-to-br from-teal-50 to-cyan-50">
                      <CardHeader className="pb-2 pt-4 px-5">
                        <CardTitle className="text-xl font-bold flex items-center text-teal-800">
                          <User className="w-6 h-6 mr-3 text-teal-600" />
                          Your Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-5 pb-2 pt-0">
                        {demographics ? (
                          <div className="grid grid-cols-5 gap-3 text-base">
                            <div className="flex flex-col min-w-0">
                              <span className="text-gray-600 font-medium text-sm truncate">
                                Age
                              </span>
                              <span className="font-bold text-gray-900 truncate">
                                {demographics.age} yrs
                              </span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-gray-600 font-medium text-sm truncate">
                                Gender
                              </span>
                              <span className="font-bold text-gray-900 capitalize truncate">
                                {demographics.gender}
                              </span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-gray-600 font-medium text-sm truncate">
                                Weight
                              </span>
                              <span className="font-bold text-gray-900 truncate">
                                {demographics.weight_kg} kg
                              </span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-gray-600 font-medium text-sm truncate">
                                Height
                              </span>
                              <span className="font-bold text-gray-900 truncate">
                                {demographics.height_cm} cm
                              </span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-gray-600 font-medium text-sm truncate">
                                Blood Type
                              </span>
                              <span className="font-bold text-gray-900 truncate">
                                {demographics.blood_type}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 truncate">
                            Session ID: {sessionId || "N/A"}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Main Scanning Card */}
                    <Card className="border-2 border-gray-300 rounded-xl shadow-lg">
                      <CardHeader className="pb-3 px-5 py-4 bg-linear-to-r from-teal-50 to-cyan-50 border-b-2 border-teal-200">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-2xl font-bold text-teal-800 flex items-center">
                            <Fingerprint className="w-7 h-7 mr-3 text-teal-600" />
                            {FINGER_NAMES[currentFinger]}
                          </CardTitle>
                          <div className="flex items-center space-x-3">
                            <span className="text-base text-gray-600 font-semibold">
                              Finger {currentFingerIndex + 1} of {totalFingers}
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
                        <div className="grid grid-cols-2 gap-5">
                          {/* Hand Guide */}
                          <div className="flex flex-col items-center">
                            <h4 className="text-xl font-bold mb-3 text-gray-800">
                              Position Your {hand === "left" ? "Left" : "Right"}{" "}
                              Hand
                            </h4>
                            <div className="w-56 h-56 bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl border-3 border-dashed border-blue-300 flex items-center justify-center mb-3 shadow-inner">
                              <HandGuide
                                hand={hand}
                                highlightFinger={highlight}
                                className="w-48 h-48"
                              />
                            </div>
                            <p className="text-center text-gray-700 mb-3 text-base font-semibold">
                              Place your{" "}
                              <strong className="text-blue-600 text-lg">
                                {highlight}
                              </strong>{" "}
                              finger on the scanner
                            </p>

                            <div className="mb-2">
                              <FingerprintScanner
                                onScanComplete={handleScanComplete}
                                currentFinger={currentFinger}
                              />
                            </div>

                            {isScanned && (
                              <Button
                                onClick={() =>
                                  setFingerFiles((prev) => ({
                                    ...prev,
                                    [currentFinger]: undefined,
                                  }))
                                }
                                variant="outline"
                                size="lg"
                                className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 text-base font-semibold px-5 py-2.5 mt-2 cursor-pointer"
                              >
                                <RotateCcw className="w-5 h-5 mr-2" />
                                Rescan This Finger
                              </Button>
                            )}
                          </div>

                          {/* Scan Result */}
                          <div className="flex flex-col items-center">
                            <h4 className="text-xl font-bold mb-3 text-gray-800">
                              Scan Result
                            </h4>
                            <div className="w-56 h-56 bg-gray-100 rounded-2xl border-3 border-gray-300 flex items-center justify-center mb-3 overflow-hidden relative shadow-lg">
                              {isScanned ? (
                                <>
                                  <ScanPreview
                                    file={fingerFiles[currentFinger]}
                                    fingerName={currentFinger}
                                  />
                                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                                    <CheckCircle className="w-4 h-4" />
                                    Captured
                                  </div>
                                </>
                              ) : (
                                <div className="text-center">
                                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                                  <div className="text-lg font-semibold text-gray-500">
                                    Awaiting Scan
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-3">
                              <Button
                                onClick={handlePreviousFinger}
                                disabled={currentFingerIndex === 0}
                                variant="outline"
                                size="lg"
                                className="text-base px-5 py-2.5 font-semibold cursor-pointer"
                              >
                                <ChevronLeft className="w-5 h-5 mr-2" />
                                Previous
                              </Button>
                              <Button
                                onClick={handleNextFinger}
                                disabled={
                                  currentFingerIndex === totalFingers - 1 ||
                                  !isScanned
                                }
                                variant="outline"
                                size="lg"
                                className="text-base px-5 py-2.5 font-semibold cursor-pointer"
                              >
                                Next Finger
                                <ChevronRight className="w-5 h-5 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Panel - Instructions and Progress */}
                  <div className="lg:col-span-5 flex flex-col space-y-3">
                    {/* Instructions Card */}
                    <Card className="border-2 border-blue-200 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-lg font-bold flex items-center text-blue-800">
                          <Info className="w-5 h-5 mr-2 text-blue-600" />
                          Scanning Instructions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3 pt-0">
                        <div className="space-y-2.5 text-sm text-gray-700">
                          <div className="flex items-start space-x-3">
                            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              1
                            </div>
                            <p className="font-medium">
                              Place the highlighted finger on the scanner device
                            </p>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              2
                            </div>
                            <p className="font-medium">
                              Press firmly and hold still for 2-3 seconds
                            </p>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              3
                            </div>
                            <p className="font-medium">
                              Wait for confirmation before moving to the next
                              finger
                            </p>
                          </div>
                          <div className="p-2.5 bg-white/80 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800 font-semibold">
                              💡 Tip: Clean, dry fingers work best for scanning.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Progress Overview Card */}
                    <Card className="border-2 border-teal-200 rounded-xl bg-white">
                      <CardHeader className="pb-3 pt-4 px-5">
                        <CardTitle className="text-xl font-bold flex items-center text-teal-800">
                          <Activity className="w-6 h-6 mr-3 text-teal-600" />
                          Progress Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-5 pb-5 pt-0">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="text-center p-4 bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 shadow-sm">
                            <div className="text-3xl font-bold text-green-600">
                              {scannedCount}
                            </div>
                            <div className="text-base font-semibold text-green-700 mt-1">
                              Completed
                            </div>
                          </div>
                          <div className="text-center p-4 bg-linear-to-br from-slate-50 to-gray-50 rounded-xl border-2 border-slate-300 shadow-sm">
                            <div className="text-3xl font-bold text-slate-600">
                              {totalFingers - scannedCount}
                            </div>
                            <div className="text-base font-semibold text-slate-700 mt-1">
                              Remaining
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                          {FINGER_ORDER.map((finger, index) => {
                            const isCompleted = !!fingerFiles[finger];
                            const isCurrent = index === currentFingerIndex;
                            const fingerParts = FINGER_NAMES[finger].split(" ");
                            const hand = fingerParts[0]; // Left or Right
                            const fingerName = fingerParts[1]; // Thumb, Index, etc.
                            const isDisabled = !isCurrent && !isCompleted;
                            return (
                              <button
                                key={finger}
                                onClick={() => {
                                  if (isDisabled) return;
                                  setCurrentFingerIndex(index);
                                }}
                                disabled={isDisabled}
                                className={`
                                w-full p-3 text-base rounded-md font-semibold border-2 transition-all text-left flex items-center justify-between cursor-pointer disabled:cursor-not-allowed
                                ${
                                  isCurrent
                                    ? "bg-teal-500 text-white border-teal-600 shadow-lg scale-105"
                                    : isCompleted
                                    ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                                    : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                                }
                              `}
                              >
                                <div className="flex items-center">
                                  <div className="flex flex-col mr-2">
                                    {isCompleted && (
                                      <CheckCircle className="w-4 h-4 mb-1" />
                                    )}
                                    <span className="font-bold text-sm">
                                      {index + 1}.
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-bold text-sm">
                                      {fingerName}
                                    </div>
                                    <div className="text-xs opacity-80">
                                      ({hand} Hand)
                                    </div>
                                  </div>
                                </div>
                                {isCurrent && (
                                  <Fingerprint className="w-5 h-5 animate-pulse" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-between items-center mt-6 mb-4 select-none">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/demographics")}
                  className="flex items-center border-2 border-gray-300 hover:bg-gray-50 h-14 px-6 text-base font-bold cursor-pointer rounded-xl"
                >
                  <ChevronLeft className="w-6 h-6 mr-2" />
                  Back
                </Button>

                <Button
                  type="button"
                  onClick={handleFinishClick}
                  disabled={loading || scannedCount < totalFingers}
                  className="flex items-center gap-2 px-6 py-2 h-14 rounded-xl bg-[#00c2cb] hover:bg-[#00a8b0] text-white font-bold text-xl shadow-lg cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full inline-block mr-3" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Finish & Analyze
                      <ChevronRight className="w-6 h-6 ml-3" />
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Footer fixed={true} />
          </main>
        </div>
      </>
    </ProtectedRoute>
  );
}
