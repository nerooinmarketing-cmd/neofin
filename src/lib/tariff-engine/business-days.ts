import type { HolidayCalendar } from "./holiday-calendar";

function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * `date`'ten başlayarak `days` iş günü sonrasını bulur — hafta sonu ve
 * resmî tatiller sayılmaz, otomatik olarak bir sonraki iş gününe atlanır
 * (bkz. UX §11.2: valör günü + hafta sonu + resmî tatil).
 */
export function addBusinessDays(date: Date, days: number, calendar: HolidayCalendar): Date {
  let result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result = addCalendarDays(result, 1);
    if (!calendar.isWeekend(result) && !calendar.isHoliday(result)) {
      remaining -= 1;
    }
  }
  return result;
}

/** `date` hafta sonu/tatilse bir sonraki iş gününe kaydırır, değilse aynen döner. */
export function rollToNextBusinessDay(date: Date, calendar: HolidayCalendar): Date {
  let result = new Date(date);
  while (calendar.isWeekend(result) || calendar.isHoliday(result)) {
    result = addCalendarDays(result, 1);
  }
  return result;
}

/**
 * `from` ile `to` arasında geçen iş günü sayısını döner (gecikme günü
 * hesaplamak için — bkz. UX §13: "2 iş günü gecikmiş"). `to` <= `from` ise 0.
 */
export function countBusinessDaysBetween(from: Date, to: Date, calendar: HolidayCalendar): number {
  let count = 0;
  let cursor = new Date(from);
  while (cursor.toDateString() !== to.toDateString() && cursor < to) {
    cursor = addCalendarDays(cursor, 1);
    if (!calendar.isWeekend(cursor) && !calendar.isHoliday(cursor)) {
      count += 1;
    }
  }
  return count;
}
