"use client";

import { useState, useCallback } from "react";

interface UseNumericKeypadProps {
  onValueChange: (value: string) => void;
  allowDecimal?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  realTimeUpdate?: boolean; // Update parent in real-time as user types
}

export function useNumericKeypad({
  onValueChange,
  allowDecimal = false,
  maxLength = 10,
  min,
  max,
  realTimeUpdate = true, // Real-time updates for immediate form feedback
}: UseNumericKeypadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");
  const [activeField, setActiveField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback((fieldId: string, initialValue: string = "") => {
    setActiveField(fieldId);
    setValue(initialValue);
    setError(null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveField(null);
    setError(null);
  }, []);

  const handleKeyPress = useCallback(
    (key: string) => {
      setError(null); // Clear error on typing
      if (key === "." && !allowDecimal) return;
      if (key === "." && value.includes(".")) return;
      if (value.length >= maxLength) return;

      // Prevent multiple leading zeros unless decimal
      if (value === "0" && key !== ".") {
        const newValue = key;
        setValue(newValue);
        if (realTimeUpdate) {
          onValueChange(newValue);
        }
        return;
      }

      const newValue = value + key;
      setValue(newValue);

      // Real-time update to parent component
      if (realTimeUpdate) {
        onValueChange(newValue);
      }
    },
    [value, allowDecimal, maxLength, realTimeUpdate, onValueChange]
  );

  const handleBackspace = useCallback(() => {
    setError(null);
    const newValue = value.slice(0, -1);
    setValue(newValue);

    // Real-time update to parent component
    if (realTimeUpdate) {
      onValueChange(newValue);
    }
  }, [value, realTimeUpdate, onValueChange]);

  const handleDone = useCallback(() => {
    // Validate before closing
    if (value) {
      const numVal = parseFloat(value);

      if (!isNaN(numVal)) {
        if (min !== undefined && numVal < min) {
          setError(`Minimum value: ${min}`);
          return false;
        }

        if (max !== undefined && numVal > max) {
          setError(`Maximum value: ${max}`);
          return false;
        }
      }
    }

    // Always close after done is clicked
    if (!realTimeUpdate) {
      onValueChange(value);
    }
    close();
    return true;
  }, [value, onValueChange, close, min, max, realTimeUpdate]);

  const handleClear = useCallback(() => {
    setValue("");
    setError(null);
    if (realTimeUpdate) {
      onValueChange("");
    }
  }, [realTimeUpdate, onValueChange]);

  return {
    isOpen,
    value,
    activeField,
    error,
    open,
    close,
    handleClear,
    handleKeyPress,
    handleBackspace,
    handleDone,
  };
}
