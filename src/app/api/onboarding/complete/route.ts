import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import {
  completeOnboarding,
  OnboardingIncompleteError,
} from "@/server/onboarding/onboarding-service";

export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    await completeOnboarding(ctx);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OnboardingIncompleteError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
