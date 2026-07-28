import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { contractRepository } from "@/server/repositories/contract-repository";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const contract = await contractRepository.getByIdOrThrow(ctx, id);
  return NextResponse.json({ status: contract.status, hasAnalysis: Boolean(contract.analysis) });
}
