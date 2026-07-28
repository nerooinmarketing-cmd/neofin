import { NextResponse, type NextRequest } from "next/server";
import { getSystemAdminContextFromRequest } from "@/server/admin/api-admin-context";
import { adminRepository } from "@/server/admin/admin-repository";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSystemAdminContextFromRequest(request);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { note?: string } | null;
  if (!body?.note || body.note.trim().length === 0) {
    return NextResponse.json({ error: "Not gerekli" }, { status: 400 });
  }

  await adminRepository.addSupportNote(id, admin.systemAdminId, body.note.trim());
  return NextResponse.json({ ok: true });
}
