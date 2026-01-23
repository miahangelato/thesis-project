"use client";
import { useEffect, useMemo, useState } from "react";
import { Delete, Check } from "lucide-react";

type UnitMode = "none" | "weight" | "height";
type WeightUnit = "kg" | "lb";
type HeightUnit = "cm" | "ftin";

interface NumericKeypadProps {
  isOpen?: boolean;
  value?: string;
  error?: string | null;

  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onDone: (normalizedValue: string) => void;
  onClose?: () => void;
  onClear?: () => void;

  allowDecimal?: boolean;
  variant?: "modal" | "inline";
  title?: string;
  placeholder?: string;

  unitMode?: UnitMode;
  initialUnit?: WeightUnit | HeightUnit;
  ftValue?: string;
  inValue?: string;
  onFtInChange?: (ft: string, inch: string) => void;
}

export function NumericKeypad({
  isOpen = true,
  value = "",
  error = null,
  onKeyPress,
  onBackspace,
  onDone,
  onClose,
  onClear,
  allowDecimal = false,
  variant = "modal",
  title = "Numeric Keypad",
  placeholder = "Enter value...",
  unitMode = "none",
  initialUnit,
  ftValue,
  inValue,
  onFtInChange,
}: NumericKeypadProps) {
  const defaultUnit = useMemo(() => {
    if (unitMode === "weight") return (initialUnit as WeightUnit) ?? "kg";
    if (unitMode === "height") return (initialUnit as HeightUnit) ?? "cm";
    return "kg";
  }, [unitMode, initialUnit]);

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    unitMode === "weight" ? (defaultUnit as WeightUnit) : "kg"
  );

  const [heightUnit, setHeightUnit] = useState<HeightUnit>(
    unitMode === "height" ? (defaultUnit as HeightUnit) : "cm"
  );

  const [ftLocal, setFtLocal] = useState("");
  const [inLocal, setInLocal] = useState("");

  const [activePart, setActivePart] = useState<"ft" | "in">("ft");

  const ft = ftValue ?? ftLocal;
  const inch = inValue ?? inLocal;

  const setFt = (v: string) => {
    if (onFtInChange) onFtInChange(v, inch);
    else setFtLocal(v);
  };

  const setInch = (v: string) => {
    if (onFtInChange) onFtInChange(ft, v);
    else setInLocal(v);
  };

  const isFtIn = unitMode === "height" && heightUnit === "ftin";

  const displayValue = useMemo(() => {
    if (isFtIn) {
      const f = ft || "0";
      const i = inch || "0";
      return `${f}&apos; ${i}&quot;`;
    }
    return value || "";
  }, [isFtIn, ft, inch, value]);

  const canUseDecimal = useMemo(() => {
    if (isFtIn) return false;
    return allowDecimal;
  }, [allowDecimal, isFtIn]);

  useEffect(() => {
    if (variant === "modal" && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, variant]);

  if (!isOpen) return null;

  const handleKey = (k: string) => {
    if (isFtIn) {
      if (!/^\d$/.test(k)) return;

      if (activePart === "ft") {
        setFt((ft + k).slice(0, 2));
      } else {
        setInch((inch + k).slice(0, 2));
      }
      return;
    }

    onKeyPress(k);
  };

  const handleBack = () => {
    if (isFtIn) {
      if (activePart === "ft") setFt(ft.slice(0, -1));
      else setInch(inch.slice(0, -1));
      return;
    }
    onBackspace();
  };

  const handleClear = () => {
    if (isFtIn) {
      setFt("");
      setInch("");
      setActivePart("ft");
      return;
    }

    onClear?.();
  };

  const showClear =
    (isFtIn && (ft.length > 0 || inch.length > 0)) || (!isFtIn && !!displayValue);

  const toNumber = (s: string) => {
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const normalizeAndDone = () => {
    if (unitMode === "weight") {
      const n = toNumber(value || "0");
      if (n === null) return;

      const kg = weightUnit === "lb" ? n * 0.45359237 : n;

      onDone(kg.toFixed(1));
      return;
    }

    if (unitMode === "height") {
      if (heightUnit === "cm") {
        const n = toNumber(value || "0");
        if (n === null) return;

        onDone(String(Math.round(n)));
        return;
      }

      const f = parseInt(ft || "0", 10);
      const i = parseInt(inch || "0", 10);
      const totalIn = f * 12 + i;
      const cm = totalIn * 2.54;

      onDone(String(Math.round(cm)));
      return;
    }

    onDone(value);
  };

  const KeypadContent = (
    <div
      className={`
        ${
          variant === "modal"
            ? "bg-white border-t-4 border-teal-500 shadow-2xl fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300"
            : "bg-linear-to-br from-white via-slate-50/30 to-white rounded-2xl shadow-lg border-2 border-slate-200 h-full flex flex-col overflow-hidden select-none"
        }
      `}
    >
      <div
        className={`
          flex items-center justify-between px-6 py-4 border-b border-slate-200
          ${variant === "modal" ? "bg-white" : "bg-slate-50/50"}
        `}
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-slate-700">{title}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-medium transition-colors px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      <div className="px-6 pt-3">
        <div className="h-12 rounded-xl border-2 border-slate-200 bg-white flex items-center justify-between px-4">
          <span className="text-xl font-bold text-slate-800">
            {isFtIn ? (
              <>
                <span
                  className={`px-1 rounded transition ${
                    activePart === "ft"
                      ? "bg-teal-100 text-teal-700 underline underline-offset-4"
                      : "text-slate-800"
                  }`}
                >
                  {ft || "0"}&apos;
                </span>
                <span
                  className={`px-1 rounded transition ${
                    activePart === "in"
                      ? "bg-teal-100 text-teal-700 underline underline-offset-4"
                      : "text-slate-800"
                  }`}
                >
                  {inch || "0"}&quot;
                </span>
              </>
            ) : (
              <span className={displayValue ? "text-slate-800" : "text-slate-300"}>
                {displayValue || placeholder}
              </span>
            )}
          </span>

          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-700 text-sm font-semibold cursor-pointer"
              title="Clear"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {unitMode === "weight" && (
        <div className="px-6 pt-2">
          <div className="inline-flex rounded-xl border-2 border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setWeightUnit("kg")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                weightUnit === "kg"
                  ? "bg-teal-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              kg
            </button>
            <button
              type="button"
              onClick={() => setWeightUnit("lb")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                weightUnit === "lb"
                  ? "bg-teal-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              lbs
            </button>
          </div>
        </div>
      )}

      {unitMode === "height" && (
        <div className="px-6 pt-2 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border-2 border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setHeightUnit("cm")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                heightUnit === "cm"
                  ? "bg-teal-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              cm
            </button>
            <button
              type="button"
              onClick={() => setHeightUnit("ftin")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                heightUnit === "ftin"
                  ? "bg-teal-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              ft / in
            </button>
          </div>

          {heightUnit === "ftin" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActivePart("ft")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition cursor-pointer ${
                  activePart === "ft"
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                ft
              </button>
              <button
                type="button"
                onClick={() => setActivePart("in")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition cursor-pointer ${
                  activePart === "in"
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                in
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="px-6 pt-3 pb-2 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="text-xs font-semibold text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="px-6 pb-5 pt-3 flex-1 flex flex-col justify-center gap-3">
        <div className="grid grid-cols-5 gap-3">
          {["1", "2", "3", "4", "5"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKey(num)}
              className="
                text-2xl font-bold text-slate-700
                bg-white hover:bg-teal-50 active:bg-teal-100
                rounded-xl
                border-2 border-slate-200 hover:border-teal-400 active:border-teal-500
                transition-all duration-150 active:scale-95
                h-16
                focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-1
                shadow-sm hover:shadow-md cursor-pointer
              "
            >
              {num}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-3">
          {["6", "7", "8", "9", "0"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKey(num)}
              className="
                text-2xl font-bold text-slate-700
                bg-white hover:bg-teal-50 active:bg-teal-100
                rounded-xl
                border-2 border-slate-200 hover:border-teal-400 active:border-teal-500
                transition-all duration-150 active:scale-95
                h-16
                focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-1
                shadow-sm hover:shadow-md cursor-pointer
              "
            >
              {num}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-2">
          {canUseDecimal ? (
            <button
              type="button"
              onClick={() => handleKey(".")}
              className="
                bg-white hover:bg-amber-50 active:bg-amber-100
                text-slate-700 font-bold text-2xl
                rounded-xl
                border-2 border-amber-200 hover:border-amber-400 active:border-amber-500
                transition-all duration-150 active:scale-95
                h-14
                focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1
                shadow-sm hover:shadow-md cursor-pointer
              "
            >
              •
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleBack}
            className="
              bg-slate-100 hover:bg-red-100 active:bg-red-200
              text-slate-600 hover:text-red-600
              rounded-xl
              border-2 border-slate-200 hover:border-red-300 active:border-red-400
              transition-all duration-150 active:scale-95
              h-14
              flex items-center justify-center
              focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1
              shadow-sm hover:shadow-md cursor-pointer
            "
          >
            <Delete className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={normalizeAndDone}
            className="
              bg-teal-500 hover:bg-teal-600 active:bg-teal-700
              text-white
              rounded-xl
              transition-all duration-150 active:scale-95
              h-14
              flex items-center justify-center
              font-bold text-lg
              focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2
              shadow-md hover:shadow-lg cursor-pointer
            "
          >
            <Check className="h-6 w-6" />
          </button>
        </div>

        {(unitMode === "weight" || unitMode === "height") && (
          <p className="text-xl text-slate-400 pt-1 text-center">
            Saved as{" "}
            <span className="font-semibold text-slate-500">
              {unitMode === "weight" ? "kg" : "cm"}
            </span>
          </p>
        )}
      </div>

      {variant === "modal" && (
        <div className="h-2 bg-linear-to-r from-teal-500 to-cyan-500" />
      )}
    </div>
  );

  if (variant === "inline") return KeypadContent;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      {KeypadContent}
    </>
  );
}
