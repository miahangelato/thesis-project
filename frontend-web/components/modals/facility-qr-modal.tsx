"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, MapPin, Globe, Facebook, Smartphone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FacilityQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: {
    name: string;
    google_query: string;
    website?: string;
    facebook?: string;
  } | null;
}

export function FacilityQRModal({ isOpen, onClose, facility }: FacilityQRModalProps) {
  const [activeTab, setActiveTab] = useState<"location" | "website" | "facebook">("location");

  if (!isOpen || !facility) return null;

  const tabs = [
    { id: "location", label: "Location", icon: MapPin, value: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.google_query)}` },
    { id: "website", label: "Website", icon: Globe, value: facility.website },
    { id: "facebook", label: "Facebook", icon: Facebook, value: facility.facebook },
  ].filter(tab => tab.value);

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-teal-950/60 backdrop-blur-md z-[9998] animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full pointer-events-auto animate-in zoom-in-95 duration-300 border border-teal-100 overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative Top Bar */}
          <div className="h-3 w-full bg-gradient-to-r from-teal-400 to-cyan-400 shrink-0" />

          <div className="p-7">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center border border-teal-100">
                  <Smartphone className="w-8 h-8 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    Take Info with You
                  </h2>
                  <p className="text-gray-500 font-medium">Scan to access on your mobile device</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-teal-50 rounded-full transition-colors"
              >
                <X className="w-8 h-8 text-teal-300" />
              </button>
            </div>

            {/* Facility Name Banner */}
            <div className="bg-teal-50/30 rounded-2xl p-5 mb-6 border border-teal-100/50 min-h-[110px] flex flex-col justify-center">
              <p className="text-sm font-bold text-teal-600/50 uppercase tracking-widest mb-1">Facility</p>
              <p className="text-xl font-bold text-teal-900 leading-tight">{facility.name}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-teal-50/50 p-1.5 rounded-2xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-base font-bold transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-teal-600 shadow-sm"
                      : "text-teal-600/50 hover:text-teal-600 hover:bg-white/50"
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-teal-600" : "text-teal-600/40"}`} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* QR Code Area */}
            <div className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-teal-100 rounded-[2rem] p-6 mb-6">
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
                <QRCodeSVG value={currentTab.value || ""} size={280} level="H" includeMargin={true} />
              </div>
              <div className="mt-8 flex items-center gap-3 text-teal-700 bg-teal-50 px-6 py-3 rounded-full">
                <Info className="w-5 h-5" />
                <p className="text-base font-bold">Point your camera at the code</p>
              </div>
            </div>

            {/* Footer Action */}
            <Button
              onClick={onClose}
              className="w-full h-16 bg-teal-600 hover:bg-teal-700 text-white text-xl font-bold rounded-2xl shadow-lg shadow-teal-200/50 transition-all"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
