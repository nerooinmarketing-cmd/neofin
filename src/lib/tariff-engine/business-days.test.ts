import { describe, expect, it } from "vitest";
import { addBusinessDays, rollToNextBusinessDay } from "./business-days";
import { StaticTurkishHolidayCalendar } from "./holiday-calendar";

const calendar = new StaticTurkishHolidayCalendar();

describe("addBusinessDays", () => {
  it("adds a plain business day when there is no weekend/holiday in between", () => {
    // 2026-08-12 Çarşamba -> +1 iş günü -> 2026-08-13 Perşembe
    const result = addBusinessDays(new Date(2026, 7, 12), 1, calendar);
    expect(result.toDateString()).toBe(new Date(2026, 7, 13).toDateString());
  });

  it("skips the weekend", () => {
    // 2026-08-14 Cuma -> +1 iş günü -> hafta sonu atlanır -> 2026-08-17 Pazartesi
    const result = addBusinessDays(new Date(2026, 7, 14), 1, calendar);
    expect(result.toDateString()).toBe(new Date(2026, 7, 17).toDateString());
  });

  it("skips a fixed national holiday that does not fall on a weekend", () => {
    // 2026-05-19 Salı, Atatürk'ü Anma Gençlik ve Spor Bayramı (hafta içi tatil).
    // 2026-05-18 Pazartesi'den +1 iş günü -> 19'u atla -> 2026-05-20 Çarşamba
    const result = addBusinessDays(new Date(2026, 4, 18), 1, calendar);
    expect(result.toDateString()).toBe(new Date(2026, 4, 20).toDateString());
  });

  it("returns the same date for 0 days", () => {
    const start = new Date(2026, 7, 12);
    const result = addBusinessDays(start, 0, calendar);
    expect(result.toDateString()).toBe(start.toDateString());
  });

  it("accumulates multiple business days across a weekend", () => {
    // 2026-08-12 Çarşamba -> +3 iş günü -> Per,Cuma,(hafta sonu atla),Pzt -> 2026-08-17 Pazartesi
    const result = addBusinessDays(new Date(2026, 7, 12), 3, calendar);
    expect(result.toDateString()).toBe(new Date(2026, 7, 17).toDateString());
  });
});

describe("rollToNextBusinessDay", () => {
  it("keeps a business day unchanged", () => {
    const date = new Date(2026, 7, 12);
    expect(rollToNextBusinessDay(date, calendar).toDateString()).toBe(date.toDateString());
  });

  it("rolls a Saturday forward to Monday", () => {
    const saturday = new Date(2026, 7, 15);
    const result = rollToNextBusinessDay(saturday, calendar);
    expect(result.toDateString()).toBe(new Date(2026, 7, 17).toDateString());
  });
});
