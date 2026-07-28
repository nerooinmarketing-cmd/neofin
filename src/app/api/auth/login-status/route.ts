import { NextResponse, type NextRequest } from "next/server";
import { getApprovalStatus } from "@/server/auth/login-approval-service";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token gerekli" }, { status: 400 });
  }

  const approval = await getApprovalStatus(token);
  if (!approval) {
    return NextResponse.json({ error: "İstek bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({ status: approval.status, expiresAt: approval.expiresAt });
}
