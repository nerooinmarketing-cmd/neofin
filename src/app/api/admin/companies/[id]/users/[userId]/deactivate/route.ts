import { NextResponse, type NextRequest } from "next/server";
import { getSystemAdminContextFromRequest } from "@/server/admin/api-admin-context";
import { adminRepository } from "@/server/admin/admin-repository";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const admin = await getSystemAdminContextFromRequest(request);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { userId } = await params;
  await adminRepository.deactivateCompanyUser(userId);
  return NextResponse.json({ ok: true });
}
