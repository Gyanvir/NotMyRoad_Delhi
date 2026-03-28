import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatReportId(id: number) {
  return `NMR-${id.toString().padStart(5, '0')}`;
}
