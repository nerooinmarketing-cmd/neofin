import type { NextRequest } from "next/server";
import { resolveTenantContextFromToken } from "@/server/auth/session-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/cookie";
import type { TenantContext } from "@/server/tenant-context";

/** Route Handler'lar için: Server Component'lerdeki `redirect()` yerine null döner. */
export async function getTenantContextFromRequest(
  request: NextRequest,
): Promise<TenantContext | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return resolveTenantContextFromToken(token);
}
