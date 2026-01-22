"use client";

import React, { useMemo, useState } from "react";
import { cmToFtIn, ftInToCm, kgToLb, lbToKg } from "@/lib/units";

// Medical validation constants (evidence-based ranges)
const VALIDATION = {
  AGE: {
    MIN: 18,
    MAX: 120,
    SENIOR_THRESHOLD: 65,
  },
  WEIGHT_KG: {
    MIN: 30,  // Severe underweight adult
    MAX: 300, // Extreme obesity (bariatric range)
    WARN_LOW: 40,
    WARN_HIGH: 200,
  },
  WEIGHT_LB: {
    MIN: 66,
    MAX: 661,
    WARN_LOW: 88,
    WARN_HIGH: 440,
  },
  HEIGHT_CM: {
    MIN: 120,  // Severe dwarfism adult
    MAX: 250,  // Tallest recorded humans
    WARN_LOW: 140,
    WARN_HIGH: 220,
  },
  HEIGHT_FT: {
    MIN: 4,
    MAX: 8,
  },
  HEIGHT_IN: {
    MIN: 0,
    MAX: 11,
  },
  BMI: {
    MIN: 12,   // Severe starvation
    MAX: 80,   // Extreme obesity
    WARN_LOW: 15,
    WARN_HIGH: 50,
  },
};

export type ValidationWarning = {
  field: string;
  message: string;
  severity: "error" | "warning";
};

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

  // Validation warnings
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([]);

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

  // -------------------------
  // Validation Logic
  // -------------------------
  const validateInputs = useMemo(() => {
    const warnings: ValidationWarning[] = [];
    
    // Age validation
    const age = parseInt(formData.age || "0", 10);
    if (age > 0) {
      if (age < VALIDATION.AGE.MIN) {
        warnings.push({
          field: "age",
          message: `Age must be at least ${VALIDATION.AGE.MIN} years for adult health screening.`,
          severity: "error",
        });
      } else if (age > VALIDATION.AGE.MAX) {
        warnings.push({
          field: "age",
          message: `Please verify age. Value exceeds ${VALIDATION.AGE.MAX} years.`,
          severity: "error",
        });
      }
    }

    // Weight validation
    if (weightKg) {
      if (weightKg < VALIDATION.WEIGHT_KG.MIN) {
        warnings.push({
          field: "weight",
          message: `Weight seems unusually low (${weightKg.toFixed(1)} kg). Please verify your input.`,
          severity: "error",
        });
      } else if (weightKg > VALIDATION.WEIGHT_KG.MAX) {
        warnings.push({
          field: "weight",
          message: `Weight seems unusually high (${weightKg.toFixed(1)} kg). Please verify your input.`,
          severity: "error",
        });
      } else if (weightKg < VALIDATION.WEIGHT_KG.WARN_LOW) {
        warnings.push({
          field: "weight",
          message: "Low weight detected. Results may be less accurate.",
          severity: "warning",
        });
      } else if (weightKg > VALIDATION.WEIGHT_KG.WARN_HIGH) {
        warnings.push({
          field: "weight",
          message: "High weight detected. Consider verifying measurement.",
          severity: "warning",
        });
      }
    }

    // Height validation
    if (heightCm) {
      if (heightCm < VALIDATION.HEIGHT_CM.MIN) {
        warnings.push({
          field: "height",
          message: `Height seems unusually low (${heightCm.toFixed(0)} cm). Please verify your input.`,
          severity: "error",
        });
      } else if (heightCm > VALIDATION.HEIGHT_CM.MAX) {
        warnings.push({
          field: "height",
          message: `Height seems unusually high (${heightCm.toFixed(0)} cm). Please verify your input.`,
          severity: "error",
        });
      } else if (heightCm < VALIDATION.HEIGHT_CM.WARN_LOW) {
        warnings.push({
          field: "height",
          message: "Height below typical adult range. Results may need adjustment.",
          severity: "warning",
        });
      } else if (heightCm > VALIDATION.HEIGHT_CM.WARN_HIGH) {
        warnings.push({
          field: "height",
          message: "Height above typical range. Please confirm measurement.",
          severity: "warning",
        });
      }
    }

    // BMI validation (cross-field)
    const bmi = bmiValue ? parseFloat(bmiValue) : null;
    if (bmi && weightKg && heightCm) {
      if (bmi < VALIDATION.BMI.MIN) {
        warnings.push({
          field: "bmi",
          message: `BMI (${bmi}) is critically low. Please verify weight and height measurements.`,
          severity: "error",
        });
      } else if (bmi > VALIDATION.BMI.MAX) {
        warnings.push({
          field: "bmi",
          message: `BMI (${bmi}) is extremely high. Please verify weight and height measurements.`,
          severity: "error",
        });
      } else if (bmi < VALIDATION.BMI.WARN_LOW) {
        warnings.push({
          field: "bmi",
          message: "BMI indicates severe underweight. Screening may be less accurate.",
          severity: "warning",
        });
      } else if (bmi > VALIDATION.BMI.WARN_HIGH) {
        warnings.push({
          field: "bmi",
          message: "BMI indicates severe obesity. Clinical follow-up recommended.",
          severity: "warning",
        });
      }
    }

    return warnings;
  }, [formData.age, weightKg, heightCm, bmiValue]);

  // Update validation warnings when inputs change
  React.useEffect(() => {
    setValidationWarnings(validateInputs);
  }, [validateInputs]);

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
    validationWarnings,
    hasErrors: validationWarnings.some((w) => w.severity === "error"),
    hasWarnings: validationWarnings.some((w) => w.severity === "warning"),
  };
}
