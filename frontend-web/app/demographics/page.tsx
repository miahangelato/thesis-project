"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useSession } from "@/contexts/session-context";
import { useBackNavigation } from "@/hooks/use-back-navigation";

import { sessionAPI } from "@/lib/api";
import { ROUTES, STEPS } from "@/lib/constants";
import { useDemographicsForm } from "@/hooks/use-demographics-form";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { StepNavigation } from "@/components/layout/step-navigation";
import { ProgressHeader } from "@/components/layout/progress-header";

import { Footer } from "@/components/layout/footer";

import { SessionEndModal } from "@/components/modals/session-end-modal";
import { ConfirmModal } from "@/components/modals/confirm-modal";

import { StaticInfoPanel } from "@/components/demographics/static-info-panel";
import { PreparingScanOverlay } from "@/components/demographics/preparing-scan-overlay";
import { InlineNumericKeypad } from "@/components/ui/inline-numeric-keypad";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InfoTooltip } from "@/components/ui/info-tooltip";

import { AlertTriangle, CheckCircle, Shield, User, X } from "lucide-react";

export default function DemographicsPage() {
  const router = useRouter();
  const { sessionId, setCurrentStep } = useSession();
  const [loading, setLoading] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  const { showModal, handleConfirm, handleCancel, promptBackNavigation } =
    useBackNavigation(false);

  const getFieldError = (fieldName: string) => {
    return validationWarnings.find(
      (w) => w.field === fieldName && w.severity === "error"
    );
  };

  const getFieldWarning = (fieldName: string) => {
    return validationWarnings.find(
      (w) => w.field === fieldName && w.severity === "warning"
    );
  };

  const {
    weightUnit,
    heightUnit,
    heightFt,
    heightIn,
    activeField,
    formData,
    setFormData,
    setHeightFt,
    setHeightIn,
    switchWeightUnit,
    switchHeightUnit,
    handleFieldFocus,
    handleFieldBlur,
    dismissKeypad,
    handleKeypadInput,
    handleBackspace,
    handleKeypadConfirm,
    clearFields,
    weightKg,
    heightCm,
    bmiValue,
    bmiCategory,
    isBasicInfoComplete,
    validationWarnings,
    hasErrors,
    hasWarnings,
  } = useDemographicsForm();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    dismissKeypad();
    if (loading) return;

    if (!formData.age || !formData.weight || !formData.gender || !heightCm) {
      alert("Please fill out age, weight, height, and gender.");
      return;
    }

    if (hasErrors) {
      const errorMessages = validationWarnings
        .filter((w) => w.severity === "error")
        .map((w) => w.message)
        .join("\n");
      alert("Please fix the following errors before continuing:\n\n" + errorMessages);
      return;
    }

    if (hasWarnings) {
      const warnings = validationWarnings.filter((w) => w.severity === "warning");

      const onlyBmiWarnings =
        warnings.length > 0 &&
        warnings.every((w) => {
          const f = (w.field || "").toString().toLowerCase();
          return f === "bmi" || f.includes("bmi");
        });

      if (!onlyBmiWarnings) {
        const warningMessages = warnings.map((w) => w.message).join("\n");
        const confirmed = confirm(
          "Note: The following concerns were detected:\n\n" +
            warningMessages +
            "\n\nDo you want to continue anyway?"
        );
        if (!confirmed) return;
      }
    }

    setLoading(true);
    const start = Date.now();
    const ensureMinDelay = async (minMs: number) => {
      const elapsed = Date.now() - start;
      if (elapsed < minMs) {
        await new Promise((res) => setTimeout(res, minMs - elapsed));
      }
    };

    try {
      setCurrentStep(STEPS.SCAN);

      if (sessionId) {
        const payload = {
          age: parseInt(formData.age, 10),
          weight_kg: weightKg ? Number(weightKg.toFixed(1)) : 0,
          height_cm: Math.round(heightCm),
          gender:
            formData.gender === "prefer_not_to_say" ? "prefer_not_say" : formData.gender,
          willing_to_donate: formData.showDonationCentersLater,
          blood_type: formData.blood_type === "unknown" ? undefined : formData.blood_type,
        };

        await sessionAPI.submitDemographics(sessionId, payload);
        sessionStorage.setItem(
          "demographics",
          JSON.stringify({
            ...payload,
            show_donation_centers_later: formData.showDonationCentersLater,
          })
        );
      }

      await ensureMinDelay(5000);

      router.push(ROUTES.SCAN);
    } catch (err) {
      setCurrentStep(STEPS.SCAN);
      await ensureMinDelay(5000);
      router.push(ROUTES.SCAN);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requireSession={true} requiredStep={STEPS.DEMOGRAPHICS}>
      <>
        <SessionEndModal
          isOpen={showModal}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />

        <PreparingScanOverlay isOpen={loading} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-screen px-28 py-6 bg-white flex flex-col overflow-x-hidden overflow-y-auto"
        >
          <main className="flex-1 w-full max-w-full flex flex-col">
            <ProgressHeader
              currentStep={STEPS.DEMOGRAPHICS}
              totalSteps={4}
              title="Tell Us a Bit About You"
              subtitle="These details help personalize your results. No personal identification is stored."
              accentColor="#00c2cb"
              onEndSession={promptBackNavigation}
            />

            <form
              id="demographics-form"
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 flex flex-row gap-3 overflow-hidden">
                <div className="flex flex-col flex-3 min-w-0 gap-4">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-100 hover:shadow-md transition-shadow select-none">
                    <div className="flex items-start mb-3">
                      <div className="w-10 h-10 bg-linear-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center mr-3 shrink-0">
                        <User className="h-5 w-5 text-teal-600" />
                      </div>

                      <div className="flex-1">
                        <h2 className="text-3xl font-bold text-slate-800 leading-tight">
                          Your Health Context
                        </h2>
                        <p className="text-teal-600 text-lg font-semibold leading-tight">
                          Background information for screening
                        </p>
                        <p className="text-slate-500 text-lg leading-relaxed mt-1">
                          This information helps us better understand patterns in your
                          results.
                        </p>
                      </div>

                      {isBasicInfoComplete && !hasErrors && (
                        <div className="shrink-0 ml-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="age"
                            className="text-lg font-semibold text-slate-900 flex items-center gap-1.5"
                          >
                            <span className="text-lg">🎂</span>
                            <span>Age</span>
                          </Label>
                          <span className="text-red-500 text-lg">*</span>
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
                          onClick={() => handleFieldFocus("age")}
                          onBlur={handleFieldBlur}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d{0,3}$/.test(val))
                              setFormData((p) => ({ ...p, age: val }));
                          }}
                          required
                          className={`h-14 text-lg font-bold rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                            getFieldError("age")
                              ? "border-red-400 bg-red-50 text-red-700"
                              : activeField === "age"
                                ? `border-teal-500 ring-2 ring-teal-100 ${
                                    formData.age
                                      ? "bg-green-50! text-green-700"
                                      : "bg-teal-50!"
                                  }`
                                : formData.age
                                  ? "border-green-400 bg-green-50! text-green-700"
                                  : ""
                          }`}
                        />
                        {getFieldError("age") && (
                          <p className="text-sm text-red-600 mt-1 flex items-start gap-1">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{getFieldError("age")!.message}</span>
                          </p>
                        )}
                        {!getFieldError("age") && getFieldWarning("age") && (
                          <p className="text-sm text-amber-600 mt-1 flex items-start gap-1">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{getFieldWarning("age")!.message}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="weight"
                            className="text-lg font-semibold text-slate-900 flex items-center gap-1.5"
                          >
                            <span className="text-lg">⚖️</span>
                            <span>Weight</span>
                          </Label>
                          <span className="text-red-500 text-lg">*</span>
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
                          onClick={() => handleFieldFocus("weight")}
                          onBlur={handleFieldBlur}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*\.?\d*$/.test(val))
                              setFormData((p) => ({ ...p, weight: val }));
                          }}
                          required
                          className={`h-14 text-lg font-bold rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                            getFieldError("weight")
                              ? "border-red-400 bg-red-50 text-red-700"
                              : activeField === "weight"
                                ? `border-teal-500 ring-2 ring-teal-100 ${
                                    formData.weight
                                      ? "bg-green-50! text-green-700"
                                      : "bg-teal-50!"
                                  }`
                                : formData.weight
                                  ? "border-green-400 bg-green-50! text-green-700"
                                  : ""
                          }`}
                        />
                        {getFieldError("weight") && (
                          <p className="text-sm text-red-600 mt-1 flex items-start gap-1">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{getFieldError("weight")!.message}</span>
                          </p>
                        )}
                        {!getFieldError("weight") && getFieldWarning("weight") && (
                          <p className="text-sm text-amber-600 mt-1 flex items-start gap-1">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{getFieldWarning("weight")!.message}</span>
                          </p>
                        )}

                        <div className="flex gap-0 mt-2 bg-slate-100 rounded-lg p-1 w-fit">
                          <button
                            type="button"
                            onClick={() => {
                              if (weightUnit === "lb") switchWeightUnit("kg");
                            }}
                            className={`h-9 px-6 text-lg font-semibold rounded-md transition-all cursor-pointer ${
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
                              if (weightUnit === "kg") switchWeightUnit("lb");
                            }}
                            className={`h-9 px-6 text-lg font-semibold rounded-md transition-all cursor-pointer ${
                              weightUnit === "lb"
                                ? "bg-[#00c2cb] text-white shadow-sm"
                                : "bg-transparent text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            lb
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="height"
                            className="text-lg font-semibold text-slate-900 flex items-center gap-1.5"
                          >
                            <span className="text-lg">📏</span>
                            <span>Height</span>
                          </Label>
                          <span className="text-red-500 text-lg">*</span>
                          <InfoTooltip text="Used together with weight for basic calculations." />
                        </div>

                        {heightUnit === "cm" ? (
                          <>
                            <Input
                              id="height"
                              name="height"
                              type="text"
                              inputMode="numeric"
                              placeholder="e.g., 170"
                              autoComplete="off"
                              readOnly
                              value={formData.heightCm}
                              onFocus={() => handleFieldFocus("heightCm")}
                              onClick={() => handleFieldFocus("heightCm")}
                              onBlur={handleFieldBlur}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val))
                                  setFormData((p) => ({ ...p, heightCm: val }));
                              }}
                              required
                              className={`h-14 text-lg font-bold rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                                getFieldError("height")
                                  ? "border-red-400 bg-red-50 text-red-700"
                                  : activeField === "heightCm"
                                    ? `border-teal-500 ring-2 ring-teal-100 ${
                                        formData.heightCm
                                          ? "bg-green-50! text-green-700"
                                          : "bg-teal-50!"
                                      }`
                                    : formData.heightCm
                                      ? "border-green-400 bg-green-50! text-green-700"
                                      : ""
                              }`}
                            />
                            {getFieldError("height") && (
                              <p className="text-sm text-red-600 mt-1 flex items-start gap-1">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{getFieldError("height")!.message}</span>
                              </p>
                            )}
                            {!getFieldError("height") && getFieldWarning("height") && (
                              <p className="text-sm text-amber-600 mt-1 flex items-start gap-1">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{getFieldWarning("height")!.message}</span>
                              </p>
                            )}
                          </>
                        ) : (
                          <>
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
                                  onFocus={() => handleFieldFocus("heightFt")}
                                  onClick={() => handleFieldFocus("heightFt")}
                                  onBlur={handleFieldBlur}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) setHeightFt(val);
                                  }}
                                  className={`h-14 text-lg font-bold rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                                    getFieldError("height")
                                      ? "border-red-400 bg-red-50 text-red-700"
                                      : heightFt
                                        ? "border-green-400 bg-green-50 text-green-700"
                                        : "border-slate-300 bg-white hover:border-teal-400"
                                  }`}
                                />
                                <span className="text-base text-slate-600 font-medium">
                                  ft
                                </span>
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
                                  onFocus={() => handleFieldFocus("heightIn")}
                                  onClick={() => handleFieldFocus("heightIn")}
                                  onBlur={handleFieldBlur}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (
                                      /^\d*$/.test(val) &&
                                      parseInt(val || "0", 10) < 12
                                    )
                                      setHeightIn(val);
                                  }}
                                  className={`h-14 text-lg font-bold rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                                    getFieldError("height")
                                      ? "border-red-400 bg-red-50 text-red-700"
                                      : heightIn
                                        ? "border-green-400 bg-green-50 text-green-700"
                                        : "border-slate-300 bg-white hover:border-teal-400"
                                  }`}
                                />
                                <span className="text-base text-slate-600 font-medium">
                                  in
                                </span>
                              </div>
                            </div>
                            {getFieldError("height") && (
                              <p className="text-sm text-red-600 mt-1 flex items-start gap-1">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{getFieldError("height")!.message}</span>
                              </p>
                            )}
                            {!getFieldError("height") && getFieldWarning("height") && (
                              <p className="text-sm text-amber-600 mt-1 flex items-start gap-1">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{getFieldWarning("height")!.message}</span>
                              </p>
                            )}
                          </>
                        )}

                        <div className="flex gap-0 mt-2 bg-slate-100 rounded-lg p-1 w-fit">
                          <button
                            type="button"
                            onClick={() => {
                              if (heightUnit === "ftin") switchHeightUnit("cm");
                            }}
                            className={`h-9 px-6 text-lg font-semibold rounded-md transition-all cursor-pointer ${
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
                              if (heightUnit === "cm") switchHeightUnit("ftin");
                            }}
                            className={`h-9 px-6 text-lg font-semibold rounded-md transition-all cursor-pointer ${
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="gender"
                            className="text-lg font-semibold text-slate-900 flex items-center gap-1.5"
                          >
                            <span className="text-lg">🚻</span>
                            <span>Gender</span>
                          </Label>
                          <span className="text-red-500 text-lg">*</span>
                          <InfoTooltip text="Helps account for biological differences in general patterns." />
                        </div>

                        <Select
                          value={formData.gender}
                          onValueChange={(val) =>
                            setFormData((p) => ({ ...p, gender: val }))
                          }
                        >
                          <SelectTrigger
                            id="gender"
                            className={`h-14 w-full text-lg font-bold rounded-lg border-2 transition-all duration-200 bg-white flex items-center justify-between px-4 cursor-pointer ${
                              formData.gender
                                ? "border-green-400 bg-green-50 text-green-700"
                                : "border-slate-300 hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                            }`}
                          >
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-2 border-slate-200">
                            <SelectItem
                              value="prefer_not_to_say"
                              className="cursor-pointer"
                            >
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

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="blood_type"
                            className="text-lg font-semibold text-slate-900 flex items-center gap-1.5"
                          >
                            <span className="text-lg">🩸</span>
                            <span>Blood Type</span>
                          </Label>
                          <span className="text-slate-600 text-base">(Optional)</span>
                          <InfoTooltip text="Optional. If known, it helps us compare results more accurately." />
                        </div>

                        <Select
                          value={formData.blood_type}
                          onValueChange={(val) =>
                            setFormData((p) => ({ ...p, blood_type: val }))
                          }
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

                    <div className="mt-4">
                      <div
                        className={`flex items-center justify-between h-14 w-full px-4 bg-white rounded-lg border-2 ${
                          getFieldError("bmi") ? "border-red-400" : "border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">📊</span>
                          <span className="text-lg font-bold text-slate-700">
                            BMI estimate
                          </span>
                          <InfoTooltip text="BMI is a general indicator based on height and weight. It does not account for muscle mass or body composition." />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-slate-900">
                            {bmiValue || "--.-"}
                          </span>
                          {bmiCategory && (
                            <span
                              className={`px-3 py-1 rounded-full text-lg font-bold ${
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
                      {getFieldError("bmi") && (
                        <p className="text-sm text-red-600 mt-1 flex items-start gap-1 px-4">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{getFieldError("bmi")!.message}</span>
                        </p>
                      )}
                      {!getFieldError("bmi") && getFieldWarning("bmi") && (
                        <p className="text-sm text-amber-600 mt-1 flex items-start gap-1 px-4">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{getFieldWarning("bmi")!.message}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-100 hover:shadow-md transition-shadow select-none">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        id="donation-opt-in"
                        checked={formData.showDonationCentersLater}
                        onCheckedChange={(checked) =>
                          setFormData((p) => ({
                            ...p,
                            showDonationCentersLater: Boolean(checked),
                          }))
                        }
                        className="h-8 w-8 border-2 border-slate-400 data-[state=checked]:bg-[#00c2cb] data-[state=checked]:border-[#00c2cb] rounded-md shrink-0"
                      />
                      <Label
                        htmlFor="donation-opt-in"
                        className="text-xl font-bold text-slate-800 cursor-pointer"
                      >
                        Show blood donation centers later
                      </Label>
                      <InfoTooltip text="If selected, we’ll show nearby donation centers after your results." />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col flex-2 gap-4 select-none">
                  <StaticInfoPanel />

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-start gap-4">
                      <Shield className="h-7 w-7 text-slate-500 mt-1 shrink-0" />
                      <div>
                        <strong className="text-2xl text-slate-900 block mb-1">
                          Legal Disclaimer
                        </strong>
                        <p className="text-lg text-slate-600 leading-relaxed">
                          This tool provides predictive insights based on fingerprint and
                          demographic data. It does not replace laboratory tests or
                          medical diagnosis. Always consult healthcare professionals.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border-2 border-red-500 rounded-2xl px-5 py-3 flex gap-4 items-start shadow-sm">
                    <AlertTriangle className="h-7 w-7 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-2xl font-bold text-red-950 mb-1">
                        Important
                      </strong>
                      <p className="text-lg text-red-900 leading-relaxed">
                        This is a screening tool — not a medical diagnosis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </main>

          <div className="mt-8 mb-6 shrink-0 px-0">
            <StepNavigation
              form="demographics-form"
              onBack={() => router.back()}
              isSubmit={true}
              loading={loading}
              isNextDisabled={!isBasicInfoComplete || hasErrors || loading}
              nextLabel="Continue to Fingerprint Scan"
              leftAdornment={
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowClearConfirmModal(true)}
                  className="flex items-center gap-2 h-14 px-6 text-lg font-bold text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer rounded-xl transition-all"
                >
                  <X size={20} className="stroke-[2.5]" />
                  Clear Fields
                </Button>
              }
            />
          </div>

          <Footer
            transparent
            customContent={<>No needles • Non-invasive • Privacy-first</>}
          />
        </motion.div>

        <InlineNumericKeypad
          isVisible={!!activeField}
          allowDecimal={activeField === "weight"}
          onKeyPress={handleKeypadInput}
          onBackspace={handleBackspace}
          onConfirm={handleKeypadConfirm}
          onDismiss={dismissKeypad}
        />

        <ConfirmModal
          isOpen={showClearConfirmModal}
          onPrimary={() => setShowClearConfirmModal(false)}
          onSecondary={() => {
            clearFields();
            setShowClearConfirmModal(false);
          }}
          title="Clear All Fields?"
          description="Everything you have typed will be deleted. Do you want to continue?"
          icon={<AlertTriangle size={56} className="text-red-500" strokeWidth={2.5} />}
          iconWrapperClassName="from-red-50 to-orange-50 border-red-100"
          iconRingClassName="border-red-300"
          primaryLabel="No, Keep My Data"
          secondaryLabel="Yes, Clear Everything"
          primaryButtonClassName="bg-[#00c2cb] hover:bg-[#00adb5] shadow-teal-100/50 h-20 text-2xl active:scale-[0.98]"
          secondaryButtonClassName="h-20 text-2xl active:scale-[0.98] text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100"
        />
      </>
    </ProtectedRoute>
  );
}
