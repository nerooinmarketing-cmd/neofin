import type { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return "unknown";
}

export function getDeviceInfo(request: NextRequest): string {
  return request.headers.get("user-agent")?.slice(0, 200) ?? "bilinmeyen cihaz";
}
