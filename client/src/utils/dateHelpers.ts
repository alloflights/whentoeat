export interface DayColumn {
  dateStr: string; // YYYY-MM-DD
  monthDay: string; // MM/DD
  dayOfWeek: string; // 今天 / 明天 / 周六 / 周日
  weekday: number; // 0 (周日) - 6 (周六)
  isWeekend: boolean;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function getUpcomingDays(count = 10): DayColumn[] {
  const days: DayColumn[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${date}`;
    const monthDay = `${month}/${date}`;

    let dayOfWeek = WEEKDAYS[d.getDay()];
    if (i === 0) dayOfWeek = '今天';
    else if (i === 1) dayOfWeek = '明天';

    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    days.push({
      dateStr,
      monthDay,
      dayOfWeek,
      weekday: d.getDay(),
      isWeekend,
    });
  }

  return days;
}

export function formatDateWithWeekday(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const weekday = WEEKDAYS[dateObj.getDay()];
    return `${m}月${d}日 (${weekday})`;
  } catch {
    return dateStr;
  }
}
