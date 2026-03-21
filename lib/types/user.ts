// ── User / family member domain types ────────────────────────────────

// Family members don't have "accounts" — they pick their name and
// enter their personal code (e.g. birthday as mmddyy). Once verified,
// the browser remembers them via a signed session cookie.
export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;        // emoji or short string, e.g. "🦊"
  order: number;          // display order on the "who are you?" screen
  active: boolean;        // soft-delete: hide without losing history
  verificationCode: string; // e.g. "031505" — stored server-side, never sent to client
}

// The admin (you) signs in with Firebase Auth (email/password or
// whatever provider you choose). This type represents the admin's
// profile document in Firestore — separate from the auth record.
export interface AdminProfile {
  id: string;        // matches Firebase Auth UID
  email: string;
  displayName: string;
}

// App-wide family settings, managed from the admin panel.
export interface FamilyConfig {
  verificationPrompt: string; // shown to family members, e.g. "Enter your secret code"
}
