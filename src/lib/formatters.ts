import { parseLocalDate } from '../domain/trips';

const shortDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'long',
  day: 'numeric',
});

const weekdayFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
});

export function formatShortDate(value: string): string {
  return shortDateFormatter.format(parseLocalDate(value));
}

export function formatDayDate(value: string): string {
  return weekdayFormatter.format(parseLocalDate(value));
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (start.getFullYear() === end.getFullYear()) {
    return `${start.getFullYear()}年${formatShortDate(startDate)} — ${formatShortDate(endDate)}`;
  }

  return `${start.getFullYear()}年${formatShortDate(startDate)} — ${end.getFullYear()}年${formatShortDate(endDate)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0
    ? `${hours} 小时`
    : `${hours} 小时 ${remainingMinutes} 分钟`;
}

