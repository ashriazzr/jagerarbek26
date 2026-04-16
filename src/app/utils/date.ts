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

export const formatDurationMinutes = (totalMinutes: number) => {
  const normalizedMinutes = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;

  if (hours === 0) {
    return `${minutes} menit`;
  }

  if (minutes === 0) {
    return `${hours} jam`;
  }

  return `${hours} jam ${minutes} menit`;
};