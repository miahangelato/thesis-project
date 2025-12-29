"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/contexts/session-context";
import { sessionAPI } from "@/lib/api";
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { SessionEndModal } from "@/components/modals/session-end-modal";
import { NumericKeypad } from "@/components/ui/numeric-keypad";
import { useNumericKeypad } from "@/hooks/use-numeric-keypad";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Heart,
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";
import { ROUTES, STEPS } from "@/lib/constants";

export default function DemographicsPage() {
  const router = useRouter();
  const { sessionId, setCurrentStep } = useSession();
  const [loading, setLoading] = useState(false);
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");

  const { showModal, handleConfirm, handleCancel } = useBackNavigation(true);

  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    gender: "male",
    blood_type: "O", // Optional in UI, keeping default
    sleep_hours: "",
    had_alcohol_last_24h: false,
    ate_before_donation: false,
    ate_fatty_food: false,
    recent_tattoo_or_piercing: false,
    has_chronic_condition: false,
    condition_controlled: true,
    last_donation_date: "",
  });

  const [willingToDonate, setWillingToDonate] = useState<boolean | null>(null);

  // Calculate BMI automatically
  const calculateBMI = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    if (weight > 0 && height > 0) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number, age: number) => {
    if (age < 18) {
      return null; // No classification for minors
    }
    if (bmi < 18.5) return { label: "Underweight", color: "blue" };
    if (bmi < 25) return { label: "Normal", color: "green" };
    if (bmi < 30) return { label: "Overweight", color: "amber" };
    return { label: "Above typical range", color: "orange" };
  };

  const bmiValue = calculateBMI();
  const age = parseInt(formData.age);
  const bmiCategory =
    bmiValue && age ? getBMICategory(parseFloat(bmiValue), age) : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    closeAllKeypads();

    if (loading) return;

    if (!formData.age || !formData.weight || !formData.height) {
      alert("Please fill out age, weight, and height.");
      return;
    }

    /*
    if (willingToDonate === null) {
      alert("Please indicate if you are willing to donate blood.");
      return;
    }
    */

    setLoading(true);
    try {
      // Optimistically advance to unlock scan route immediately
      setCurrentStep(STEPS.SCAN);

      if (sessionId) {
        const demographicsData = {
          age: parseInt(formData.age),
          weight_kg: parseFloat(formData.weight),
          height_cm: parseFloat(formData.height),
          gender: formData.gender,
          willing_to_donate: willingToDonate ?? false,
          blood_type: formData.blood_type,
        };

        await sessionAPI.submitDemographics(sessionId, demographicsData);

        // Store demographics in sessionStorage for the scan page to access
        sessionStorage.setItem(
          "demographics",
          JSON.stringify(demographicsData)
        );
      } else {
        // Fallback for demo without session
        console.warn("No active session ID, skipping API submission");
      }

      router.push(ROUTES.SCAN);
    } catch (err) {
      console.error("Failed to submit demographics:", err);
      // Still allow forward navigation if API fails
      setCurrentStep(STEPS.SCAN);
      router.push(ROUTES.SCAN);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleClearForm = () => {
    setFormData({
      age: "",
      weight: "",
      height: "",
      gender: "male",
      blood_type: "O",
      sleep_hours: "",
      had_alcohol_last_24h: false,
      ate_before_donation: false,
      ate_fatty_food: false,
      recent_tattoo_or_piercing: false,
      has_chronic_condition: false,
      condition_controlled: true,
      last_donation_date: "",
    });
    setWillingToDonate(null);
    closeAllKeypads();
  };

  const [activeKeypadName, setActiveKeypadName] = useState<string | null>(null);

  // Numeric Keypad for Age
  const ageKeypad = useNumericKeypad({
    onValueChange: (value) => {
      setFormData((prev) => ({ ...prev, age: value }));
      // Optional: don't close automatically if you want them to keep typing,
      // but usually done button closes it.
    },
    allowDecimal: false,
    maxLength: 3,
    min: 1,
    max: 120,
  });

  // Numeric Keypad for Weight
  const weightKeypad = useNumericKeypad({
    onValueChange: (value) => {
      setFormData((prev) => ({ ...prev, weight: value }));
    },
    allowDecimal: true,
    maxLength: 6,
    min: 20,
    max: 300,
  });

  // Numeric Keypad for Height
  const heightKeypad = useNumericKeypad({
    onValueChange: (value) => {
      setFormData((prev) => ({ ...prev, height: value }));
    },
    allowDecimal: true,
    maxLength: 6,
    min: 50,
    max: 250,
  });

  // Numeric Keypad for Sleep Hours
  const sleepKeypad = useNumericKeypad({
    onValueChange: (value) => {
      setFormData((prev) => ({ ...prev, sleep_hours: value }));
    },
    allowDecimal: true,
    maxLength: 4,
    min: 0,
    max: 24,
  });

  // Handle opening keypads with state tracking
  const openKeypad = (name: string, hook: any, initialValue: string) => {
    // Close all keypads first (prevents stale state)
    ageKeypad.close();
    weightKeypad.close();
    heightKeypad.close();
    sleepKeypad.close();

    setActiveKeypadName(name);
    hook.open(name, initialValue);
  };

  const closeKeypad = (hook: any) => {
    hook.close();
    setActiveKeypadName(null);
  };

  const closeAllKeypads = () => {
    ageKeypad.close();
    weightKeypad.close();
    heightKeypad.close();
    sleepKeypad.close();
    setActiveKeypadName(null);
  };

  const isBasicInfoComplete =
    formData.age && formData.weight && formData.height && formData.gender;
  const willingToDonateValue =
    willingToDonate === null ? "" : willingToDonate === true ? "yes" : "no";

  return (
    <ProtectedRoute requireSession={true} requiredStep={STEPS.DEMOGRAPHICS}>
      <>
        <SessionEndModal
          isOpen={showModal}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />

        {/* Loading Overlay (bigger, kiosk-friendly) */}
        {loading && (
          <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                <div
                  className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-teal-400 rounded-full animate-spin"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "1s",
                  }}
                />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800 mb-1">
                  Preparing Fingerprint Scan
                </p>
                <p className="text-base text-gray-600">Please wait a moment…</p>
              </div>
            </div>
          </div>
        )}

        <div className="h-screen px-28 py-6 bg-white flex flex-col overflow-none">
          <main className="flex-1 w-full flex flex-col">
            <ProgressHeader
              currentStep={STEPS.DEMOGRAPHICS}
              totalSteps={4}
              title="Tell Us a Bit About You"
              subtitle="These details help personalize your fingerprint-based health insights. Nothing here identifies you personally."
              accentColor="#00c2cb"
            />

            <div>
              <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-hidden flex flex-col"
              >
                <div className="flex flex-row gap-3 overflow-hidden">
                  {/* Left column - Basic Info and Blood Donation Interest */}
                  <div className="flex flex-col flex-3 min-w-0">
                    <div className="lg:col-span-3 flex flex-col gap-2 transition-opacity duration-300">
                      {/* Basic Information Card */}
                      <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-100 hover:shadow-md transition-shadow flex-1 overflow-auto select-none">
                        {/* Header */}
                        <div className="flex items-start mb-3">
                          <div className="w-10 h-10 bg-linear-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center mr-3 shrink-0">
                            <User className="h-5 w-5 text-teal-600" />
                          </div>
                          <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-800 leading-tight">
                              Your Health Context
                            </h2>
                            <p className="text-teal-600 text-lg font-semibold leading-tight">
                              Background information for screening
                            </p>
                            <p className="text-slate-500 text-base leading-relaxed mt-1">
                              This information helps us better understand
                              patterns in your results.
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

                        {/* Row 1: Age, Weight, Height */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          {/* Age */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor="age"
                                className="text-lg font-semibold text-slate-700 flex items-center gap-1.5"
                              >
                                <span className="text-base">🎂</span>
                                <span>Age</span>
                              </Label>
                              <span className="text-red-500 text-sm">*</span>

                              {/* Tooltip */}
                              <div className="relative inline-flex group">
                                <button
                                  type="button"
                                  className="text-slate-400 hover:text-slate-600 transition-colors"
                                  aria-label="Why we ask for age"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>

                                {/* Tooltip */}
                                <div
                                  role="tooltip"
                                  className="pointer-events-none absolute left-45 bottom-full z-50 mt-2 w-max -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-md text-slate-700 shadow-lg opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
                                >
                                  Helps us adjust results for age-related
                                  differences.
                                </div>
                              </div>
                            </div>

                            <Input
                              id="age"
                              name="age"
                              type="text"
                              inputMode="none"
                              placeholder="e.g., 25"
                              value={formData.age}
                              onFocus={() =>
                                openKeypad("age", ageKeypad, formData.age)
                              }
                              readOnly
                              required
                              className={`h-10 text-sm font-medium rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                                activeKeypadName === "age"
                                  ? "border-teal-500 ring-2 ring-teal-100 bg-teal-50"
                                  : formData.age
                                  ? "border-green-400 bg-green-50 text-green-700"
                                  : "border-slate-300 bg-white hover:border-teal-400"
                              }`}
                            />
                          </div>

                          {/* Weight */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Label
                                htmlFor="weight"
                                className="text-lg font-semibold text-slate-700 flex items-center gap-1.5"
                              >
                                <span className="text-base">⚖️</span>
                                <span>Weight</span>
                              </Label>
                              <span className="text-red-500 text-sm">*</span>

                              {/* Tooltip */}
                              <div className="relative inline-flex group">
                                <button
                                  type="button"
                                  className="text-slate-400 hover:text-slate-600 transition-colors"
                                  aria-label="Why we ask for age"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>

                                {/* Tooltip */}
                                <div
                                  role="tooltip"
                                  className="pointer-events-none absolute left-30 bottom-full z-50 mt-2 w-max -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-md text-slate-700 shadow-lg opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
                                >
                                  Used only to calculate general health
                                  indicators.
                                </div>
                              </div>
                            </div>
                            <Input
                              id="weight"
                              name="weight"
                              type="text"
                              inputMode="none"
                              placeholder="e.g., 65.5"
                              value={formData.weight}
                              onFocus={() =>
                                openKeypad(
                                  "weight",
                                  weightKeypad,
                                  formData.weight
                                )
                              }
                              readOnly
                              required
                              className={`h-10 text-sm font-medium rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                                activeKeypadName === "weight"
                                  ? "border-teal-500 ring-2 ring-teal-100 bg-teal-50"
                                  : formData.weight
                                  ? "border-green-400 bg-green-50 text-green-700"
                                  : "border-slate-300 bg-white hover:border-teal-400"
                              }`}
                            />
                          </div>

                          {/* Height */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Label
                                htmlFor="height"
                                className="text-lg font-semibold text-slate-700 flex items-center gap-1.5"
                              >
                                <span className="text-base">📏</span>
                                <span>Height</span>
                              </Label>
                              <span className="text-red-500 text-sm">*</span>

                              {/* Tooltip */}
                              <div className="relative inline-flex group">
                                <button
                                  type="button"
                                  className="text-slate-400 hover:text-slate-600 transition-colors"
                                  aria-label="Why we ask for age"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>

                                {/* Tooltip */}
                                <div
                                  role="tooltip"
                                  className="pointer-events-none absolute -left-20 bottom-full z-50 mt-2 w-max -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-md text-slate-700 shadow-lg opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
                                >
                                  Used together with weight for basic
                                  calculations.
                                </div>
                              </div>
                            </div>
                            <Input
                              id="height"
                              name="height"
                              type="text"
                              inputMode="none"
                              placeholder="e.g., 170"
                              value={formData.height}
                              onFocus={() =>
                                openKeypad(
                                  "height",
                                  heightKeypad,
                                  formData.height
                                )
                              }
                              readOnly
                              required
                              className={`h-10 text-sm font-medium rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                                activeKeypadName === "height"
                                  ? "border-teal-500 ring-2 ring-teal-100 bg-teal-50"
                                  : formData.height
                                  ? "border-green-400 bg-green-50 text-green-700"
                                  : "border-slate-300 bg-white hover:border-teal-400"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Row 2: Gender, Blood Type, and BMI */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Gender */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <Label
                                htmlFor="gender"
                                className="text-lg font-semibold text-slate-700 flex items-center gap-1.5"
                              >
                                <span className="text-base">🚻</span>
                                <span>Gender</span>
                              </Label>
                              <span className="text-red-500 text-sm">*</span>

                              {/* Tooltip */}
                              <div className="relative inline-flex group">
                                <button
                                  type="button"
                                  className="text-slate-400 hover:text-slate-600 transition-colors"
                                  aria-label="Why we ask for age"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>

                                {/* Tooltip */}
                                <div
                                  role="tooltip"
                                  className="pointer-events-none absolute left-45 bottom-full z-50 mt-2 w-max -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-md text-slate-700 shadow-lg opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
                                >
                                  Helps us account for biological differences in
                                  patterns.
                                </div>
                              </div>
                            </div>

                            <Select
                              name="gender"
                              value={formData.gender}
                              onValueChange={(val) =>
                                handleSelectChange("gender", val)
                              }
                            >
                              <SelectTrigger className="h-11 w-full text-sm font-medium rounded-lg border-2 border-slate-300 hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 bg-white transition-all flex items-center justify-between px-3 cursor-pointer">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent className="rounded-lg border-2 border-slate-200">
                                <SelectItem
                                  value="male"
                                  className="cursor-pointer"
                                >
                                  Male
                                </SelectItem>
                                <SelectItem
                                  value="female"
                                  className="cursor-pointer"
                                >
                                  Female
                                </SelectItem>
                                <SelectItem
                                  value="prefer_not_say"
                                  className="cursor-pointer"
                                >
                                  Prefer not to say
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Blood Type */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor="blood-type"
                                className="text-lg font-semibold text-slate-700 flex items-center gap-1.5"
                              >
                                <span className="text-base">🩸</span>
                                <span>Blood Type</span>
                              </Label>
                              <span className="text-slate-600 text-xs">
                                &#40;Optional&#41;
                              </span>

                              {/* Tooltip */}
                              <div className="relative inline-flex group">
                                <button
                                  type="button"
                                  className="text-slate-400 hover:text-slate-600 transition-colors"
                                  aria-label="Why we ask for age"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>

                                {/* Tooltip */}
                                <div
                                  role="tooltip"
                                  className="pointer-events-none absolute left-25 bottom-full z-50 mt-2 w-max -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-md text-slate-700 shadow-lg opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
                                >
                                  Optional. If known, it helps us compare
                                  results more accurately.
                                </div>
                              </div>
                            </div>
                            <Select
                              name="blood_type"
                              value={formData.blood_type}
                              onValueChange={(val) =>
                                handleSelectChange("blood_type", val)
                              }
                            >
                              <SelectTrigger className="h-11 w-full text-sm font-medium rounded-lg border-2 border-slate-300 hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 bg-white transition-all flex items-center justify-between px-3 cursor-pointer">
                                <SelectValue placeholder="Select if known" />
                              </SelectTrigger>
                              <SelectContent className="rounded-lg border-2 border-slate-200">
                                <SelectItem
                                  value="unknown"
                                  className="cursor-pointer"
                                >
                                  Unknown
                                </SelectItem>
                                <SelectItem
                                  value="O"
                                  className="cursor-pointer"
                                >
                                  O
                                </SelectItem>
                                <SelectItem
                                  value="A"
                                  className="cursor-pointer"
                                >
                                  A
                                </SelectItem>
                                <SelectItem
                                  value="B"
                                  className="cursor-pointer"
                                >
                                  B
                                </SelectItem>
                                <SelectItem
                                  value="AB"
                                  className="cursor-pointer"
                                >
                                  AB
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* BMI Display */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Label className="text-lg font-semibold text-slate-700 flex items-center gap-1.5">
                                <span className="text-base">📊</span>
                                <span>BMI</span>
                              </Label>

                              {/* Tooltip */}
                              <div className="relative inline-flex group">
                                <button
                                  type="button"
                                  className="text-slate-400 hover:text-slate-600 transition-colors"
                                  aria-label="Why we ask for age"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>

                                {/* Tooltip */}
                                <div
                                  role="tooltip"
                                  className="pointer-events-none absolute -left-20 bottom-full z-50 mt-2 w-max -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-md text-slate-700 shadow-lg opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
                                >
                                  A simple reference number based on height and
                                  weight.
                                </div>
                              </div>
                            </div>

                            {bmiValue ? (
                              <div className="h-11 rounded-lg border-2 border-slate-200 bg-linear-to-br from-teal-50 to-cyan-50 flex items-center justify-between px-3">
                                <span className="text-xl font-black text-teal-600">
                                  {bmiValue}
                                </span>
                                {bmiCategory && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-sm font-semibold ${
                                      bmiCategory.color === "green"
                                        ? "bg-green-100 text-green-700"
                                        : bmiCategory.color === "blue"
                                        ? "bg-blue-100 text-blue-700"
                                        : bmiCategory.color === "amber"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-orange-100 text-orange-700"
                                    }`}
                                  >
                                    {bmiCategory.label}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="h-11 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center select-none">
                                <span className="text-xs text-slate-400 italic">
                                  Calculated automatically from height and
                                  weight.
                                </span>
                              </div>
                            )}
                            {bmiValue && (
                              <p className="text-xs text-slate-400 italic">
                                {age >= 18
                                  ? "WHO adult guideline"
                                  : "For reference only"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Blood Donation Interest Card */}
                      <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-start mb-3">
                          <div className="w-10 h-10 bg-linear-to-br from-red-50 to-pink-50 rounded-xl flex items-center justify-center mr-3 shrink-0">
                            <Heart className="h-5 w-5 text-red-500" />
                          </div>
                          <div className="flex-1 select-none">
                            <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-1">
                              Blood Donation Awareness
                            </h2>
                            <p className="text-slate-500 text-base leading-relaxed">
                              Optional eligibility guidance
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-lg font-medium text-slate-700 mb-2 block leading-relaxed select-none">
                            Would you like to learn whether you may be eligible
                            to donate blood based on general guidelines?
                          </Label>
                          <RadioGroup
                            value={willingToDonateValue}
                            onValueChange={(value) => {
                              closeAllKeypads();
                              setWillingToDonate(value === "yes");
                            }}
                            className="space-y-2"
                          >
                            <div className="flex items-center p-3 rounded-xl bg-white border-2 border-slate-200 cursor-pointer transition-all hover:border-teal-300 hover:bg-teal-50/30 has-checked:border-teal-500 has-checked:bg-teal-50 has-checked:shadow-sm">
                              <RadioGroupItem
                                value="yes"
                                id="yes"
                                className="border-slate-300 data-[state=checked]:border-teal-500 data-[state=checked]:bg-teal-500"
                              />
                              <Label
                                htmlFor="yes"
                                className="text-lg font-medium text-slate-700 cursor-pointer ml-3 flex items-center gap-1.5 flex-1"
                              >
                                <span className="text-base">❤️</span>
                                <span>
                                  Yes, I'd like to learn about blood donation
                                  eligibility
                                </span>
                              </Label>
                            </div>

                            <div className="flex items-center p-3 rounded-xl bg-white border-2 border-slate-200 cursor-pointer transition-all hover:border-slate-300 hover:bg-slate-50 has-checked:border-slate-400 has-checked:bg-slate-50 has-checked:shadow-sm">
                              <RadioGroupItem
                                value="no"
                                id="no"
                                className="border-slate-300 data-[state=checked]:border-slate-500 data-[state=checked]:bg-slate-500"
                              />
                              <Label
                                htmlFor="no"
                                className="text-lg font-medium text-slate-700 cursor-pointer ml-3 flex-1"
                              >
                                No, skip this section
                              </Label>
                            </div>
                          </RadioGroup>
                          <p className="text-base text-slate-500 mt-2 leading-relaxed select-none">
                            💡 This is optional and does not affect your health
                            screening results.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right column - Keypad OR Info Cards */}
                  <div className="flex flex-col flex-2">
                    {activeKeypadName ? (
                      <div className="h-full min-h-[300px] animate-in fade-in duration-300">
                        {/* Render appropriate keypad based on name */}
                        {activeKeypadName === "age" && (
                          <NumericKeypad
                            variant="inline"
                            isOpen={true}
                            value={ageKeypad.value}
                            error={ageKeypad.error}
                            onKeyPress={ageKeypad.handleKeyPress}
                            onBackspace={ageKeypad.handleBackspace}
                            onDone={(val) => {
                              ageKeypad.handleDone();
                              closeKeypad(ageKeypad);
                            }}
                            onClose={() => closeKeypad(ageKeypad)}
                            allowDecimal={false}
                            title="Enter Age"
                            placeholder="Age…"
                            onClear={() => ageKeypad.open("age", "")}
                            unitMode="none"
                          />
                        )}

                        {activeKeypadName === "weight" && (
                          <NumericKeypad
                            variant="inline"
                            isOpen={true}
                            value={weightKeypad.value}
                            error={weightKeypad.error}
                            onKeyPress={weightKeypad.handleKeyPress}
                            onBackspace={weightKeypad.handleBackspace}
                            onDone={(kgValue) => {
                              setFormData((prev) => ({
                                ...prev,
                                weight: kgValue,
                              }));
                              closeKeypad(weightKeypad);
                            }}
                            onClose={() => closeKeypad(weightKeypad)}
                            allowDecimal={true}
                            title="Enter Weight"
                            placeholder="0.0"
                            unitMode="weight"
                            initialUnit="kg"
                            onClear={() => weightKeypad.open("weight", "")}
                          />
                        )}
                        {activeKeypadName === "height" && (
                          <NumericKeypad
                            variant="inline"
                            isOpen={true}
                            value={heightKeypad.value}
                            error={heightKeypad.error}
                            onKeyPress={heightKeypad.handleKeyPress}
                            onBackspace={heightKeypad.handleBackspace}
                            onDone={(cmValue) => {
                              setFormData((prev) => ({
                                ...prev,
                                height: cmValue,
                              }));
                              closeKeypad(heightKeypad);
                            }}
                            onClose={() => closeKeypad(heightKeypad)}
                            allowDecimal={true}
                            title="Enter Height"
                            placeholder="0"
                            unitMode="height"
                            initialUnit="cm"
                            ftValue={heightFt}
                            inValue={heightIn}
                            onFtInChange={(ft, inch) => {
                              setHeightFt(ft);
                              setHeightIn(inch);
                            }}
                            onClear={() => {
                              heightKeypad.open("height", "");
                              setHeightFt("");
                              setHeightIn("");
                            }}
                          />
                        )}
                        {activeKeypadName === "sleep_hours" && (
                          <NumericKeypad
                            variant="inline"
                            isOpen={true}
                            value={sleepKeypad.value}
                            error={sleepKeypad.error}
                            onKeyPress={sleepKeypad.handleKeyPress}
                            onBackspace={sleepKeypad.handleBackspace}
                            onDone={() => {
                              sleepKeypad.handleDone();
                              closeKeypad(sleepKeypad);
                            }}
                            onClose={() => closeKeypad(sleepKeypad)}
                            allowDecimal={true}
                            title="Enter sleep hours"
                            placeholder="8.0"
                            onClear={() => sleepKeypad.open("sleep_hours", "")}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="animate-in fade-in duration-300">
                        {/* Informational card when no keypad is active */}

                        {(willingToDonate === false ||
                          willingToDonate === null) && (
                          <div className="bg-linear-to-br from-teal-50 via-cyan-50 to-blue-50 rounded-3xl p-5 shadow-lg border-2 border-teal-200 hover:shadow-xl transition-shadow duration-300 select-none">
                            {/* Header */}
                            <div className="flex items-center mb-4 pb-3 border-b-2 border-teal-200">
                              <div className="w-10 h-10 bg-linear-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mr-3 shadow-sm">
                                <Fingerprint className="h-5 w-5 text-teal-600" />
                              </div>

                              <div>
                                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                                  🔍 What Happens Next
                                </h3>
                                <p className="text-slate-600 text-sm leading-snug font-medium">
                                  Your analysis journey
                                </p>
                              </div>
                            </div>

                            {/* Steps */}
                            <div className="space-y-3">
                              <div className="bg-white/90 rounded-xl p-4">
                                <p className="text-base text-slate-700 leading-relaxed flex items-start">
                                  <CheckCircle className="h-5 w-5 text-teal-500 mr-3 shrink-0 mt-0.5" />
                                  <span>
                                    Our AI analyzes your fingerprint patterns
                                    using dermatoglyphic research
                                  </span>
                                </p>
                              </div>

                              <div className="bg-white/90 rounded-xl p-4">
                                <p className="text-base text-slate-700 leading-relaxed flex items-start">
                                  <Heart className="h-5 w-5 text-red-500 mr-3 shrink-0 mt-0.5" />
                                  <span>
                                    You’ll receive personalized health insights
                                    and recommendations
                                  </span>
                                </p>
                              </div>

                              <div className="bg-white/90 rounded-xl p-4">
                                <p className="text-base text-slate-700 leading-relaxed flex items-start">
                                  <User className="h-5 w-5 text-blue-500 mr-3 shrink-0 mt-0.5" />
                                  <span>
                                    Your data is processed securely and never
                                    stored permanently
                                  </span>
                                </p>
                              </div>

                              {/* Alert */}
                              <Alert className="border-2 border-teal-300 bg-teal-50 px-4 py-3 rounded-xl">
                                <AlertDescription className="text-teal-900 text-sm font-semibold leading-relaxed">
                                  ⚠️ For educational purposes only. Always
                                  consult healthcare professionals.
                                </AlertDescription>
                              </Alert>
                            </div>
                          </div>
                        )}

                        {willingToDonate === true && (
                          <div className="bg-linear-to-br from-rose-50 via-red-50 to-pink-50 rounded-3xl p-5 shadow-lg border-2 border-rose-200 hover:shadow-xl transition-shadow duration-300 select-none">
                            {/* Header */}
                            <div className="flex items-center mb-4 pb-3 border-b-2 border-rose-200">
                              <div className="w-10 h-10 bg-linear-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center mr-3 shadow-sm">
                                <Heart className="h-5 w-5 text-rose-600" />
                              </div>

                              <div>
                                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                                  🩸 Blood Donation: Quick Facts
                                </h3>
                                <p className="text-slate-600 text-sm leading-snug font-medium">
                                  Helpful info if you’re considering donating
                                </p>
                              </div>
                            </div>

                            {/* Facts */}
                            <div className="space-y-3">
                              <div className="bg-white/90 rounded-xl p-4">
                                <p className="text-base text-slate-700 leading-relaxed flex items-start">
                                  <CheckCircle className="h-5 w-5 text-rose-500 mr-3 shrink-0 mt-0.5" />
                                  <span>
                                    One whole-blood donation can help multiple
                                    patients.
                                  </span>
                                </p>
                              </div>

                              <div className="bg-white/90 rounded-xl p-4">
                                <p className="text-base text-slate-700 leading-relaxed flex items-start">
                                  <CheckCircle className="h-5 w-5 text-rose-500 mr-3 shrink-0 mt-0.5" />
                                  <span>
                                    The donation itself typically takes about
                                    8–10 minutes; the whole visit is usually
                                    under an hour.
                                  </span>
                                </p>
                              </div>

                              <div className="bg-white/90 rounded-xl p-4">
                                <p className="text-base text-slate-700 leading-relaxed flex items-start">
                                  <CheckCircle className="h-5 w-5 text-rose-500 mr-3 shrink-0 mt-0.5" />
                                  <span>
                                    Hydrate and have a light meal beforehand;
                                    avoid heavy exercise right after donating.
                                  </span>
                                </p>
                              </div>

                              <div className="bg-white/90 rounded-xl p-4">
                                <p className="text-base text-slate-700 leading-relaxed flex items-start">
                                  <CheckCircle className="h-5 w-5 text-rose-500 mr-3 shrink-0 mt-0.5" />
                                  <span>
                                    Eligibility varies by country and provider;
                                    tattoos, piercings, travel, or recent
                                    illnesses can affect timing.
                                  </span>
                                </p>
                              </div>

                              <Alert className="border-2 border-rose-300 bg-rose-50 px-4 py-3 rounded-xl">
                                <AlertDescription className="text-rose-900 text-sm font-semibold leading-relaxed">
                                  ℹ️ Always check your local blood center’s
                                  official guidelines for up‑to‑date eligibility
                                  criteria.
                                </AlertDescription>
                              </Alert>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-between items-center mt-5 select-none">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/consent")}
                    className="flex items-center border-2 border-gray-300 hover:bg-gray-50 h-14 text-base font-bold cursor-pointer rounded-xl"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearForm}
                    className="h-14 px-6 text-red-600 border-red-300 hover:bg-red-50 text-base rounded-md bg-transparent cursor-pointer"
                  >
                    <X size={16} />
                    Clear Fields
                  </Button>

                  <div className="flex flex-col items-end">
                    <Button
                      type="submit"
                      disabled={!isBasicInfoComplete || loading}
                      className="flex items-center gap-2 px-6 py-2 h-14 rounded-xl bg-[#00c2cb] hover:bg-[#00a8b0] text-white font-bold text-xl shadow-lg cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                          <span>Processing…</span>
                        </>
                      ) : (
                        <>
                          <span>Continue to Fingerprint Scan</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </Button>
                    <p className="text-xs mt-1 text-gray-500">
                      Takes less than 1 minute • No needles • Non-invasive
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                      <span>🛡️</span>
                      <span>Your privacy is always protected</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </main>

          <Footer fixed={true} />
        </div>
      </>
    </ProtectedRoute>
  );
}
