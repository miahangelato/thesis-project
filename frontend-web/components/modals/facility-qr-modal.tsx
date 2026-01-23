"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import { X, MapPin, Globe, Facebook, Smartphone, Info } from "lucide-react";

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
  type TabId = "location" | "website" | "facebook";
  type Tab = {
    id: TabId;
    label: string;
    icon: typeof MapPin;
    value?: string;
  };
  const [activeTab, setActiveTab] = useState<TabId>("location");

  if (!isOpen || !facility) return null;

  const allTabs: Tab[] = [
    {
      id: "location",
      label: "Location",
      icon: MapPin,
      value: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        facility.google_query
      )}`,
    },
    { id: "website", label: "Website", icon: Globe, value: facility.website },
    { id: "facebook", label: "Facebook", icon: Facebook, value: facility.facebook },
  ];

  const tabs = allTabs.filter((tab): tab is Tab & { value: string } =>
    Boolean(tab.value)
  );

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zIndexClassName="z-[9999]"
      backdropZIndexClassName="z-[9998]"
      containerClassName="p-4"
      backdropClassName="bg-slate-900/60 backdrop-blur-md"
      panelClassName="max-w-xl rounded-[2.5rem] border border-teal-100 flex flex-col"
      showTopBar
    >
      <div className="p-7">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center border border-teal-100">
              <Smartphone className="w-8 h-8 text-[#00c2cb]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                Take Info with You
              </h2>
              <p className="text-slate-500 font-medium">
                Scan to access on your mobile device
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-teal-50 rounded-full transition-colors"
          >
            <X className="w-8 h-8 text-slate-300" />
          </button>
        </div>

        <div className="bg-teal-50/30 rounded-2xl p-5 mb-6 border border-teal-100/50 min-h-[110px] flex flex-col justify-center">
          <p className="text-sm font-bold text-[#00c2cb]/50 uppercase tracking-widest mb-1">
            Facility
          </p>
          <p className="text-xl font-bold text-teal-900 leading-tight">{facility.name}</p>
        </div>

        <div className="flex gap-2 mb-6 bg-teal-50/50 p-1.5 rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-base font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-[#00c2cb] shadow-sm"
                  : "text-[#00c2cb]/50 hover:text-[#00c2cb] hover:bg-white/50"
              }`}
            >
              <tab.icon
                className={`w-5 h-5 ${activeTab === tab.id ? "text-[#00c2cb]" : "text-[#00c2cb]/40"}`}
              />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-teal-100 rounded-4xl p-6 mb-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
            <QRCodeSVG
              value={currentTab.value}
              size={280}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="mt-8 flex items-center gap-3 text-teal-700 bg-teal-50 px-6 py-3 rounded-full">
            <Info className="w-5 h-5" />
            <p className="text-base font-bold">Point your camera at the code</p>
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full h-16 bg-[#00c2cb] hover:bg-[#00adb5] text-white text-xl font-bold rounded-2xl shadow-lg shadow-teal-200/50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Done
        </Button>
      </div>
    </ModalShell>
  );
}
