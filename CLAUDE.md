# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Next.js 16 Warning

This project uses **Next.js 16** which has breaking changes from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint (eslint.config.mjs, Next.js core-web-vitals + TypeScript presets)
```

No test framework is configured.

## Tech Stack

- **Next.js 16** (App Router) / **React 19** / **TypeScript 5**
- **Tailwind CSS 4** via `@tailwindcss/postcss`
- **Firebase**: Firestore (database) + Firebase Auth (admin login only)
- **pnpm** package manager, **Node.js 24.14.0** (see `.nvmrc`)
- Path alias: `@/*` maps to project root

## Architecture

**Two distinct user flows with separate auth systems:**

### Family Members (no Firebase Auth)
- Select name + enter personal code (birthday as `mmddyy`) on `/`
- Server verifies code against Firestore `family_members` collection
- Session: HMAC-signed httpOnly cookie (`member_session`) with 30-day expiry
- Auth context: `useAuth()` hook from `lib/hooks/use-auth.tsx`
- Routes: `/tickets`, `/tickets/new`, `/tickets/[ticketId]`

### Admin (Firebase Auth email/password)
- Login at `/admin/login`, client SDK gets ID token → exchanged for Firebase session cookie at `/api/admin/login`
- Auth context: `useAdminAuth()` hook from `lib/hooks/use-admin-auth.tsx`
- Wrapped in separate `AdminAuthProvider` in `app/admin/layout.tsx`
- Routes: `/admin`, `/admin/members`, `/admin/tickets/[ticketId]`

### Firebase SDK Split
- **Client SDK** (`lib/firebase/client.ts`): exports `db`, `auth` — used in browser components
- **Admin SDK** (`lib/firebase/admin.ts`): exports `adminDb`, `adminAuth` — server-only, never import from client components

### Firestore Collections
- `tickets/{ticketId}` — ticket documents
- `tickets/{ticketId}/events/{id}` — subcollection for status changes, edits, comments
- `family_members/{memberId}` — member profiles + verification codes
- `admins/{uid}` — admin profiles
- `config/family` — app-wide config

### Key Modules
- `lib/auth/member-session.ts` — HMAC cookie signing/verification for members
- `lib/auth/admin-session.ts` — Firebase session cookie management for admins
- `lib/services/tickets.ts` — Firestore CRUD for tickets
- `lib/rate-limit.ts` — in-memory sliding-window rate limiter (resets on restart)
- `lib/types/` — shared TypeScript types (`Ticket`, `TicketStatus`, `TicketCategory`, `FamilyMember`, `AdminProfile`)
- `lib/utils.ts` — UI helpers (`timeAgo`, `formatDate`, `CATEGORY_CONFIG`, `STATUS_CONFIG`)

### State Management
React Context only (no Redux/Zustand). `AuthProvider` wraps root layout; `AdminAuthProvider` wraps `/admin` layout.

## Environment Variables

See `.env.example`. Client-side vars use `NEXT_PUBLIC_` prefix. Server-side: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `MEMBER_SESSION_SECRET`.
