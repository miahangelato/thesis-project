"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/contexts/session-context";
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import React from "react";
import { useRouter } from "next/navigation";
import { ROUTES, STEPS } from "@/lib/constants";
import {
  Droplets,
  TrendingUp,
  Heart,
  Hospital,
  CheckCircle,
  Info,
  MapPin,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  User,
  Activity,
  Download,
  QrCode,
  Smartphone,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { QRCodeSVG } from "qrcode.react";
import { SessionEndModal } from "@/components/modals/session-end-modal";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { sessionAPI } from "@/lib/api";

interface DiabetesResult {
  diabetes_risk?: string;
  confidence?: number;
}

interface BloodGroupResult {
  predicted_blood_group?: string;
  confidence?: number;
}

type TabType = "results" | "facilities" | "download";

export default function ResultPage() {
  const router = useRouter();
  const { sessionId, clearSession } = useSession();
  const [result, setResult] = useState<DiabetesResult | null>(null);
  const [bloodGroupResult, setBloodGroupResult] =
    useState<BloodGroupResult | null>(null);
  const [participantData, setParticipantData] = useState<any>(null);
  const [demographics, setDemographics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("results");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const { showModal, handleConfirm, handleCancel } = useBackNavigation(true);

  // Fetch demographics from sessionStorage (same as scan page)
  useEffect(() => {
    const storedDemo = sessionStorage.getItem("demographics");
    if (storedDemo) {
      try {
        setDemographics(JSON.parse(storedDemo));
        console.log("✅ Loaded demographics from sessionStorage:", storedDemo);
      } catch (e) {
        console.error("Failed to parse demographics:", e);
      }
    } else {
      console.warn("⚠️ No demographics found in sessionStorage");
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      console.log("🔍 [Results Page - New] Loading results...");

      // Try to get sessionId from context or fallback to sessionStorage
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        activeSessionId = sessionStorage.getItem("current_session_id");
        console.log(
          "⚠️ No sessionId from context, using fallback:",
          activeSessionId
        );
      }

      if (!activeSessionId) {
        console.warn("⚠️ No session ID available");
        setLoading(false);
        return;
      }

      try {
        // Try to get data from sessionStorage first
        const encodedData = sessionStorage.getItem(activeSessionId!);

        if (encodedData) {
          console.log("📦 Found data in sessionStorage");
          const dataString = atob(encodedData);
          const dataWithExpiry = JSON.parse(dataString);

          // Check expiry
          if (Date.now() > dataWithExpiry.expiry) {
            console.warn("⏰ Data expired");
            sessionStorage.removeItem(activeSessionId!);
            setLoading(false);
            return;
          }

          const data = dataWithExpiry.data;
          console.log("✅ Loaded data:", data);

          // Map API response to component state
          setResult({
            diabetes_risk: data.risk_level || "Unknown",
            confidence: data.diabetes_risk || 0,
          });

          setBloodGroupResult({
            predicted_blood_group: data.blood_group || "Unknown",
            confidence: data.blood_group_confidence || 0,
          });

          setParticipantData({
            age: data.demographics?.age || data.age || 0,
            weight: data.demographics?.weight_kg || data.weight_kg || 0,
            height: data.demographics?.height_cm || data.height_cm || 0,
            gender: data.demographics?.gender || data.gender || "N/A",
            blood_type: data.blood_group || "Unknown",
            willing_to_donate:
              data.demographics?.willing_to_donate ||
              data.willing_to_donate ||
              false,
            saved: data.saved_to_database || false,
            participant_id: activeSessionId,
            explanation: data.explanation || "",
            blood_centers: data.blood_centers || [],
            nearby_facilities: data.nearby_facilities || [],
            pattern_counts: data.pattern_counts || {},
            bmi: data.bmi || 0,
          });

          console.log("✅ State updated successfully");
          setLoading(false);
        } else {
          console.error("❌ No data in sessionStorage for session:", sessionId);
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ Error parsing session data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const handleNewSession = () => {
    clearSession();
    router.push(ROUTES.HOME);
  };

  const generatePDF = async () => {
    if (!sessionId) return;
    try {
      setPdfLoading(true);
      setPdfError(null);
      const response = await sessionAPI.generatePDF(sessionId);
      setPdfUrl(response.data.pdf_url);
    } catch (err: any) {
      console.error("Failed to generate PDF:", err);
      setPdfError(
        err.response?.data?.error || "Failed to generate PDF report."
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDirectDownload = async () => {
    if (!pdfUrl) return;
    try {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `health_report_${sessionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      setPdfError("Failed to download PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (!result || !bloodGroupResult || !participantData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No results found</p>
          <button
            onClick={handleNewSession}
            className="bg-cyan-500 text-white px-6 py-3 rounded-lg hover:bg-cyan-600"
          >
            Start New Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireSession={true} requiredStep={STEPS.SCAN}>
      <>
        <SessionEndModal
          isOpen={showModal}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
        <div className="h-screen bg-white flex flex-col overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex flex-col px-28 py-6 overflow-hidden">
              <ProgressHeader
                currentStep={STEPS.RESULTS}
                totalSteps={4}
                title="Analysis Results"
                subtitle="Your health analysis is complete"
                accentColor="#00c2cb"
              />

              <div className="grid grid-cols-12 gap-6 overflow-hidden mb-6">
                {/* Left Sidebar - Results & Profile */}
                <div className="col-span-4 flex flex-col">
                  {/* Profile Card with All Info */}
                  <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-5 h-full flex flex-col overflow-hidden">
                    {/* Profile Header */}
                    <div className="text-center mb-4">
                      <div className="w-20 h-20 bg-linear-to-br from-teal-400 to-cyan-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-800">
                        Participant Profile
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Session: {sessionId?.slice(0, 8)}...
                      </p>
                    </div>
                    {/* Demographics Section */}
                    <div className="flex-1 overflow-y-auto">
                      <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                        Demographics
                      </h4>
                      {demographics ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2">
                            <span className="text-sm text-gray-600">Age</span>
                            <span className="text-sm font-bold text-gray-900">
                              {demographics?.age || "N/A"} years
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2">
                            <span className="text-sm text-gray-600">
                              Gender
                            </span>
                            <span className="text-sm font-bold text-gray-900 capitalize">
                              {demographics?.gender || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2.5">
                            <span className="text-sm text-gray-600">
                              Blood Type
                            </span>
                            <span className="text-sm font-bold text-gray-900 capitalize">
                              {demographics?.blood_type || "Unknown"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2.5">
                            <span className="text-sm text-gray-600">
                              Height
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {demographics?.height_cm || "N/A"} cm
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2.5">
                            <span className="text-sm text-gray-600">
                              Weight
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {demographics?.weight_kg || "N/A"} kg
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2.5">
                            <span className="text-sm text-gray-600">BMI</span>
                            <span className="text-sm font-bold text-gray-900">
                              {participantData?.bmi?.toFixed(1) || "N/A"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Loading demographics...
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => router.push(ROUTES.SCAN)}
                      className="font-bold cursor-pointer mt-4"
                    >
                      ← Back
                    </Button>
                  </div>
                </div>

                {/* Right Content Area - Tabs */}
                <div className="col-span-8 flex flex-col overflow-hidden">
                  {/* Tab Navigation */}
                  <div className="flex space-x-3 mb-3">
                    <button
                      onClick={() => setActiveTab("results")}
                      className={`flex-1 py-3 px-4 rounded-lg font-bold text-base transition-all cursor-pointer ${
                        activeTab === "results"
                          ? "bg-linear-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
                          : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
                      }`}
                    >
                      <Activity className="w-5 h-5 inline mr-2" />
                      Health Results
                    </button>
                    <button
                      onClick={() => setActiveTab("facilities")}
                      className={`flex-1 py-3 px-4 rounded-lg font-bold text-base transition-all cursor-pointer ${
                        activeTab === "facilities"
                          ? "bg-linear-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
                          : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
                      }`}
                    >
                      <Hospital className="w-5 h-5 inline mr-2" />
                      Recommended Facilities
                    </button>
                    <button
                      onClick={() => setActiveTab("download")}
                      className={`flex-1 py-3 px-4 rounded-lg font-bold text-base transition-all cursor-pointer ${
                        activeTab === "download"
                          ? "bg-linear-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
                          : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
                      }`}
                    >
                      <FileText className="w-5 h-5 inline mr-2" />
                      Download Results
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden min-h-0">
                    <div className="h-full overflow-y-auto p-5">
                      {activeTab === "results" && (
                        <div className="space-y-4">
                          <h2 className="text-xl font-bold text-gray-800 mb-4">
                            Health Analysis Results
                          </h2>

                          <div className="flex flex-row gap-4 justify-center items-stretch">
                            {/* Blood Type Card - Large */}
                            <div className="flex-1 bg-linear-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                              <div className="flex items-center mb-3">
                                <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                                  <Droplets className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-blue-700 mb-1">
                                    Predicted Blood Type
                                  </p>
                                  <p className="text-4xl font-bold text-blue-900">
                                    {bloodGroupResult?.predicted_blood_group ||
                                      "Unknown"}
                                  </p>
                                </div>
                              </div>
                              {bloodGroupResult?.confidence && (
                                <div className="mt-4 pt-4 border-t border-blue-200">
                                  <p className="text-sm text-blue-600">
                                    Confidence Level:{" "}
                                    <span className="font-bold text-lg">
                                      {(
                                        bloodGroupResult.confidence * 100
                                      ).toFixed(1)}
                                      %
                                    </span>
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Diabetes Risk Card - Large */}
                            <div
                              className={`flex-1 border-2 rounded-xl p-6 shadow-lg ${
                                result?.diabetes_risk?.toLowerCase() ===
                                  "diabetic" ||
                                result?.diabetes_risk?.toLowerCase() === "high"
                                  ? "bg-linear-to-br from-red-50 to-pink-50 border-red-200"
                                  : "bg-linear-to-br from-green-50 to-emerald-50 border-green-200"
                              }`}
                            >
                              <div className="flex items-center mb-3">
                                <div
                                  className={`w-14 h-14 rounded-xl flex items-center justify-center mr-3 ${
                                    result?.diabetes_risk?.toLowerCase() ===
                                      "diabetic" ||
                                    result?.diabetes_risk?.toLowerCase() ===
                                      "high"
                                      ? "bg-red-500"
                                      : "bg-green-500"
                                  }`}
                                >
                                  <TrendingUp className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                  <p
                                    className={`text-xs font-medium mb-1 ${
                                      result?.diabetes_risk?.toLowerCase() ===
                                        "diabetic" ||
                                      result?.diabetes_risk?.toLowerCase() ===
                                        "high"
                                        ? "text-red-700"
                                        : "text-green-700"
                                    }`}
                                  >
                                    Diabetes Risk Assessment
                                  </p>
                                  <p
                                    className={`text-4xl font-bold ${
                                      result?.diabetes_risk?.toLowerCase() ===
                                        "diabetic" ||
                                      result?.diabetes_risk?.toLowerCase() ===
                                        "high"
                                        ? "text-red-900"
                                        : "text-green-900"
                                    }`}
                                  >
                                    {result?.diabetes_risk || "Unknown"}
                                  </p>
                                </div>
                              </div>
                              {result?.confidence && (
                                <div
                                  className={`mt-4 pt-4 border-t ${
                                    result?.diabetes_risk?.toLowerCase() ===
                                      "diabetic" ||
                                    result?.diabetes_risk?.toLowerCase() ===
                                      "high"
                                      ? "border-red-200"
                                      : "border-green-200"
                                  }`}
                                >
                                  <p
                                    className={`text-sm ${
                                      result?.diabetes_risk?.toLowerCase() ===
                                        "diabetic" ||
                                      result?.diabetes_risk?.toLowerCase() ===
                                        "high"
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    Confidence Level:{" "}
                                    <span className="font-bold text-lg">
                                      {(result.confidence * 100).toFixed(1)}%
                                    </span>
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* AI Health Insights */}
                          {participantData?.explanation && (
                            <div className="bg-linear-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
                              <h3 className="font-bold text-lg text-purple-900 mb-3 flex items-center">
                                <Info className="w-6 h-6 mr-2" />
                                AI-Generated Health Insights
                              </h3>
                              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                                {participantData.explanation}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === "facilities" && (
                        <div className="space-y-4">
                          {/* Health Facilities */}
                          {participantData?.nearby_facilities &&
                            participantData.nearby_facilities.length > 0 && (
                              <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                                  <Hospital className="w-6 h-6 mr-2 text-teal-600" />
                                  Health Facilities Near You
                                </h2>
                                <div className="space-y-3">
                                  {participantData.nearby_facilities.map(
                                    (facility: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="bg-linear-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
                                      >
                                        <h4 className="font-bold text-lg text-gray-900 mb-2">
                                          {facility.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-3 flex items-center">
                                          <MapPin className="w-4 h-4 mr-2" />
                                          {facility.address}
                                        </p>

                                        {/* Map Embed */}
                                        <div className="mb-3 rounded-lg overflow-hidden border-2 border-gray-300">
                                          <iframe
                                            src={`https://www.google.com/maps?q=${encodeURIComponent(
                                              facility.google_query
                                            )}&output=embed`}
                                            width="100%"
                                            height="200"
                                            style={{ border: 0 }}
                                            loading="lazy"
                                            title={facility.name}
                                          ></iframe>
                                        </div>

                                        <div className="flex gap-3">
                                          {facility.phone && (
                                            <a
                                              href={`tel:${facility.phone}`}
                                              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                                            >
                                              📞 {facility.phone}
                                            </a>
                                          )}
                                          <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                              facility.google_query
                                            )}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                                          >
                                            <MapPin className="w-4 h-4 mr-2" />
                                            View on Map
                                          </a>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Blood Donation Centers */}
                          {participantData?.blood_centers &&
                            participantData.blood_centers.length > 0 && (
                              <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                                  <Heart className="w-6 h-6 mr-2 text-red-600" />
                                  Blood Donation Centers
                                </h2>
                                <div className="space-y-3">
                                  {participantData.blood_centers.map(
                                    (center: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="bg-linear-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
                                      >
                                        <h4 className="font-bold text-lg text-gray-900 mb-2 flex items-center">
                                          <Heart className="w-5 h-5 mr-2 text-red-500" />
                                          {center.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-3 flex items-center">
                                          <MapPin className="w-4 h-4 mr-2" />
                                          {center.address}
                                        </p>

                                        {/* Map Embed */}
                                        <div className="mb-3 rounded-lg overflow-hidden border-2 border-gray-300">
                                          <iframe
                                            src={`https://www.google.com/maps?q=${encodeURIComponent(
                                              center.google_query
                                            )}&output=embed`}
                                            width="100%"
                                            height="200"
                                            style={{ border: 0 }}
                                            loading="lazy"
                                            title={center.name}
                                          ></iframe>
                                        </div>

                                        <div className="flex gap-3">
                                          {center.phone && (
                                            <a
                                              href={`tel:${center.phone}`}
                                              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                                            >
                                              📞 {center.phone}
                                            </a>
                                          )}
                                          <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                              center.google_query
                                            )}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                                          >
                                            <MapPin className="w-4 h-4 mr-2" />
                                            View on Map
                                          </a>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      {activeTab === "download" && (
                        <div className="space-y-4">
                          <h2 className="text-xl font-bold text-gray-800 mb-4">
                            Download Your Results
                          </h2>

                          {!pdfUrl ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <FileText className="w-16 h-16 text-teal-600 mb-4" />
                              <p className="text-gray-700 mb-4 font-medium">
                                Generate your PDF report
                              </p>
                              <Button
                                onClick={generatePDF}
                                disabled={pdfLoading}
                                className="bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-3 px-8 rounded-xl cursor-pointer"
                              >
                                {pdfLoading ? (
                                  <>
                                    <span className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full inline-block" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <FileText className="w-5 h-5 mr-2 inline" />
                                    Generate PDF Report
                                  </>
                                )}
                              </Button>
                              {pdfError && (
                                <p className="text-red-600 text-sm mt-3">
                                  {pdfError}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* QR Code Section */}
                              <div className="bg-gray-100 rounded-lg p-6">
                                <div className="flex flex-col items-center space-y-4">
                                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                                    <QrCode className="h-6 w-6" />
                                    Scan to Download
                                  </div>

                                  <div className="bg-white p-4 rounded-lg shadow-inner">
                                    <QRCodeSVG
                                      value={pdfUrl}
                                      size={200}
                                      level="M"
                                      includeMargin={true}
                                    />
                                  </div>

                                  <div className="flex items-start gap-2 text-sm text-gray-600 max-w-sm text-center">
                                    <Smartphone className="h-4 w-4 mt-0.5 shrink-0" />
                                    <p>
                                      Scan this QR code with your smartphone to
                                      download the PDF report directly
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Direct Download Section */}
                              <div className="space-y-3">
                                <div className="text-center text-sm text-gray-600">
                                  Or download directly
                                </div>

                                <Button
                                  onClick={handleDirectDownload}
                                  className="w-full bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl cursor-pointer"
                                >
                                  <Download className="w-5 h-5 mr-2 inline" />
                                  Download PDF Report
                                </Button>
                              </div>

                              {/* Reset Button */}
                              <button
                                onClick={() => {
                                  setPdfUrl(null);
                                  setPdfError(null);
                                }}
                                className="w-full text-teal-600 hover:text-teal-700 font-medium text-sm py-2"
                              >
                                Generate Another Report
                              </button>
                            </div>
                          )}

                          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-blue-800 flex items-start">
                              <Info className="w-5 h-5 mr-2 mt-0.5 shrink-0" />
                              <span>
                                <strong>Important:</strong> This report is for
                                informational purposes only and should not
                                replace professional medical advice. Please
                                consult with a healthcare provider for proper
                                diagnosis and treatment.
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Footer fixed={true} />
          </main>
        </div>
      </>
    </ProtectedRoute>
  );
}
