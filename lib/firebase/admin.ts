import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { requireEnv } from "@/lib/env";

// Server-only Firebase Admin SDK — used in API routes and server components.
// This file must NEVER be imported from client components.
//
// The admin SDK uses a service account for privileged access (bypasses
// Firestore security rules). Keep the service account key out of version
// control and load it via environment variables.

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId: requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      // The private key comes as a JSON-escaped string with literal \n —
      // replace them with real newlines so the SDK can parse it.
      privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });
}

const app = getAdminApp();

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
