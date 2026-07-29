/**
 * Türkiye cep telefonu numaralarını tek bir kanonik biçime ("+905XXXXXXXXX")
 * indirger. `CompanyUser.phone` sistem genelinde benzersiz olduğu ve
 * GSM-ile-giriş bu alanda tam eşleşme aradığı için, aynı numaranın "0555...",
 * "555...", "+90 555 ..." gibi farklı yazımları aynı kayda düşmelidir.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  let national: string;
  if (digits.startsWith("90") && digits.length === 12) {
    national = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    national = digits.slice(1);
  } else {
    national = digits;
  }

  return `+90${national}`;
}

/** Kanonik biçimin geçerli bir TR cep telefonu (+905XXXXXXXXX, 13 karakter) olup olmadığını kontrol eder. */
export function isValidTurkishMobile(raw: string): boolean {
  return /^\+905\d{9}$/.test(normalizePhone(raw));
}
