export function currentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/** Pazartesi başlangıçlı bu haftanın aralığı. */
export function currentWeekRange(now = new Date()) {
  const day = now.getDay(); // 0=Pazar..6=Cumartesi
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset));
  const end = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
  return { start, end };
}

/** Son 12 ay (bugün dahil, tam ay değil — yıllık rapor için). */
export function trailing12MonthsRange(now = new Date()) {
  const start = startOfDay(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 1));
  const end = endOfDay(now);
  return { start, end };
}
