import { describe, expect, it } from "vitest";
import { isRoleAllowed } from "./role-gate";

describe("isRoleAllowed", () => {
  it("allows all roles for payment-related notifications", () => {
    expect(isRoleAllowed("PAYMENT_DUE_TODAY", "ACCOUNTANT")).toBe(true);
    expect(isRoleAllowed("PAYMENT_DUE_TODAY", "OWNER")).toBe(true);
  });

  it("restricts critical setting changes to owners", () => {
    expect(isRoleAllowed("CRITICAL_SETTING_CHANGE", "OWNER")).toBe(true);
    expect(isRoleAllowed("CRITICAL_SETTING_CHANGE", "MANAGER")).toBe(false);
    expect(isRoleAllowed("CRITICAL_SETTING_CHANGE", "ACCOUNTANT")).toBe(false);
  });

  it("restricts tariff/campaign expiry notices to owners and managers", () => {
    expect(isRoleAllowed("TARIFF_EXPIRING", "ACCOUNTANT")).toBe(false);
    expect(isRoleAllowed("CAMPAIGN_EXPIRING", "MANAGER")).toBe(true);
  });
});
