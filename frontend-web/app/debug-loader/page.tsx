"use client";

import React, { useState } from "react";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { Button } from "@/components/ui/button";
import { Fingerprint, Brain, ClipboardCheck, Settings2, Database } from "lucide-react";

export default function DebugLoaderPage() {
  const [loaderConfig, setLoaderConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    steps: any[];
    footerText?: string;
  }>({
    isOpen: false,
    title: "",
    subtitle: "",
    steps: [],
    footerText: "This usually takes 10-15 seconds",
  });

  const showLoader = (
    title: string,
    subtitle: string,
    steps: any[] = [],
    footerText?: string
  ) => {
    setLoaderConfig({ isOpen: true, title, subtitle, steps, footerText });
    
    // Auto close after 5 seconds for convenience if no steps
    if (steps.length === 0) {
      setTimeout(() => {
        setLoaderConfig((prev) => ({ ...prev, isOpen: false }));
      }, 5000);
    }
  };

  const showAnalysisPreview = () => {
    const initialSteps = [
      { 
        label: "Uploading fingerprints...", 
        description: "SECURE BIOMETRIC TRANSMISSION", 
        status: "current" as const,
        icon: Fingerprint 
      },
      { 
        label: "Running AI analysis...", 
        description: "NEURAL PATTERN MATCHING", 
        status: "pending" as const,
        icon: Brain 
      },
      { 
        label: "Generating your results...", 
        description: "CLINICAL SYNTHESIS", 
        status: "pending" as const,
        icon: ClipboardCheck 
      },
    ];
    
    setLoaderConfig({ 
      isOpen: true, 
      title: "Analyzing Your Fingerprints", 
      subtitle: "Please wait while we process your data...", 
      steps: initialSteps,
      footerText: "Processing minutiae patterns..."
    });

    // Sequence Simulation
    setTimeout(() => {
      setLoaderConfig(prev => ({
        ...prev,
        steps: [
          { ...prev.steps[0], status: "completed" },
          { ...prev.steps[1], status: "current" },
          { ...prev.steps[2], status: "pending" },
        ],
        footerText: "Analyzing fingerprint ridges..."
      }));
    }, 4000);

    setTimeout(() => {
      setLoaderConfig(prev => ({
        ...prev,
        steps: [
          { ...prev.steps[0], status: "completed" },
          { ...prev.steps[1], status: "completed" },
          { ...prev.steps[2], status: "current" },
        ],
        footerText: "Finalizing diagnostic report..."
      }));
    }, 8000);

    setTimeout(() => {
      setLoaderConfig(prev => ({
        ...prev,
        steps: prev.steps.map(s => ({ ...s, status: "completed" })),
        footerText: "Complete!"
      }));
    }, 11000);

    setTimeout(() => {
      setLoaderConfig(prev => ({ ...prev, isOpen: false }));
    }, 13000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-12 flex flex-col items-center justify-center space-y-8">
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Loader Showcase</h1>
        <p className="text-xl text-slate-600 font-medium">
          Preview the **Professional Medical Kiosk** loaders. 
          Designed for high visibility and clarity for all ages.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {/* Prep Loader */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">⚙️</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">System Init</h3>
            <p className="text-slate-500 font-medium">Simple startup loader with high-contrast text.</p>
          </div>
          <Button 
            onClick={() => showLoader("Preparing Session", "Initializing secure connection and sensors...", [], "Please stand by...")}
            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold hover:scale-[1.05] transition-transform"
          >
            Preview Init
          </Button>
        </div>

        {/* Analysis Loader */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#00c2cb]/20 shadow-xl shadow-[#00c2cb]/5 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">🧠</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 text-[#00c2cb]">Diagnostic</h3>
            <p className="text-slate-500 font-medium">Full clinical analysis sequence with step tracking.</p>
          </div>
          <Button 
            onClick={showAnalysisPreview}
            className="w-full h-14 bg-[#00c2cb] text-white rounded-2xl font-bold hover:scale-[1.05] transition-transform shadow-lg shadow-teal-100"
          >
            Preview Sequence
          </Button>
        </div>

        {/* Simple Loader */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">🔃</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Generic</h3>
            <p className="text-slate-500 font-medium">Clean, minimalist overlay for standard tasks.</p>
          </div>
          <Button 
            onClick={() => showLoader("Loading Data", "Retrieving information...", [
              { label: "Database Fetch", description: "RETRIEVING RECORDS", status: "current", icon: Database }
            ], "Usually takes 2-3 seconds")}
            className="w-full h-14 bg-slate-200 text-slate-700 rounded-2xl font-bold hover:scale-[1.05] transition-transform"
          >
            Preview Simple
          </Button>
        </div>
      </div>

      <FullScreenLoader
        isOpen={loaderConfig.isOpen}
        title={loaderConfig.title}
        subtitle={loaderConfig.subtitle}
        steps={loaderConfig.steps}
        footerText={loaderConfig.footerText}
      />
    </div>
  );
}
