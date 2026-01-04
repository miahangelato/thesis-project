"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/contexts/session-context";
import { sessionAPI } from "@/lib/api";
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import { StepNavigation } from "@/components/layout/step-navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { SessionEndModal } from "@/components/modals/session-end-modal";
import { StaticInfoPanel } from "@/components/demographics/static-info-panel";
import { InlineNumericKeypad } from "@/components/ui/inline-numeric-keypad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, CheckCircle, Shield, User, X } from "lucide-react";
import { ROUTES, STEPS } from "@/lib/constants";

type WeightUnit = "kg" | "lb";
type HeightUnit = "cm" | "ftin";
type ActiveField = "age" | "weight" | "height" | null;

const InfoTooltip = ({ text }: { text: string }) => (
  <div className="relative inline-flex group ml-2 align-middle">
    <button
      type="button"
      className="text-slate-400 hover:text-slate-600 transition-colors"
      aria-label="More info"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    </button>
    <div
      role="tooltip"
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full z-50 mb-2 w-max max-w-[200px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-xl opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
    >
      {text}
      <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 border-4 border-transparent border-t-white" />
    </div>
  </div>
);

export default function DemographicsPage() {
  const router = useRouter();
  const { sessionId, setCurrentStep } = useSession();
  const [loading, setLoading] = useState(false);

  const { showModal, handleConfirm, handleCancel, promptBackNavigation } = useBackNavigation(true);

  // Unit preferences
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");

  // ft/in inputs for heightUnit === "ftin"
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");

  // Keypad routing
  const [activeField, setActiveField] = useState<ActiveField>(null);

  // Form state (clean: NO blood donation eligibility criteria)
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    heightCm: "", // canonical height in cm
    gender: "",
    blood_type: "unknown",
    showDonationCentersLater: false, // single opt-in only
  });

  // -------------------------
  // Unit conversion helpers
  // -------------------------
  const kgToLb = (kg: number) => kg * 2.20462;
  const lbToKg = (lb: number) => lb / 2.20462;

  const cmToFtIn = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  };

  const ftInToCm = (feet: number, inches: number) => {
    const totalInches = feet * 12 + inches;
    return Math.round(totalInches * 2.54);
  };

  // -------------------------
  // Canonical values (kg/cm)
  // -------------------------
  const weightKg = useMemo(() => {
    const w = parseFloat(formData.weight);
    if (!w || w <= 0) return null;
    return weightUnit === "kg" ? w : lbToKg(w);
  }, [formData.weight, weightUnit]);

  const heightCm = useMemo(() => {
    // If heightUnit=cm: use formData.heightCm
    if (heightUnit === "cm") {
      const h = parseFloat(formData.heightCm);
      if (!h || h <= 0) return null;
      return h;
    }

    // If heightUnit=ftin: convert ft/in to cm
    const ft = parseInt(heightFt || "0", 10);
    const inch = parseInt(heightIn || "0", 10);
    if (ft === 0 && inch === 0) return null;
    return ftInToCm(ft, inch);
  }, [formData.heightCm, heightUnit, heightFt, heightIn]);

  // -------------------------
  // BMI (compact preview)
  // -------------------------
  const bmiValue = useMemo(() => {
    if (!weightKg || !heightCm) return null;
    const meters = heightCm / 100;
    const bmi = weightKg / (meters * meters);
    return Number.isFinite(bmi) ? bmi.toFixed(1) : null;
  }, [weightKg, heightCm]);

  const bmiCategory = useMemo(() => {
    const bmi = bmiValue ? parseFloat(bmiValue) : null;
    const age = parseInt(formData.age || "0", 10);
    if (!bmi || !age || age < 18) return null;

    // Keep labels neutral (avoid “Obese” pill on this step)
    if (bmi < 18.5) return { label: "Low", color: "blue" as const };
    if (bmi < 25) return { label: "Normal", color: "green" as const };
    if (bmi < 30) return { label: "High", color: "amber" as const };
    return { label: "Very high", color: "red" as const };
  }, [bmiValue, formData.age]);

  // -------------------------
  // Keypad handlers
  // -------------------------
  const handleFieldFocus = (field: Exclude<ActiveField, null>) => setActiveField(field);

  const handleFieldBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget?.tagName === "BUTTON" || relatedTarget?.tagName === "INPUT") return;

    setTimeout(() => setActiveField(null), 200);
  };

  const dismissKeypad = () => setActiveField(null);

  const handleKeypadInput = (key: string) => {
    if (!activeField) return;

    // Age: digits only, max 3
    // Height (cm mode): digits only
    // Weight: digits + optional one decimal
    setFormData((prev) => {
      const current =
        activeField === "height" ? prev.heightCm : (prev as any)[activeField];

      if (key === ".") {
        if (activeField !== "weight") return prev;
        if (current.includes(".")) return prev;
        return { ...prev, weight: current + "." };
      }

      const next = current + key;

      if (activeField === "age") {
        if (next.length > 3) return prev;
        if (!/^\d*$/.test(next)) return prev;
        return { ...prev, age: next };
      }

      if (activeField === "weight") {
        if (!/^\d*\.?\d*$/.test(next)) return prev;
        return { ...prev, weight: next };
      }

      // activeField === "height" (cm input only)
      if (!/^\d*$/.test(next)) return prev;
      return { ...prev, heightCm: next };
    });
  };

  const handleBackspace = () => {
    if (!activeField) return;

    setFormData((prev) => {
      if (activeField === "height") {
        return { ...prev, heightCm: prev.heightCm.slice(0, -1) };
      }
      const v = (prev as any)[activeField] as string;
      return { ...prev, [activeField]: v.slice(0, -1) } as any;
    });
  };

  const handleKeypadConfirm = () => {
    if (activeField === "age") document.getElementById("weight")?.focus();
    else if (activeField === "weight") {
      // Height: if ft/in mode, focus ft; else focus cm height field
      if (heightUnit === "ftin") document.getElementById("height-ft")?.focus();
      else document.getElementById("height")?.focus();
    } else if (activeField === "height") document.getElementById("gender")?.focus();

    dismissKeypad();
  };

  // -------------------------
  // Validations (simple)
  // -------------------------
  const isBasicInfoComplete =
    !!formData.age && !!formData.weight && !!formData.gender && !!heightCm;

  // -------------------------
  // Submit
  // -------------------------
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    dismissKeypad();
    if (loading) return;

    if (!formData.age || !formData.weight || !formData.gender || !heightCm) {
      alert("Please fill out age, weight, height, and gender.");
      return;
    }

    setLoading(true);
    try {
      setCurrentStep(STEPS.SCAN);

      if (sessionId) {
        const payload = {
          age: parseInt(formData.age, 10),
          weight_kg: weightKg ? Number(weightKg.toFixed(1)) : 0,
          height_cm: Math.round(heightCm),
          gender: formData.gender,
          blood_type: formData.blood_type,
          show_donation_centers_later: formData.showDonationCentersLater,
        };

        await sessionAPI.submitDemographics(sessionId, payload);
        sessionStorage.setItem("demographics", JSON.stringify(payload));
      }

      router.push(ROUTES.SCAN);
    } catch (err) {
      console.error("Failed to submit demographics:", err);
      setCurrentStep(STEPS.SCAN);
      router.push(ROUTES.SCAN);
    } finally {
      setLoading(false);
    }
  };

  const clearFields = () => {
    setFormData({
      age: "",
      weight: "",
      heightCm: "",
      gender: "",
      blood_type: "unknown",
      showDonationCentersLater: false,
    });
    setHeightFt("");
    setHeightIn("");
    setWeightUnit("kg");
    setHeightUnit("cm");
    dismissKeypad();
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <ProtectedRoute requireSession={true} requiredStep={STEPS.DEMOGRAPHICS}>
      <>
        <SessionEndModal isOpen={showModal} onConfirm={handleConfirm} onCancel={handleCancel} />

        {loading && (
          <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                <div
                  className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-teal-400 rounded-full animate-spin"
                  style={{ animationDirection: "reverse", animationDuration: "1s" }}
                />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800 mb-1">Preparing Fingerprint Scan</p>
                <p className="text-base text-gray-600">Please wait a moment…</p>
              </div>
            </div>
          </div>
        )}

        <div className="h-screen px-28 py-6 bg-white flex flex-col overflow-x-hidden overflow-y-auto">
          <main className="flex-1 w-full max-w-full flex flex-col">
            <ProgressHeader
              currentStep={STEPS.DEMOGRAPHICS}
              totalSteps={4}
              title="Tell Us a Bit About You"
              subtitle="These details help personalize your fingerprint-based health insights. Nothing here identifies you personally."
              accentColor="#00c2cb"
            />

            <form id="demographics-form" onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="flex-1 flex flex-row gap-3 overflow-hidden">
                {/* Left column */}
                <div className="flex flex-col flex-[3] min-w-0 gap-4">
                  {/* Basic Information Card */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-100 hover:shadow-md transition-shadow select-none">
                    <div className="flex items-start mb-3">
                      <div className="w-10 h-10 bg-linear-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center mr-3 shrink-0">
                        <User className="h-5 w-5 text-teal-600" />
                      </div>

                      <div className="flex-1">
                        <h2 className="text-3xl font-bold text-slate-800 leading-tight">Your Health Context</h2>
                        <p className="text-teal-600 text-lg font-semibold leading-tight">
                          Background information for screening
                        </p>
                        <p className="text-slate-500 text-lg leading-relaxed mt-1">
                          This information helps us better understand patterns in your results.
                        </p>
                      </div>

                      {isBasicInfoComplete && (
                        <div className="shrink-0 ml-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      {/* Age */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="age" className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                            <span className="text-base">🎂</span>
                            <span>Age</span>
                          </Label>
                          <span className="text-red-500 text-sm">*</span>
                          <InfoTooltip text="Helps us adjust results for age-related patterns." />
                        </div>

                        <Input
                          id="age"
                          name="age"
                          type="text"
                          inputMode="numeric"
                          placeholder="e.g., 25"
                          autoComplete="off"
                          readOnly
                          value={formData.age}
                          onFocus={() => handleFieldFocus("age")}
                          onBlur={handleFieldBlur}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d{0,3}$/.test(val)) setFormData((p) => ({ ...p, age: val }));
                          }}
                          required
                          className={`h-14 text-lg font-bold rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                            activeField === "age"
                              ? `border-teal-500 ring-2 ring-teal-100 ${formData.age ? "!bg-green-50 text-green-700" : "!bg-teal-50"}`
                              : formData.age
                              ? "border-green-400 !bg-green-50 text-green-700"
                              : ""
                          }`}
                        />
                      </div>

                      {/* Weight */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="weight" className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                            <span className="text-base">⚖️</span>
                            <span>Weight</span>
                          </Label>
                          <span className="text-red-500 text-sm">*</span>
                          <InfoTooltip text="Used only to calculate general indicators like BMI." />
                        </div>

                        <Input
                          id="weight"
                          name="weight"
                          type="text"
                          inputMode="decimal"
                          placeholder="e.g., 65.5"
                          autoComplete="off"
                          readOnly
                          value={formData.weight}
                          onFocus={() => handleFieldFocus("weight")}
                          onBlur={handleFieldBlur}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*\.?\d*$/.test(val)) setFormData((p) => ({ ...p, weight: val }));
                          }}
                          required
                          className={`h-14 text-lg font-bold rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                            activeField === "weight"
                              ? `border-teal-500 ring-2 ring-teal-100 ${formData.weight ? "!bg-green-50 text-green-700" : "!bg-teal-50"}`
                              : formData.weight
                              ? "border-green-400 !bg-green-50 text-green-700"
                              : ""
                          }`}
                        />

                        {/* Weight unit toggle */}
                        <div className="flex gap-0 mt-2 bg-slate-100 rounded-lg p-1 w-fit">
                          <button
                            type="button"
                            onClick={() => {
                              if (weightUnit === "lb") {
                                if (formData.weight) {
                                  const lb = parseFloat(formData.weight);
                                  const kg = lbToKg(lb).toFixed(1);
                                  setFormData((p) => ({ ...p, weight: kg }));
                                }
                                setWeightUnit("kg");
                              }
                            }}
                            className={`h-9 px-6 text-sm font-semibold rounded-md transition-all ${
                              weightUnit === "kg"
                                ? "bg-[#00c2cb] text-white shadow-sm"
                                : "bg-transparent text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            kg
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (weightUnit === "kg") {
                                if (formData.weight) {
                                  const kg = parseFloat(formData.weight);
                                  const lb = kgToLb(kg).toFixed(1);
                                  setFormData((p) => ({ ...p, weight: lb }));
                                }
                                setWeightUnit("lb");
                              }
                            }}
                            className={`h-9 px-6 text-sm font-semibold rounded-md transition-all ${
                              weightUnit === "lb"
                                ? "bg-[#00c2cb] text-white shadow-sm"
                                : "bg-transparent text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            lb
                          </button>
                        </div>
                      </div>

                      {/* Height */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="height" className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                            <span className="text-base">📏</span>
                            <span>Height</span>
                          </Label>
                          <span className="text-red-500 text-sm">*</span>
                          <InfoTooltip text="Used together with weight for basic calculations." />
                        </div>

                        {heightUnit === "cm" ? (
                          <Input
                            id="height"
                            name="height"
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g., 170"
                            autoComplete="off"
                            readOnly
                            value={formData.heightCm}
                            onFocus={() => handleFieldFocus("height")}
                            onBlur={handleFieldBlur}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d*$/.test(val)) setFormData((p) => ({ ...p, heightCm: val }));
                            }}
                            required
                            className={`h-14 text-lg font-bold rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                              activeField === "height"
                                ? `border-teal-500 ring-2 ring-teal-100 ${formData.heightCm ? "!bg-green-50 text-green-700" : "!bg-teal-50"}`
                                : formData.heightCm
                                ? "border-green-400 !bg-green-50 text-green-700"
                                : ""
                            }`}
                          />
                        ) : (
                          <div className="flex gap-3 items-center">
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                id="height-ft"
                                type="text"
                                inputMode="numeric"
                                placeholder="5"
                                autoComplete="off"
                                readOnly
                                value={heightFt}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (/^\d*$/.test(val)) setHeightFt(val);
                                }}
                                className={`h-14 text-lg font-bold rounded-lg border-2 transition-all duration-200 ${
                                  heightFt ? "border-green-400 bg-green-50 text-green-700" : "border-slate-300 bg-white hover:border-teal-400"
                                }`}
                              />
                              <span className="text-sm text-slate-600 font-medium">ft</span>
                            </div>

                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                id="height-in"
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                autoComplete="off"
                                readOnly
                                value={heightIn}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (/^\d*$/.test(val) && parseInt(val || "0", 10) < 12) setHeightIn(val);
                                }}
                                className={`h-14 text-lg font-bold rounded-lg border-2 transition-all duration-200 ${
                                  heightIn ? "border-green-400 bg-green-50 text-green-700" : "border-slate-300 bg-white hover:border-teal-400"
                                }`}
                              />
                              <span className="text-sm text-slate-600 font-medium">in</span>
                            </div>
                          </div>
                        )}

                        {/* Height unit toggle */}
                        <div className="flex gap-0 mt-2 bg-slate-100 rounded-lg p-1 w-fit">
                          <button
                            type="button"
                            onClick={() => {
                              if (heightUnit === "ftin") {
                                const ft = parseInt(heightFt || "0", 10);
                                const inch = parseInt(heightIn || "0", 10);
                                if (ft || inch) setFormData((p) => ({ ...p, heightCm: String(ftInToCm(ft, inch)) }));
                                setHeightUnit("cm");
                              }
                            }}
                            className={`h-9 px-6 text-sm font-semibold rounded-md transition-all ${
                              heightUnit === "cm"
                                ? "bg-[#00c2cb] text-white shadow-sm"
                                : "bg-transparent text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            cm
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (heightUnit === "cm") {
                                if (formData.heightCm) {
                                  const cm = parseFloat(formData.heightCm);
                                  const { feet, inches } = cmToFtIn(cm);
                                  setHeightFt(String(feet));
                                  setHeightIn(String(inches));
                                }
                                setHeightUnit("ftin");
                              }
                            }}
                            className={`h-9 px-6 text-sm font-semibold rounded-md transition-all ${
                              heightUnit === "ftin"
                                ? "bg-[#00c2cb] text-white shadow-sm"
                                : "bg-transparent text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            ft/in
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Gender */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="gender" className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                            <span className="text-base">🚻</span>
                            <span>Gender</span>
                          </Label>
                          <span className="text-red-500 text-sm">*</span>
                          <InfoTooltip text="Helps account for biological differences in general patterns." />
                        </div>

                        <Select value={formData.gender} onValueChange={(val) => setFormData((p) => ({ ...p, gender: val }))}>
                          <SelectTrigger
                            id="gender"
                            className={`h-14 w-full text-lg font-bold rounded-lg border-2 transition-all duration-200 bg-white flex items-center justify-between px-4 cursor-pointer ${
                              formData.gender ? "border-green-400 bg-green-50 text-green-700" : "border-slate-300 hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                            }`}
                          >
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-2 border-slate-200">
                            <SelectItem value="prefer_not_to_say" className="cursor-pointer">
                              Prefer not to say
                            </SelectItem>
                            <SelectItem value="male" className="cursor-pointer">
                              Male
                            </SelectItem>
                            <SelectItem value="female" className="cursor-pointer">
                              Female
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Blood type */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="blood_type" className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                            <span className="text-base">🩸</span>
                            <span>Blood Type</span>
                          </Label>
                          <span className="text-slate-600 text-xs">(Optional)</span>
                          <InfoTooltip text="Optional. If known, it helps us compare results more accurately." />
                        </div>

                        <Select
                          value={formData.blood_type}
                          onValueChange={(val) => setFormData((p) => ({ ...p, blood_type: val }))}
                        >
                          <SelectTrigger
                            className={`h-14 w-full text-lg font-bold rounded-lg border-2 transition-all duration-200 bg-white flex items-center justify-between px-4 cursor-pointer ${
                              formData.blood_type !== "unknown"
                                ? "border-green-400 bg-green-50 text-green-700"
                                : "border-slate-300 hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                            }`}
                          >
                            <SelectValue placeholder="Select if known" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-2 border-slate-200">
                            <SelectItem value="unknown" className="cursor-pointer">
                              Unknown
                            </SelectItem>
                            <SelectItem value="O" className="cursor-pointer">
                              O
                            </SelectItem>
                            <SelectItem value="A" className="cursor-pointer">
                              A
                            </SelectItem>
                            <SelectItem value="B" className="cursor-pointer">
                              B
                            </SelectItem>
                            <SelectItem value="AB" className="cursor-pointer">
                              AB
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* BMI Compact Preview Row */}
                    <div className="flex items-center justify-between h-14 w-full px-4 mt-4 bg-white rounded-lg border-2 border-slate-300">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📊</span>
                        <span className="text-lg font-bold text-slate-700">BMI estimate</span>
                        <InfoTooltip text="BMI is a general indicator based on height and weight. It does not account for muscle mass or body composition." />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-slate-900">{bmiValue || "--.-"}</span>
                        {bmiCategory && (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold ${
                              bmiCategory.color === "green"
                                ? "bg-green-100 text-green-700"
                                : bmiCategory.color === "blue"
                                ? "bg-blue-100 text-blue-700"
                                : bmiCategory.color === "amber"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {bmiCategory.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Donation opt-in (ONLY checkbox, no criteria) */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-100 hover:shadow-md transition-shadow select-none">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        id="donation-opt-in"
                        checked={formData.showDonationCentersLater}
                        onCheckedChange={(checked) =>
                          setFormData((p) => ({ ...p, showDonationCentersLater: Boolean(checked) }))
                        }
                        className="h-8 w-8 border-2 border-slate-400 data-[state=checked]:bg-[#00c2cb] data-[state=checked]:border-[#00c2cb] rounded-md shrink-0"
                      />
                      <Label htmlFor="donation-opt-in" className="text-xl font-bold text-slate-800 cursor-pointer">
                        Show blood donation centers later
                      </Label>
                      <InfoTooltip text="If selected, we’ll show nearby donation centers after your results." />
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col flex-[2] gap-4">
                  <StaticInfoPanel />

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-start gap-4">
                      <Shield className="h-7 w-7 text-slate-500 mt-1 shrink-0" />
                      <div>
                        <strong className="text-xl text-slate-900 block mb-1">Legal Disclaimer</strong>
                        <p className="text-base text-slate-600 leading-relaxed">
                          This tool provides predictive insights based on fingerprint and demographic data. It does not
                          replace laboratory tests or medical diagnosis. Always consult healthcare professionals.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border-2 border-red-500 rounded-2xl px-5 py-3 flex gap-4 items-start shadow-sm">
                    <AlertTriangle className="h-7 w-7 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-xl font-bold text-red-950 mb-1">Important</strong>
                      <p className="text-base text-red-900 leading-relaxed">
                        This is a screening tool — not a medical diagnosis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </main>

          {/* Navigation */}
          <div className="mt-8 mb-6 shrink-0 px-0">
            <StepNavigation
              form="demographics-form"
              onBack={promptBackNavigation}
              isSubmit={true}
              loading={loading}
              isNextDisabled={!isBasicInfoComplete || loading}
              nextLabel="Continue to Fingerprint Scan"
              leftAdornment={
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearFields}
                  className="flex items-center gap-2 h-14 px-6 text-lg font-bold text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer rounded-xl transition-all"
                >
                  <X size={20} className="stroke-[2.5]" />
                  Clear Fields
                </Button>
              }
            />
          </div>

          <Footer transparent customContent={<>No needles • Non-invasive • Privacy-first</>} />
        </div>

        {/* Docked keypad (touchscreen) */}
        <InlineNumericKeypad
          isVisible={!!activeField}
          allowDecimal={activeField === "weight"}
          onKeyPress={handleKeypadInput}
          onBackspace={handleBackspace}
          onConfirm={handleKeypadConfirm}
          onDismiss={dismissKeypad}
        />
      </>
    </ProtectedRoute>
  );
}
