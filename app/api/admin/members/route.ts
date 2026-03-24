import { verifyAdminSession } from "@/lib/auth/admin-session";
import { adminDb } from "@/lib/firebase/admin";

// GET  /api/admin/members — list all family members (including codes)
// POST /api/admin/members — add a new family member

export async function GET() {
  const claims = await verifyAdminSession();
  if (!claims) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  const snap = await adminDb
    .collection("family_members")
    .orderBy("order", "asc")
    .get();

  const members = snap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name as string,
    avatar: doc.data().avatar as string,
    order: doc.data().order as number,
    active: doc.data().active as boolean,
    verificationCode: doc.data().verificationCode as string,
  }));

  return Response.json({ members });
}

export async function POST(request: Request) {
  const claims = await verifyAdminSession();
  if (!claims) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, avatar, verificationCode } = body as {
    name?: string;
    avatar?: string;
    verificationCode?: string;
  };

  if (!name?.trim() || !avatar?.trim() || !verificationCode?.trim()) {
    return Response.json(
      { error: "Name, avatar, and verification code are required" },
      { status: 400 },
    );
  }

  // Determine next order value
  const snap = await adminDb
    .collection("family_members")
    .orderBy("order", "desc")
    .limit(1)
    .get();
  const nextOrder = snap.empty ? 0 : (snap.docs[0].data().order as number) + 1;

  const docRef = await adminDb.collection("family_members").add({
    name: name.trim(),
    avatar: avatar.trim(),
    verificationCode: verificationCode.trim(),
    order: nextOrder,
    active: true,
  });

  const doc = await docRef.get();

  return Response.json(
    { member: { id: doc.id, ...doc.data() } },
    { status: 201 },
  );
}
