import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/** Resolve vendor logo URL: use as-is if absolute, else prepend API origin. */
export function getVendorLogoUrl(logoUrl: string | null | undefined): string | null {
  if (!logoUrl || typeof logoUrl !== "string") return null;
  if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) return logoUrl;
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "") || (typeof window !== "undefined" ? window.location.origin : "");
  const path = logoUrl.startsWith("/") ? logoUrl : `/${logoUrl}`;
  return base ? `${base.replace(/\/$/, "")}${path}` : null;
}