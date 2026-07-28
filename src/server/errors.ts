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
