"use client";
import { useEffect, useState } from "react";

type ScanPreviewProps = {
  file?: File | null;
  alt: string;
  className?: string;
};

export function ScanPreview({ file, alt, className }: ScanPreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!objectUrl) return null;

  return (
    <img
      src={objectUrl}
      alt={alt}
      className={`absolute inset-0 h-full w-full ${className ?? "object-cover"}`}
      draggable={false}
    />
  );
}
