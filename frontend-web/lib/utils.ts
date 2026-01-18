import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function calculateBMI(weight_kg: number, height_cm: number): number {
  const height_m = height_cm / 100;
  return Number((weight_kg / height_m ** 2).toFixed(2));
}
