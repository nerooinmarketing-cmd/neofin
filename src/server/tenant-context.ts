/**
 * Every repository call is scoped by this. It will come from the Telegram
 * session (Aşama 3) — until then, callers construct it explicitly (see seed
 * script / tests). No repository method may accept a bare record id without
 * one of these alongside it.
 */
export interface TenantContext {
  companyId: string;
  companyUserId: string;
}
