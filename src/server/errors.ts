export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} bulunamadı: ${id}`);
    this.name = "NotFoundError";
  }
}

export class TariffOverlapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TariffOverlapError";
  }
}

export class DuplicatePhoneError extends Error {
  constructor() {
    super("Bu telefon numarası başka bir kullanıcı tarafından kullanılıyor.");
    this.name = "DuplicatePhoneError";
  }
}
