import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

// Smoke-test endpoint: proves env vars, Firebase init, and Firestore
// connection all work. Hit it at http://localhost:3000/api/health
//
// Safe to delete once you've confirmed things are wired up.

export async function GET() {
  try {
    // Try to read from Firestore — the collection doesn't need to exist,
    // Firestore will just return an empty result.
    const q = query(collection(db, "tickets"), limit(1));
    const snap = await getDocs(q);

    return Response.json({
      status: "ok",
      firestore: "connected",
      ticketCount: snap.size,
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
