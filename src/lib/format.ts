const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Sunucu/istemci farklı saat dilimlerinde çalışsa bile (ör. sunucu UTC,
// kullanıcı Türkiye'de) tarih hep Türkiye takvim gününü göstersin.
const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

/** Formats an amount as Turkish lira, e.g. 33.742,50 TL */
export function formatCurrency(amount: number): string {
  return `${currencyFormatter.format(amount)} TL`;
}

/** Formats a date as GG.AA.YYYY, e.g. 12.08.2026 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return dateFormatter.format(d);
}
