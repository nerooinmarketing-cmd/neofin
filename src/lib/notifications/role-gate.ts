import type { NotificationContext } from "./types";

export type CompanyRole = "OWNER" | "MANAGER" | "ACCOUNTANT";

export type NotificationTypeName = NotificationContext["type"];

/** `null` = tüm roller alır. Kullanıcı bazlı yetki bu sabit eşlemeyle uygulanır. */
const ROLE_GATE: Record<NotificationTypeName, CompanyRole[] | null> = {
  PAYMENT_DUE_TOMORROW: null,
  PAYMENT_DUE_TODAY: null,
  PAYMENT_DELAYED: null,
  PAYMENT_BELOW_EXPECTED: null,
  TARIFF_EXPIRING: ["OWNER", "MANAGER"],
  CAMPAIGN_EXPIRING: ["OWNER", "MANAGER"],
  VOLUME_COMMITMENT_RISK: ["OWNER", "MANAGER"],
  MONTHLY_REPORT_READY: ["OWNER", "MANAGER", "ACCOUNTANT"],
  NEW_DEVICE_LOGIN: null,
  CRITICAL_SETTING_CHANGE: ["OWNER"],
  MISSING_DATA_WARNING: ["OWNER", "MANAGER"],
};

export function rolesAllowedFor(type: NotificationTypeName): CompanyRole[] | null {
  return ROLE_GATE[type];
}

export function isRoleAllowed(type: NotificationTypeName, role: CompanyRole): boolean {
  const allowed = rolesAllowedFor(type);
  return allowed === null || allowed.includes(role);
}
