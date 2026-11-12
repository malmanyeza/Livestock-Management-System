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
        const dayNames = sortedDays.map((d) => DAY_NAMES_SHORT[d]).filter(Boolean);
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

