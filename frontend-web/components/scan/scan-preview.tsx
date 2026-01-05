"use client";

import React, { useEffect, useMemo } from "react";

type ScanPreviewProps = {
  file?: File | null;
  alt: string;
  className?: string;
};

export function ScanPreview({ file, alt, className }: ScanPreviewProps) {
  const objectUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!objectUrl) return;
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

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
