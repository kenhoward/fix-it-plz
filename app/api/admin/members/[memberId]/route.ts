import { verifyAdminSession } from "@/lib/auth/admin-session";
import { adminDb } from "@/lib/firebase/admin";

// PATCH /api/admin/members/:memberId — edit a family member

type RouteParams = { params: Promise<{ memberId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const claims = await verifyAdminSession();
  if (!claims) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  const { memberId } = await params;
  const doc = await adminDb.collection("family_members").doc(memberId).get();

  if (!doc.exists) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, avatar, verificationCode, active } = body as {
    name?: string;
    avatar?: string;
    verificationCode?: string;
    active?: boolean;
  };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (avatar !== undefined) updates.avatar = avatar.trim();
  if (verificationCode !== undefined) updates.verificationCode = verificationCode.trim();
  if (active !== undefined) updates.active = active;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No updates provided" }, { status: 400 });
  }

  await adminDb.collection("family_members").doc(memberId).update(updates);

  const updated = await adminDb.collection("family_members").doc(memberId).get();

  return Response.json({
    member: { id: updated.id, ...updated.data() },
  });
}
