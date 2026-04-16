import { format, type FormatOptions } from 'date-fns';

export const safeDate = (value: unknown, fallback = new Date(0)) => {
  const date = value instanceof Date ? value : new Date(value as any);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

export const safeFormatDate = (
  value: unknown,
  pattern: string,
  options?: FormatOptions
) => {
  try {
    return format(safeDate(value), pattern, options);
  } catch {
    return '-';
  }
};