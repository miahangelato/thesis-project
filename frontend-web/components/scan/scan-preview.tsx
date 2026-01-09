"use client";

import React, { useEffect, useState } from "react";

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
    // next/image can break on blob: object URLs; use img for local previews.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={objectUrl}
      alt={alt}
      className={`absolute inset-0 h-full w-full ${
        className ?? "object-cover"
      }`}
      draggable={false}
    />
  );
}
