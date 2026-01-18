"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "@/contexts/session-context";
import { sessionAPI } from "@/lib/api";
// axios removed
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import { StepNavigation } from "@/components/layout/step-navigation";
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
import { useScanSession } from "@/hooks/use-scan-session";
import { ScanAssistantCard } from "@/components/scan/scan-assistant-card";
import { ScanInfoPanel } from "@/components/scan/scan-info-panel";
import { ScanSessionModals } from "@/components/scan/scan-session-modals";

export default function ScanPage() {
  const router = useRouter();
  const { sessionId, setCurrentStep } = useSession();
  const [loading, setLoading] = useState(false);

  const {
    currentFingerIndex,
    fingerFiles,
    demographics,
    countdown,
    scannerReady,
    scanningStarted,
    paused,
    totalFingers,
    scannedCount,
    currentFinger,
    hand,
    highlight,
    scanAssistantState,
    firstUnscannedIndex,
    setScannerReady,
    setScanningStarted,
    handleResetSession,
    handleCapture,
    handleNextFinger,
    handlePreviousFinger,
    togglePaused,
    handleRescan,
    rescanningFinger,
  } = useScanSession();

  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showScanConfirmModal, setShowScanConfirmModal] = useState(false); // Confirmation modal for starting scan
  const [showCancelModal, setShowCancelModal] = useState(false); // Cancel session modal
  const { showModal, handleConfirm, handleCancel, promptBackNavigation } =
    useBackNavigation(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false); // New modal state

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const activeSessionId = sessionId || sessionStorage.getItem("current_session_id");

      if (!activeSessionId) {
        console.error("No session ID available");
        alert("No session ID. Please restart the workflow.");
        setLoading(false);
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
          reader.onerror = () => reject(new Error(`Failed to read file for ${finger}`));
          reader.readAsDataURL(file);
        });
      });

      await Promise.all(uploadPromises);
      console.log("All fingerprints uploaded successfully");

      // Trigger analysis
      console.log("Triggering analysis...");
      const analyzeResponse = await sessionAPI.analyze(activeSessionId);
      console.log("Analysis API response:", analyzeResponse);
      console.log("Analysis completed successfully");

      // Call /results endpoint to save to database AND get QR code URLs
      console.log("💾 Calling /results to save to database...");
      let finalData = analyzeResponse.data; // Fallback
      try {
        const resultsResponse = await sessionAPI.getResults(activeSessionId);
        console.log("✅ Database save result:", resultsResponse.data?.saved_to_database);
        finalData = resultsResponse.data; // Use results response (includes QR URLs!)
      } catch (resultsError) {
        console.error("⚠️ Failed to save to database:", resultsError);
        // Continue anyway - user can still see results
      }

      // Store results in sessionStorage for the results page
      const resultsData = {
        data: finalData, // Now includes qr_code_url and download_url!
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

        <ScanSessionModals
          showCancelModal={showCancelModal}
          onCloseCancel={() => setShowCancelModal(false)}
          onConfirmCancel={() => {
            handleResetSession();
            setShowCancelModal(false);
          }}
          showResetConfirmModal={showResetConfirmModal}
          onCloseReset={() => setShowResetConfirmModal(false)}
          onConfirmReset={() => {
            handleResetSession();
            setShowResetConfirmModal(false);
          }}
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
                onEndSession={promptBackNavigation}
              />
              <div>
                <div className="grid grid-cols-12 gap-2 h-full select-none">
                  {/* Left Panel - Scanning Interface - FIXED WIDTH */}
                  <div className="col-span-7 flex flex-col h-full">
                    <ScanAssistantCard
                      loading={loading}
                      currentFingerIndex={currentFingerIndex}
                      fingerFiles={fingerFiles}
                      countdown={countdown}
                      scannerReady={scannerReady}
                      scanningStarted={scanningStarted}
                      paused={paused}
                      totalFingers={totalFingers}
                      scannedCount={scannedCount}
                      currentFinger={currentFinger}
                      hand={hand}
                      highlight={highlight}
                      scanAssistantState={scanAssistantState}
                      firstUnscannedIndex={firstUnscannedIndex}
                      setScannerReady={setScannerReady}
                      onRequestStartScanning={() => setShowScanConfirmModal(true)}
                      onOpenCancelModal={() => {
                        if (!paused) togglePaused();
                        setShowCancelModal(true);
                      }}
                      onOpenResetModal={() => setShowResetConfirmModal(true)}
                      onCapture={handleCapture}
                      onPreviousFinger={handlePreviousFinger}
                      onNextFinger={handleNextFinger}
                      onTogglePaused={togglePaused}
                      onRescan={handleRescan}
                      rescanningFinger={rescanningFinger}
                    />
                  </div>

                  {/* Right Panel - Instructions and Progress - FIXED WIDTH */}
                  <ScanInfoPanel demographics={demographics} />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 mb-4 select-none">
              <StepNavigation
                onBack={() => router.back()}
                isSubmit={false}
                loading={loading}
                isNextDisabled={loading || scannedCount < totalFingers}
                nextLabel="Finish & Analyze"
                onNext={handleFinishClick}
              />
            </div>
          </main>

          <Footer
            transparent
            customContent={<>No needles • Non-invasive • Privacy-first</>}
          />
        </div>
      </>
    </ProtectedRoute>
  );
}
