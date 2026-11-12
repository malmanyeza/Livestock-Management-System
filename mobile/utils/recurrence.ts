import {
  parseISO,
  startOfDay,
  isBefore,
  isAfter,
  isSameDay,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  getDay,
  getDaysInMonth,
  eachDayOfInterval,
  format,
} from 'date-fns';

export type RepeatFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type CustomRepeatUnit = 'day' | 'week' | 'month' | 'year';

export interface RecurrenceRule {
  frequency: RepeatFrequency;
  interval?: number;
  unit?: CustomRepeatUnit;
  daysOfWeek?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  endDate?: string; // YYYY-MM-DD
}

export const DEFAULT_RECURRENCE: RecurrenceRule = {
  frequency: 'none',
};

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Checks whether an item starting on `startDateStr` with `repeat` occurs on `targetDate`.
 */
export function doesOccurOnDate(
  startDateStr: string,
  repeat: RecurrenceRule | null | undefined,
  targetDate: Date
): boolean {
  if (!startDateStr) return false;

  let startDate: Date;
  try {
    startDate = startOfDay(parseISO(startDateStr));
    if (isNaN(startDate.getTime())) return false;
  } catch {
    return false;
  }

  const target = startOfDay(targetDate);

  if (isBefore(target, startDate)) return false;
  if (isSameDay(target, startDate)) return true;

  if (!repeat || repeat.frequency === 'none') return false;

  if (repeat.endDate) {
    try {
      const end = startOfDay(parseISO(repeat.endDate));
      if (!isNaN(end.getTime()) && isAfter(target, end)) return false;
    } catch {
      // Ignore invalid endDate
    }
  }

  let unit: CustomRepeatUnit = 'day';
  let interval = 1;

  switch (repeat.frequency) {
    case 'daily':
      unit = 'day';
      interval = 1;
      break;
    case 'weekly':
      unit = 'week';
      interval = 1;
      break;
    case 'monthly':
      unit = 'month';
      interval = 1;
      break;
    case 'yearly':
      unit = 'year';
      interval = 1;
      break;
    case 'custom':
      unit = repeat.unit || 'day';
      interval = Math.max(1, repeat.interval || 1);
      break;
  }

  switch (unit) {
    case 'day': {
      const daysDiff = differenceInCalendarDays(target, startDate);
      return daysDiff >= 0 && daysDiff % interval === 0;
    }
    case 'week': {
      const weeksDiff = differenceInCalendarWeeks(target, startDate, { weekStartsOn: 1 });
      if (weeksDiff < 0 || weeksDiff % interval !== 0) return false;
      if (repeat.daysOfWeek && repeat.daysOfWeek.length > 0) {
        return repeat.daysOfWeek.includes(getDay(target));
      }
      return getDay(target) === getDay(startDate);
    }
    case 'month': {
      const monthsDiff =
        (target.getFullYear() - startDate.getFullYear()) * 12 +
        (target.getMonth() - startDate.getMonth());
      if (monthsDiff < 0 || monthsDiff % interval !== 0) return false;
      const targetDaysInMonth = getDaysInMonth(target);
      const expectedDay = Math.min(startDate.getDate(), targetDaysInMonth);
      return target.getDate() === expectedDay;
    }
    case 'year': {
      const yearsDiff = target.getFullYear() - startDate.getFullYear();
      if (yearsDiff < 0 || yearsDiff % interval !== 0) return false;
      if (target.getMonth() !== startDate.getMonth()) return false;
      const targetDaysInMonth = getDaysInMonth(target);
      const expectedDay = Math.min(startDate.getDate(), targetDaysInMonth);
      return target.getDate() === expectedDay;
    }
    default:
      return false;
  }
}

/**
 * Returns all YYYY-MM-DD occurrence strings for an item within [rangeStart, rangeEnd].
 */
export function getOccurrencesInRange(
  startDateStr: string,
  repeat: RecurrenceRule | null | undefined,
  rangeStart: Date,
  rangeEnd: Date
): string[] {
  if (!startDateStr) return [];

  let startDate: Date;
  try {
    startDate = startOfDay(parseISO(startDateStr));
    if (isNaN(startDate.getTime())) return [];
  } catch {
    return [];
  }

  const start = startOfDay(rangeStart);
  const end = startOfDay(rangeEnd);

  if (!repeat || repeat.frequency === 'none') {
    if (!isBefore(startDate, start) && !isAfter(startDate, end)) {
      return [format(startDate, 'yyyy-MM-dd')];
    }
    return [];
  }

  const effectiveStart = isAfter(startDate, start) ? startDate : start;
  let effectiveEnd = end;

  if (repeat.endDate) {
    try {
      const ruleEnd = startOfDay(parseISO(repeat.endDate));
      if (!isNaN(ruleEnd.getTime()) && isBefore(ruleEnd, effectiveEnd)) {
        effectiveEnd = ruleEnd;
      }
    } catch {
      // Ignore invalid endDate
    }
  }

  if (isAfter(effectiveStart, effectiveEnd)) return [];

  const days = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
  const results: string[] = [];
  for (const day of days) {
    if (doesOccurOnDate(startDateStr, repeat, day)) {
      results.push(format(day, 'yyyy-MM-dd'));
    }
  }
  return results;
}

/**
 * Formats a human-readable label for a RecurrenceRule.
 */
export function formatRecurrenceLabel(repeat?: RecurrenceRule | null): string {
  if (!repeat || repeat.frequency === 'none') {
    return 'Does not repeat';
  }

  switch (repeat.frequency) {
    case 'daily':
      return 'Every day';
    case 'weekly':
      return 'Every week';
    case 'monthly':
      return 'Every month';
    case 'yearly':
      return 'Every year';
    case 'custom': {
      const interval = Math.max(1, repeat.interval || 1);
      const unit = repeat.unit || 'day';
      const unitLabel = interval === 1 ? unit : `${unit}s`;
      let base = interval === 1 ? `Every ${unit}` : `Every ${interval} ${unitLabel}`;

      if (unit === 'week' && repeat.daysOfWeek && repeat.daysOfWeek.length > 0) {
        const sortedDays = [...repeat.daysOfWeek].sort((a, b) => a - b);
        const dayNames = sortedDays.map(d => DAY_NAMES_SHORT[d]).filter(Boolean);
        if (dayNames.length > 0) {
          base += ` (${dayNames.join(', ')})`;
        }
      }

      if (repeat.endDate) {
        base += ` until ${repeat.endDate}`;
      }
      return base;
    }
    default:
      return 'Does not repeat';
  }
}

