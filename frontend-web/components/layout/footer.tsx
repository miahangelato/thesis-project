"use client";
import { ReactNode } from "react";

interface FooterProps {
  className?: string;
  showAllLinks?: boolean;
  fixed?: boolean;
  transparent?: boolean;
  customContent?: ReactNode;
}

export function Footer({
  className = "",
  showAllLinks: _showAllLinks = false,
  fixed = true,
  transparent = false,
  customContent,
}: FooterProps) {
  const bgClass = transparent ? "bg-transparent" : "bg-white";
  const borderClass = transparent ? "border-teal-100/30" : "border-gray-100";

  return (
    <footer
      className={`w-full px-28 py-2 flex justify-between items-center select-none ${borderClass} ${bgClass} ${
        fixed ? "absolute bottom-0 left-0 right-0 z-10" : ""
      } ${className}`}
    >
      <div className="text-xs text-gray-500">© 2025 Team 3. All rights reserved.</div>

      {customContent && (
        <div className="flex items-center text-xs text-gray-500">{customContent}</div>
      )}
    </footer>
  );
}
