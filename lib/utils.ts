import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a price as a currency string
 */
export function formatPrice(price: number | null | undefined, currency = 'USD'): string {
  if (price === null || price === undefined) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
}

/**
 * Formats a date to a readable string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Adds delay for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gets a color for a Pokemon type
 */
export function getTypeClass(type: string): string {
  const typeClasses: Record<string, string> = {
    Colorless: "bg-gray-400 text-white",
    Darkness: "bg-purple-900 text-white",
    Dragon: "bg-indigo-600 text-white",
    Fairy: "bg-pink-400 text-white",
    Fighting: "bg-orange-700 text-white",
    Fire: "bg-red-600 text-white",
    Grass: "bg-green-600 text-white",
    Lightning: "bg-yellow-500 text-black",
    Metal: "bg-gray-400 text-black",
    Psychic: "bg-purple-600 text-white",
    Water: "bg-blue-500 text-white",
  };
  
  return typeClasses[type] || "bg-gray-200 text-gray-800";
}