"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/contexts/session-context";
import { sessionAPI } from "@/lib/api";
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { preventiveHealthAdvice } from "@/data/medical/preventive";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Droplets,
  Heart,
  AlertTriangle,
  CheckCircle,
  Info,
  Activity,
  Download,
  RefreshCw,
  HelpCircle,
  ChevronRight,
  FileText,
  Home
} from "lucide-react";

// Types
interface DiabetesResult {
  diabetes_risk?: string;
  confidence?: number;
}

interface BloodGroupResult {
  predicted_blood_group?: string;
  confidence?: number;
}

interface BloodDonationEligibility {
  eligible: boolean;
  reasons: string[];
  criteria: {
    [key: string]: {
      status: 'pass' | 'fail' | 'unknown';
      value: string;
      requirement: string;
    };
  };
  summary?: {
    total_criteria: number;
    passed_criteria: number;
    failed_criteria: number;
    unknown_criteria: number;
  };
}

// Eligibility Display Component
const EligibilityDisplay: React.FC<{ eligibilityData?: BloodDonationEligibility }> = ({ eligibilityData }) => {
  if (!eligibilityData) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
        <div className="text-center">
          <RefreshCw className="h-6 w-6 text-gray-400 mx-auto mb-2 animate-spin" />
          <p className="text-sm text-gray-600">Analyzing eligibility...</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'fail': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-700';
      case 'fail': return 'text-red-700';
      default: return 'text-blue-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className={`rounded-lg p-4 border ${
        eligibilityData.eligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center mb-2">
          {eligibilityData.eligible ? (
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          )}
          <span className={`text-lg font-semibold ${
            eligibilityData.eligible ? 'text-green-800' : 'text-red-800'
          }`}>
            {eligibilityData.eligible ? 'Eligible to Donate' : 'Not Eligible to Donate'}
          </span>
        </div>
        
        {eligibilityData.reasons.length > 0 && (
          <div className="mt-2">
            <ul className="space-y-1">
              {eligibilityData.reasons.map((reason, index) => (
                <li key={index} className="text-sm text-red-700 flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Criteria Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Checklist</h4>
        <div className="space-y-2">
          {Object.entries(eligibilityData.criteria).map(([key, criterion]) => (
            <div key={key} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                {getStatusIcon(criterion.status)}
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${getStatusColor(criterion.status)}`}>
                  {criterion.value}
                </div>
                <div className="text-xs text-gray-500">
                  Required: {criterion.requirement}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ResultsPage() {
  const { sessionId, clearSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  
  const [diabetesResult, setDiabetesResult] = useState<DiabetesResult | null>(null);
  const [bloodGroupResult, setBloodGroupResult] = useState<BloodGroupResult | null>(null);
  const [participantData, setParticipantData] = useState<any>(null);
  const [eligibility, setEligibility] = useState<BloodDonationEligibility | null>(null);

  const handleNewSession = () => {
    clearSession();
    window.location.href = '/';
  };

  const handleBackHome = () => {
    clearSession();
    window.location.href = '/';
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const response = await sessionAPI.getResults(sessionId);
        const data = response.data;
        
        // Adapt response data to our state
        // Assuming API returns { diabetesResult, bloodGroupResult, participant }
        // Adjust these mappings based on actual API response structure
        setDiabetesResult(data.diabetesResult || { diabetes_risk: "Unknown", confidence: 0 });
        setBloodGroupResult(data.bloodGroupResult || { predicted_blood_group: "Unknown", confidence: 0 });
        setParticipantData(data.participant || {});
        
        // Mock eligibility calculation (or get from API if available)
        const mockEligibility = calculateMockEligibility(data.participant || {});
        setEligibility(mockEligibility);

      } catch (err) {
        console.error("Failed to fetch results:", err);
        // Set mock data for demo/fallback
        setDiabetesResult({ diabetes_risk: "Not at Risk", confidence: 0.92 });
        setBloodGroupResult({ predicted_blood_group: "O+", confidence: 0.88 });
        setParticipantData({ age: 24, weight: 65, height: 175, willing_to_donate: true });
        setEligibility(calculateMockEligibility({ age: 24, weight: 65, height: 175 }));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const calculateMockEligibility = (data: any): BloodDonationEligibility => {
    const age = parseInt(data.age) || 0;
    const weight = parseFloat(data.weight) || 0;
    
    // Very basic checks
    const agePass = age >= 16 && age <= 65;
    const weightPass = weight >= 50;
    const eligible = agePass && weightPass;
    
    const reasons = [];
    if (!agePass) reasons.push("Age must be between 16-65");
    if (!weightPass) reasons.push("Weight must be at least 50kg");

    return {
      eligible,
      reasons,
      criteria: {
        age: { 
          status: agePass ? 'pass' : 'fail', 
          value: `${age} years`, 
          requirement: '16-65 years' 
        },
        weight: { 
          status: weightPass ? 'pass' : 'fail', 
          value: `${weight}kg`, 
          requirement: '≥50kg' 
        }
      },
      summary: {
        total_criteria: 2,
        passed_criteria: (agePass ? 1 : 0) + (weightPass ? 1 : 0),
        failed_criteria: (!agePass ? 1 : 0) + (!weightPass ? 1 : 0),
        unknown_criteria: 0
      }
    };
  };

  // Helper for tab content
  const tabs = [
    { id: "Overview", icon: Activity, label: "Overview" },
    { id: "Health Tips", icon: Heart, label: "Health Tips" },
    { id: "How it Works", icon: HelpCircle, label: "How it Works" },
    { id: "Download", icon: Download, label: "Download Report" },
  ];

  if (loading) {
    return (
       <div className="h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <RefreshCw className="h-10 w-10 text-[#00c2cb] animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Analyzing Fingerprints...</h2>
            <p className="text-gray-500 mt-2">Our AI is processing your biometric data</p>
          </div>
       </div>
    );
  }

  // If no session/results (and not loading), show empty state
  if (!diabetesResult && !loading) {
     return (
        <div className="h-screen flex flex-col items-center justify-center bg-white p-6">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Results Found</h2>
            <p className="text-gray-600 mb-6">We couldn't retrieve your analysis results.</p>
            <Button onClick={() => window.location.href = '/'}>Go Home</Button>
        </div>
     );
  }

  const isDiabetic = diabetesResult?.diabetes_risk?.toLowerCase() === "at risk";
  
  return (
    <ProtectedRoute requireSession={true} requiredStep={4}>
    <div className="h-screen bg-white flex flex-col">
       <main className="flex-1 w-full px-6 md:px-12 lg:px-16 xl:px-24 py-4 flex flex-col overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full">
            <ProgressHeader 
              currentStep={4}
              totalSteps={4}
              title="Analysis Results"
              subtitle="Here is your personalized health assessment based on dermatoglyphics."
              accentColor="#00c2cb"
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
               {/* Left Menu (3 cols) */}
               <div className="lg:col-span-3">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden sticky top-4">
                     {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                           <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
                                 isActive 
                                 ? "bg-teal-50 text-teal-700 border-[#00c2cb]" 
                                 : "text-gray-600 hover:bg-gray-50 border-transparent"
                              }`}
                           >
                              <Icon className={`w-4 h-4 mr-3 ${isActive ? "text-[#00c2cb]" : "text-gray-400"}`} />
                              {tab.label}
                           </button>
                        );
                     })}
                  </div>
               </div>

               {/* Main Content (9 cols) */}
               <div className="lg:col-span-9">
                  {/* Overview Tab */}
                  {activeTab === "Overview" && (
                     <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Summary Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {/* Blood Type Card */}
                           <div className="bg-white border rounded-xl p-5 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                              <div className="relative z-10">
                                 <h3 className="text-gray-500 text-sm font-medium mb-1">Predicted Blood Type</h3>
                                 <div className="flex items-end">
                                    <span className="text-4xl font-bold text-gray-800">
                                       {bloodGroupResult?.predicted_blood_group || "Unknown"}
                                    </span>
                                    <span className="text-sm text-gray-400 ml-2 mb-1">
                                       {(bloodGroupResult?.confidence || 0 * 100).toFixed(0)}% Confidence
                                    </span>
                                 </div>
                              </div>
                           </div>

                           {/* Diabetes Risk Card */}
                           <div className="bg-white border rounded-xl p-5 shadow-sm relative overflow-hidden">
                              <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 z-0 ${
                                 isDiabetic ? "bg-orange-50" : "bg-green-50"
                              }`}></div>
                              <div className="relative z-10">
                                 <h3 className="text-gray-500 text-sm font-medium mb-1">Diabetes Risk Assessment</h3>
                                 <div className="flex items-end">
                                    <span className={`text-4xl font-bold ${isDiabetic ? "text-orange-600" : "text-green-600"}`}>
                                       {diabetesResult?.diabetes_risk || "Unknown"}
                                    </span>
                                    <span className="text-sm text-gray-400 ml-2 mb-1">
                                       {(diabetesResult?.confidence || 0 * 100).toFixed(0)}% Confidence
                                    </span>
                                 </div>
                              </div>
                           </div>
                        </div>

                         {/* Donation Eligibility Section */}
                         {participantData?.willing_to_donate && (
                           <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                              <div className="flex items-center mb-4">
                                 <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                                    <Droplets className="w-5 h-5 text-red-600" />
                                 </div>
                                 <h3 className="text-lg font-bold text-gray-800">Blood Donation Eligibility</h3>
                              </div>
                              <EligibilityDisplay eligibilityData={eligibility || undefined} />
                           </div>
                        )}

                        {/* Recommendation Banner */}
                        <div className={`border rounded-xl p-4 flex items-start ${
                           isDiabetic ? "bg-orange-50 border-orange-200" : "bg-teal-50 border-teal-200"
                        }`}>
                           <Info className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                              isDiabetic ? "text-orange-600" : "text-teal-600"
                           }`} />
                           <div>
                              <h4 className={`font-semibold ${
                                 isDiabetic ? "text-orange-800" : "text-teal-800"
                              }`}>
                                 Recommendation
                              </h4>
                              <p className={`text-sm mt-1 ${
                                 isDiabetic ? "text-orange-700" : "text-teal-700"
                              }`}>
                                 {isDiabetic 
                                    ? "Based on the assessment, we recommend consulting a healthcare provider for a comprehensive check-up. This is a preliminary screening only."
                                    : "You are not showing signs of diabetes risk based on our dermatoglyphic analysis. Maintain a healthy lifestyle!"
                                 }
                              </p>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Health Tips Tab */}
                  {activeTab === "Health Tips" && (
                     <div className="space-y-4 animate-in fade-in duration-300">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Preventive Health Guidelines</h3>
                        {preventiveHealthAdvice.map((item, idx) => (
                           <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-start">
                                 <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                    <Heart className="w-4 h-4 text-blue-500" />
                                 </div>
                                 <div>
                                    <p className="font-medium text-gray-800 mb-1">{item.advice}</p>
                                    {item.details && <p className="text-sm text-gray-500 mb-2">{item.details}</p>}
                                    <p className="text-xs text-gray-400 font-medium">Source: {item.source}</p>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}

                  {/* How it Works Tab */}
                  {activeTab === "How it Works" && (
                     <div className="space-y-6 animate-in fade-in duration-300 bg-white border rounded-xl p-6 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-800">The Science of Dermatoglyphics</h3>
                        <p className="text-gray-600">
                           Dermatoglyphics is the scientific study of fingerprints, lines, mounts, and shapes of hands. 
                           Research has shown correlations between dermatoglyphic patterns and certain genetic conditions or predispositions.
                        </p>
                        
                        <div className="border-t border-gray-100 pt-4">
                           <h4 className="font-semibold text-gray-800 mb-3">Our Process</h4>
                           <div className="space-y-4">
                              {[
                                 { title: "Image Capture", desc: "High-resolution scanning of fingerprint patterns." },
                                 { title: "Feature Extraction", desc: "AI identifies minutiae points, ridges, and whorls." },
                                 { title: "Pattern Analysis", desc: "Machine learning creates a biological profile." },
                                 { title: "Risk Prediction", desc: "Comparing your profile against medical datasets." }
                              ].map((step, i) => (
                                 <div key={i} className="flex items-start">
                                    <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                                       {i + 1}
                                    </div>
                                    <div>
                                       <h5 className="font-medium text-gray-900">{step.title}</h5>
                                       <p className="text-sm text-gray-500">{step.desc}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Download Tab */}
                  {activeTab === "Download" && (
                    <div className="animate-in fade-in duration-300 bg-white border rounded-xl p-8 shadow-sm text-center">
                        <div className="inline-block p-4 border-2 border-dashed border-gray-200 rounded-xl mb-4">
                            <QRCodeSVG 
                                value={`https://printalyzer.com/results/${sessionId}`} 
                                size={150}
                                level="H"
                            />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Save Your Results</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Scan the QR code to access your results on your mobile device, or download a comprehensive PDF report.
                        </p>
                        
                        <div className="flex justify-center space-x-4">
                            <Button 
                                variant="outline" 
                                className="flex items-center"
                                onClick={() => alert("Printing not connected in demo")}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Print Result
                            </Button>
                            <Button 
                                className="bg-[#00c2cb] hover:bg-[#00adb5] text-white flex items-center"
                                onClick={() => {
                                   if (sessionId) sessionAPI.generatePDF(sessionId);
                                   alert("Downloading PDF...");
                                }}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                        </div>
                    </div>
                  )}

               </div>
            </div>

            <div className="mt-8 flex justify-between border-t border-gray-100 pt-6">
               <Button 
                 variant="ghost" 
                 className="text-gray-500 hover:text-gray-800"
                 onClick={handleBackHome}
               >
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
               </Button>
               
               <Button 
                   onClick={handleNewSession}
                   variant="outline"
                   className="border-[#00c2cb] text-[#00c2cb] hover:bg-teal-50"
               >
                   Start New Session
               </Button>
            </div>
          </div>
       </main>
       
       <Footer className="border-t border-gray-100" />
    </div>
    </ProtectedRoute>
  );
}
