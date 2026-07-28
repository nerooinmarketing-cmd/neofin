import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { answerFinanceQuestion } from "@/server/finance-assistant/finance-assistant-service";

export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { question?: string } | null;
  if (!body?.question || body.question.trim().length === 0) {
    return NextResponse.json({ error: "Soru gerekli" }, { status: 400 });
  }

  const answer = await answerFinanceQuestion(ctx, body.question.trim());
  return NextResponse.json({ ok: true, answer });
}
