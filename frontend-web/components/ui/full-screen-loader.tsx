"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Activity } from "lucide-react";

interface Step {
  label: string;
  description?: string;
  status: "pending" | "current" | "completed";
  icon?: React.ElementType;
}

interface FullScreenLoaderProps {
  isOpen?: boolean;
  title?: string;
  subtitle?: string;
  steps?: Step[];
  footerText?: string;
}

const TextRingLoader = ({ text = "LOADING..." }: { text?: string }) => {
  const rings = 2;
  const ringSectors = 30;
  const ringRadius = "7rem";

  return (
    <div className="relative mb-20 scale-75 sm:scale-100">
      <style>{`
        .preloader {
          display: flex;
          animation: tiltSpin 8s linear infinite;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 17em;
          height: 17em;
          transform-style: preserve-3d;
        }
        .preloader__ring {
          transform-style: preserve-3d;
          animation: spin 4s linear infinite;
          font-size: 2em;
          position: relative;
          height: 3rem;
          width: 1.5rem;
        }
        .preloader__ring:nth-child(even) {
          animation-direction: reverse;
        }
        .preloader__sector {
          font-weight: 800;
          position: absolute;
          top: 0;
          left: 0;
          text-align: center;
          text-transform: uppercase;
          color: #00a8b0;
          text-shadow: 0 0 15px rgba(0, 168, 176, 0.4);
          white-space: pre;
          width: 100%;
          height: 100%;
        }
        .preloader__sector:empty:before {
          display: inline-block;
          width: 100%;
          height: 100%;
          background: linear-gradient(transparent 45%, currentColor 45% 55%, transparent 55%);
          content: "";
        }

        @keyframes tiltSpin {
          from { transform: perspective(40em) rotateY(0) rotateX(30deg); }
          to { transform: perspective(40em) rotateY(1turn) rotateX(30deg); }
        }
        @keyframes spin {
          from { transform: rotateY(0); }
          to { transform: rotateY(1turn); }
        }
      `}</style>

      <div className="preloader">
        {[...Array(rings)].map((_, r) => (
          <div key={r} className="preloader__ring">
            {[...Array(ringSectors)].map((_, s) => {
              const angle = (360 / ringSectors) * s;
              const char = text[s] || "";
              return (
                <div
                  key={s}
                  className="preloader__sector"
                  style={{
                    transform: `rotateY(${angle}deg) translateZ(${ringRadius})`,
                  }}
                >
                  {char}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const CustomStatusIcon = ({ status, Icon }: { status: string; Icon?: React.ElementType }) => {
  const StepIcon = Icon || Activity;

  return (
    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
      status === "completed" 
        ? "border-[#00c2cb] bg-[#00c2cb]/10 shadow-md" 
        : status === "current"
        ? "border-[#00c2cb] bg-[#00c2cb]/5 shadow-lg"
        : "border-gray-200"
    }`}>
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="relative z-10"
        >
          <StepIcon className={`w-6 h-6 transition-colors duration-500 ${
            status === "pending" ? "text-gray-300" : "text-[#00c2cb]"
          }`} strokeWidth={2} />
        </motion.div>

        {status === "completed" && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 -right-1 bg-[#00c2cb] rounded-full p-0.5 border-2 border-white"
          >
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export function FullScreenLoader({
  isOpen = true,
  title = "Analyzing Your Fingerprints",
  subtitle = "Please wait while we process your data...",
  steps = [],
  footerText = "This usually takes 10-15 seconds",
}: FullScreenLoaderProps) {
  const [activeWord, setActiveWord] = useState("LOADING");

  useEffect(() => {
    if (steps && steps.length > 0) {
      const currentStep = steps.find(s => s.status === "current");
      if (currentStep) {
        if (currentStep.label.toLowerCase().includes("upload")) setActiveWord("PREPARING...");
        else if (currentStep.label.toLowerCase().includes("analy")) setActiveWord("ANALYZING...");
        else if (currentStep.label.toLowerCase().includes("generat")) setActiveWord("SYNTHESIZING...");
        else setActiveWord("PROCESSING...");
      } else if (steps.every(s => s.status === "completed")) {
        setActiveWord("COMPLETE");
      }
    } else {
      setActiveWord("PREPARING...");
    }
  }, [steps]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white backdrop-blur-sm overflow-hidden"
          style={{
            backgroundImage: "linear-gradient(180deg, rgba(0, 194, 203, 0.03) 0%, rgba(255,255,255,1) 100%)"
          }}
        >
          <div className="relative w-full max-w-xl px-6 flex flex-col items-center">
            
            {/* 3D Text Ring Loader - MOVED TO TOP */}
            <TextRingLoader text={activeWord} />

            {/* Typography Header */}
            <div className="text-center mb-10 -mt-10 space-y-2">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                {title}
              </h2>
              <p className="text-lg text-gray-500 font-medium">
                {subtitle}
              </p>
            </div>

            {/* Step Cards */}
            <div className="w-full space-y-3 mt-4">
              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative overflow-hidden rounded-3xl border transition-all duration-500 p-5 flex items-center gap-6 ${
                    step.status === "current" 
                      ? "bg-[#e4f7f8] border-[#00c2cb]/50 shadow-lg ring-2 ring-[#00c2cb]/20" 
                      : step.status === "completed"
                      ? "bg-white border-gray-200 opacity-100"
                      : "bg-gray-50 border-gray-100 opacity-40"
                  }`}
                >
                  <div className="flex-shrink-0">
                    <CustomStatusIcon status={step.status} Icon={step.icon} />
                  </div>

                  <div className="flex-grow space-y-0.5">
                    <p className={`text-xl font-bold tracking-tight transition-colors duration-500 ${
                      step.status === "pending" ? "text-gray-400" : "text-gray-900"
                    }`}>
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00c2cb]/60">
                        {step.description}
                      </p>
                    )}
                  </div>

                  {step.status === "current" && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "0%" }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity, 
                          ease: "easeInOut"
                        }}
                        className="h-full bg-[#00c2cb] shadow-[0_0_10px_rgba(0,194,203,0.4)]"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {footerText && (
              <p className="mt-12 text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400 text-center">
                {footerText}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
