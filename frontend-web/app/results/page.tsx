"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useSession } from "@/contexts/session-context";
import { sessionAPI } from "@/lib/api";
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import React from "react";
import { useRouter } from "next/navigation";
import { ROUTES, STEPS } from "@/lib/constants";
import {
  Droplets,
  TrendingUp,
  AlertTriangle,
  Heart,
  Hospital,
  CheckCircle,
  Info,
} from "lucide-react";

interface DiabetesResult {
  diabetes_risk?: string;
  confidence?: number;
}

interface BloodGroupResult {
  predicted_blood_group?: string;
  confidence?: number;
}

export default function ResultPage() {
  const router = useRouter();
  const { sessionId, clearSession } = useSession();
  const [result, setResult] = useState<DiabetesResult | null>(null);
  const [bloodGroupResult, setBloodGroupResult] =
    useState<BloodGroupResult | null>(null);
  const [participantData, setParticipantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const response = await sessionAPI.getResults(sessionId);
        const data = response.data;
        
        // Map API response to component state
        setResult({
          diabetes_risk: data.risk_level || "Unknown",
          confidence: data.diabetes_risk || 0
        });
        
        setBloodGroupResult({
          predicted_blood_group: data.blood_group || "Unknown",
          confidence: data.blood_group_confidence || 0
        });
        
        setParticipantData({
          age: data.age || 0,
          weight: data.weight_kg || 0,
          height: data.height_cm || 0,
          gender: data.gender || "N/A",
          blood_type: data.blood_group || "Unknown",
          willing_to_donate: data.willing_to_donate || false,
          saved: data.saved_to_database || false,
          participant_id: sessionId,
          explanation: data.explanation || ""
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error parsing session data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const handleNewSession = () => {
    clearSession();
    router.push(ROUTES.HOME);
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

  // ...

  return (
    <div className="h-screen bg-white flex flex-col">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <ProgressHeader
            currentStep={STEPS.RESULTS}
            totalSteps={4}
            title="Analysis Results"
            subtitle="Your health analysis is complete. Review your results and recommendations below."
          />

          {/* ... */}
          
          {/* Action Buttons - Bottom */}
          <div className="flex justify-between items-center pt-6 mt-auto border-t">
            <Button
              variant="outline"
              onClick={() => router.push(ROUTES.CONSENT)}
              className="px-6 py-3 text-sm"
            >
              {/* SVG icon */}
              Back To Consent
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/hospitals")} // Or constant if you add one later
              className="px-6 py-3 text-sm text-red-500 border-red-300 hover:bg-red-50"
            >
              <Hospital className="w-4 h-4 mr-2" />
              Hospitals
            </Button>

            <Button
              onClick={handleNewSession}
              className="px-6 py-3 text-sm bg-[#00c2cb] hover:bg-[#00adb5] text-white"
            >
              End Process
              {/* SVG icon */}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
