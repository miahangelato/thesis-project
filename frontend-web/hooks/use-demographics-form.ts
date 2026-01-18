"use client";

import React, { useMemo, useState } from "react";
import { cmToFtIn, ftInToCm, kgToLb, lbToKg } from "@/lib/units";

export type WeightUnit = "kg" | "lb";
export type HeightUnit = "cm" | "ftin";
export type ActiveField = "age" | "weight" | "heightCm" | "heightFt" | "heightIn" | null;

export type DemographicsFormData = {
  age: string;
  weight: string;
  heightCm: string;
  gender: string;
  blood_type: string;
  showDonationCentersLater: boolean;
};

export type BmiCategory = {
  label: string;
  color: "blue" | "green" | "amber" | "red";
  description: string;
};

export function useDemographicsForm() {
  // Unit preferences
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");

  // ft/in inputs for heightUnit === "ftin"
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");

  // Keypad routing
  const [activeField, setActiveField] = useState<ActiveField>(null);

  // Form state (clean: NO blood donation eligibility criteria)
  // Load from sessionStorage if available
  const [formData, setFormData] = useState<DemographicsFormData>(() => {
    try {
      const saved = sessionStorage.getItem("demographics");
      if (saved) {
        const data = JSON.parse(saved);
        return {
          age: data.age ? String(data.age) : "",
          weight: data.weight_kg ? String(data.weight_kg) : "",
          heightCm: data.height_cm ? String(data.height_cm) : "",
          gender: data.gender === "prefer_not_say" ? "prefer_not_to_say" : (data.gender || ""),
          blood_type: data.blood_type || "unknown",
          showDonationCentersLater: data.show_donation_centers_later || false,
        };
      }
    } catch (error) {
      console.error("Failed to load demographics from sessionStorage:", error);
    }
    return {
      age: "",
      weight: "",
      heightCm: "",
      gender: "",
      blood_type: "unknown",
      showDonationCentersLater: false,
    };
  });

  const switchWeightUnit = (nextUnit: WeightUnit) => {
    if (nextUnit === weightUnit) return;

    if (nextUnit === "kg") {
      if (formData.weight) {
        const lb = parseFloat(formData.weight);
        const kg = lbToKg(lb).toFixed(1);
        setFormData((p) => ({ ...p, weight: kg }));
      }
      setWeightUnit("kg");
      return;
    }

    if (nextUnit === "lb") {
      if (formData.weight) {
        const kg = parseFloat(formData.weight);
        const lb = kgToLb(kg).toFixed(1);
        setFormData((p) => ({ ...p, weight: lb }));
      }
      setWeightUnit("lb");
    }
  };

  const switchHeightUnit = (nextUnit: HeightUnit) => {
    if (nextUnit === heightUnit) return;

    if (nextUnit === "cm") {
      const ft = parseInt(heightFt || "0", 10);
      const inch = parseInt(heightIn || "0", 10);
      if (ft || inch) {
        setFormData((p) => ({ ...p, heightCm: String(ftInToCm(ft, inch)) }));
      }
      setHeightUnit("cm");
      return;
    }

    if (nextUnit === "ftin") {
      if (formData.heightCm) {
        const cm = parseFloat(formData.heightCm);
        const { feet, inches } = cmToFtIn(cm);
        setHeightFt(String(feet));
        setHeightIn(String(inches));
      }
      setHeightUnit("ftin");
    }
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

  const bmiCategory: BmiCategory | null = useMemo(() => {
    const bmi = bmiValue ? parseFloat(bmiValue) : null;
    const age = parseInt(formData.age || "0", 10);
    if (!bmi || !age || age < 18) return null;

    // Standard Adult BMI Categories (WHO / CDC)
    if (bmi < 18.5) {
      return {
        label: "Underweight",
        color: "blue",
        description:
          "Your BMI is classified as Underweight. This may indicate nutritional deficiency or other health factors.",
      };
    }
    if (bmi < 25) {
      return {
        label: "Normal",
        color: "green",
        description:
          "Your BMI is classified as Normal weight. This range is associated with the lowest health risk.",
      };
    }
    if (bmi < 30) {
      return {
        label: "Overweight",
        color: "amber",
        description:
          "Your BMI is classified as Overweight. People in this range may have an increased risk of developing health conditions.",
      };
    }
    return {
      label: "Obesity",
      color: "red",
      description:
        "Your BMI is classified as Obesity. This is associated with higher health risks. We recommend discussing this with a healthcare professional.",
    };
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

    if (key === ".") {
      if (activeField !== "weight") return;
      setFormData((prev) => {
        if (prev.weight.includes(".")) return prev;
        return { ...prev, weight: prev.weight + "." };
      });
      return;
    }

    switch (activeField) {
      case "age":
        setFormData((prev) => {
          const next = prev.age + key;
          if (next.length > 3) return prev;
          if (!/^\d*$/.test(next)) return prev;
          return { ...prev, age: next };
        });
        break;
      case "weight":
        setFormData((prev) => {
          const next = prev.weight + key;
          if (!/^\d*\.?\d*$/.test(next)) return prev;
          return { ...prev, weight: next };
        });
        break;
      case "heightCm":
        setFormData((prev) => {
          const next = prev.heightCm + key;
          if (!/^\d*$/.test(next)) return prev;
          return { ...prev, heightCm: next };
        });
        break;
      case "heightFt":
        setHeightFt((prev) => {
          const next = prev + key;
          if (!/^\d*$/.test(next)) return prev;
          return next;
        });
        break;
      case "heightIn":
        setHeightIn((prev) => {
          const next = prev + key;
          if (!/^\d*$/.test(next)) return prev;
          if (parseInt(next, 10) > 11) return prev;
          return next;
        });
        break;
      default:
        break;
    }
  };

  const handleBackspace = () => {
    if (!activeField) return;

    if (activeField === "heightFt") {
      setHeightFt((prev) => prev.slice(0, -1));
      return;
    }

    if (activeField === "heightIn") {
      setHeightIn((prev) => prev.slice(0, -1));
      return;
    }

    if (activeField === "age" || activeField === "weight" || activeField === "heightCm") {
      setFormData((prev) => ({
        ...prev,
        [activeField]: prev[activeField].slice(0, -1),
      }));
    }
  };

  const handleKeypadConfirm = () => {
    if (activeField === "age") document.getElementById("weight")?.focus();
    else if (activeField === "weight") {
      // Height: if ft/in mode, focus ft; else focus cm height field
      if (heightUnit === "ftin") document.getElementById("height-ft")?.focus();
      else document.getElementById("height")?.focus();
    } else if (activeField === "heightCm") document.getElementById("gender")?.focus();
    else if (activeField === "heightFt") document.getElementById("height-in")?.focus();
    else if (activeField === "heightIn") document.getElementById("gender")?.focus();

    dismissKeypad();
  };

  // -------------------------
  // Validations (simple)
  // -------------------------
  const isBasicInfoComplete =
    !!formData.age && !!formData.weight && !!formData.gender && !!heightCm;

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

  return {
    // state
    weightUnit,
    heightUnit,
    heightFt,
    heightIn,
    activeField,
    formData,

    // setters
    setFormData,
    setHeightFt,
    setHeightIn,

    // actions
    switchWeightUnit,
    switchHeightUnit,
    handleFieldFocus,
    handleFieldBlur,
    dismissKeypad,
    handleKeypadInput,
    handleBackspace,
    handleKeypadConfirm,
    clearFields,

    // computed
    weightKg,
    heightCm,
    bmiValue,
    bmiCategory,
    isBasicInfoComplete,
  };
}
