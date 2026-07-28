import type { NextRequest } from "next/server";
import {
  resolveSystemAdminContextFromToken,
  ADMIN_SESSION_COOKIE_NAME,
  type SystemAdminContext,
} from "@/server/admin/admin-session-service";

/** Route Handler'lar için: Server Component'lerdeki `redirect()` yerine null döner. */
export async function getSystemAdminContextFromRequest(
  request: NextRequest,
): Promise<SystemAdminContext | null> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  return resolveSystemAdminContextFromToken(token);
}
