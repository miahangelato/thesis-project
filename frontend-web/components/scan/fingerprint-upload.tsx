"use client";
import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";

type FingerprintUploadProps = {
  disabled?: boolean;
  label: string;
  onFileSelected: (file: File) => void;
};

export function FingerprintUpload({
  disabled = false,
  label,
  onFileSelected,
}: FingerprintUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onFileSelected(file);
          e.target.value = "";
        }}
      />

      <Button
        type="button"
        variant="outline"
        className="h-11 px-4 font-semibold cursor-pointer"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Upload {label}
      </Button>

      <p className="text-xs text-gray-500 font-semibold text-center">
        Use this if the scanner is unavailable.
      </p>
    </div>
  );
}
