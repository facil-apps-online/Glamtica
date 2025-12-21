import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void;
}

export function formatCurrency(amount: number | undefined | null, currencyCode: string = 'COP', locale: string = 'es-CO'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateNextGenerationDate(
  startDate: Date,
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'yearly',
  recurrenceInterval: number
): Date {
  let nextDate = new Date(startDate); // Create a new Date object to avoid modifying the original

  switch (recurrenceType) {
    case 'daily':
      nextDate = addDays(nextDate, recurrenceInterval);
      break;
    case 'weekly':
      nextDate = addWeeks(nextDate, recurrenceInterval);
      break;
    case 'monthly':
      nextDate = addMonths(nextDate, recurrenceInterval);
      break;
    case 'yearly':
      nextDate = addYears(nextDate, recurrenceInterval);
      break;
    default:
      throw new Error(`Invalid recurrenceType: ${recurrenceType}`);
  }
  return nextDate;
}