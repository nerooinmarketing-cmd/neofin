/**
 * Sessiz saatler kontrolü — `quietHoursStart`/`quietHoursEnd` gece yarısını
 * kapsayabilir (ör. 22 → 6). İkisinden biri boşsa veya eşitse kısıtlama yok
 * sayılır.
 */
export function isWithinQuietHours(
  hour: number,
  quietHoursStart: number | null,
  quietHoursEnd: number | null,
): boolean {
  if (quietHoursStart === null || quietHoursEnd === null) return false;
  if (quietHoursStart === quietHoursEnd) return false;

  if (quietHoursStart < quietHoursEnd) {
    return hour >= quietHoursStart && hour < quietHoursEnd;
  }
  return hour >= quietHoursStart || hour < quietHoursEnd;
}
