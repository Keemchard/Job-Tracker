# JobTracker — Job Application Records

A professional job hunting tracker built with Next.js, TypeScript, SCSS, and Firebase. Track companies you've applied to, monitor application statuses, and manage your entire job search in one place.

## Features

- **Dashboard** — Stats overview with total applications, active, offers, rejections, and status breakdown
- **Application Management** — Add, edit, delete job applications with full detail tracking
- **Search & Filter** — Search by company/position/location, filter by status, sortable columns
- **Multi-user** — Firebase Authentication with email/password and Google sign-in
- **Responsive** — Mobile-friendly with collapsible sidebar and card layout on small screens

## Tech Stack

- **Frontend:** Next.js 16, TypeScript, SCSS Modules
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth (Email/Password + Google)
- **Deployment:** Vercel (recommended)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Copy the example env file and fill in your Firebase config:

```bash
cp .env.local.example .env.local
```

Required environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### 3. Firebase Console Setup

1. **Authentication** — Enable Email/Password and Google sign-in methods
2. **Firestore** — Create a database (Standard edition, nearest region)
3. **Security Rules** — Publish the rules from `firestore.rules`
4. **Composite Index** — Create an index on `applications` collection: `userId` (Ascending) + `createdAt` (Descending)

### 4. Run the app

```bash
npm run dev
```

## Security Measures

### Authentication & Authorization

- **Firebase Authentication** — All users must sign in via email/password or Google OAuth before accessing any data
- **Route protection** — Unauthenticated users are redirected to the login page; no app content is rendered without a valid session
- **User-scoped data isolation** — Every Firestore document is tagged with a `userId`; queries only return documents belonging to the authenticated user

### Firestore Security Rules

- **Ownership enforcement** — Read, update, and delete operations require `resource.data.userId == request.auth.uid`; users cannot access other users' data
- **Ownership immutability** — Update rules verify that `userId` cannot be changed (`request.resource.data.userId == resource.data.userId`), preventing privilege escalation
- **Data validation at the database level** — Rules enforce:
  - Required fields must be present (`company`, `position`, `location`, `workMode`, `status`, `dateApplied`, `userId`, `createdAt`, `updatedAt`)
  - All fields must be the correct type (string)
  - Maximum field lengths (e.g., company: 200 chars, notes: 2000 chars, jobUrl: 500 chars)
  - `status` must be one of: `applied`, `screening`, `interview`, `technical`, `offer`, `accepted`, `rejected`, `withdrawn`
  - `workMode` must be one of: `remote`, `onsite`, `hybrid`
- **Catch-all deny** — Any collection or document path not explicitly allowed is denied by default

### Client-Side Input Sanitization

- **String trimming and length limiting** — All text inputs are trimmed and truncated to their maximum allowed length before writing to Firestore
- **Enum validation** — Status and work mode values are validated against a strict allowlist before submission
- **URL validation** — Job URLs are parsed and only `http://` or `https://` protocols are accepted, blocking `javascript:` URI injection
- **Email format validation** — Contact emails are validated against a standard pattern
- **Required field enforcement** — Empty required fields are rejected before the write reaches Firestore

### Ownership Verification on Mutations

- **Pre-write ownership check** — Before updating or deleting a document, the application reads the document first and verifies `userId` matches the authenticated user
- **Defense in depth** — This client-side check complements the Firestore rules, ensuring that even if a bug bypasses the UI, the operation is still blocked

### HTTP Security Headers

All responses include the following headers (configured in `next.config.ts`):

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking by blocking iframe embedding |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing attacks |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS for 2 years, prevents SSL stripping |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer information leakage to external sites |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Blocks access to device sensors |
| `X-DNS-Prefetch-Control` | `on` | Enables DNS prefetching for performance |

### Environment & Secrets

- **`.env.local` excluded from git** — The `.gitignore` includes `.env*`, preventing accidental credential commits
- **Firebase API key is public by design** — Firebase API keys are meant to be client-side; actual security is enforced by Firestore rules and Firebase Auth, not by hiding the key

### Recommended Firebase Console Settings

- **Authorized domains** — In Authentication > Settings, restrict to your deployment domain only
- **API key restrictions** — In Google Cloud Console > Credentials, restrict the API key to Identity Toolkit and Firestore APIs and to your domain(s)

## Deployment

Deploy to Vercel:

```bash
npm install -g vercel
vercel
```

Add your `.env.local` variables in Vercel's project settings under Environment Variables.
