/**
 * Resmî tatil takvimi bir servis arayüzü olarak soyutlanır (bkz. Aşama 6:
 * "Resmî tatil takvimini servis arayüzüyle soyutla"). Hesaplama motoru bu
 * arayüze bağımlıdır, somut bir uygulamaya değil — testlerde sahte bir
 * takvim enjekte edilebilir, production'da gerçek/güncel bir veri
 * kaynağıyla değiştirilebilir.
 */
export interface HolidayCalendar {
  isHoliday(date: Date): boolean;
  isWeekend(date: Date): boolean;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * Sabit tarihli resmî tatiller (her yıl aynı gün). Dinî bayramlar (Ramazan/
 * Kurban Bayramı) hicri takvime göre yıldan yıla kaydığı ve burada yanlış
 * bir tarih vermek finansal hesaplamayı bozacağı için dahil edilmemiştir —
 * production'a çıkmadan önce güvenilir bir kaynaktan eklenmelidir.
 */
const FIXED_HOLIDAYS_MONTH_DAY: Array<[month: number, day: number]> = [
  [1, 1], // Yılbaşı
  [4, 23], // Ulusal Egemenlik ve Çocuk Bayramı
  [5, 1], // Emek ve Dayanışma Günü
  [5, 19], // Atatürk'ü Anma, Gençlik ve Spor Bayramı
  [7, 15], // Demokrasi ve Millî Birlik Günü
  [8, 30], // Zafer Bayramı
  [10, 29], // Cumhuriyet Bayramı
];

export class StaticTurkishHolidayCalendar implements HolidayCalendar {
  private readonly extraHolidays: Set<string>;

  /** `extraHolidayDates`: dinî bayramlar gibi yıldan yıla değişen tarihler için. */
  constructor(extraHolidayDates: Date[] = []) {
    this.extraHolidays = new Set(extraHolidayDates.map(toDateKey));
  }

  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Pazar / Cumartesi
  }

  isHoliday(date: Date): boolean {
    const isFixedHoliday = FIXED_HOLIDAYS_MONTH_DAY.some(
      ([month, day]) => date.getMonth() + 1 === month && date.getDate() === day,
    );
    return isFixedHoliday || this.extraHolidays.has(toDateKey(date));
  }
}
