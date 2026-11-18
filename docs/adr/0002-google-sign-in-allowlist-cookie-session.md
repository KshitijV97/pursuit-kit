# 0002. Google sign-in with an email allowlist and cookie-only sessions

- **Status:** Accepted
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD2)

## Context

The site is reachable on a public URL but must be usable only by the owner in the MVP (R1). Data lives in the user's Google Drive (R2), so the app already needs a Google OAuth grant. Later stages open the site to other users.

## Decision

- Use **Auth.js (NextAuth) with the Google provider**, requesting `openid email profile` plus the Drive scope from ADR 0003, with offline access so the app receives a refresh token.
- Reject sign-in in the sign-in callback unless Google reports the email as verified and it is on `ALLOWED_EMAILS` (an environment variable, comma-separated).
- Publish the OAuth consent screen "In production". Only non-sensitive scopes are requested, so no verification is needed; "Testing" status would expire refresh tokens every 7 days.
- Keep **no database**. The session, including the Google access and refresh tokens, lives in Auth.js's encrypted JWT cookie. The server refreshes the access token when it expires. The tokens are read only on the server; the session object sent to the browser carries the email and a refresh-error flag, never a token.
- Every API route checks the session before doing anything, so an unauthenticated or non-allowlisted request never reaches Drive or the AI.

## Consequences

- No database to host or secure. All user data stays in the user's Drive.
- Opening to more users later means changing the allowlist rule, not adding login.
- If the cookie secret leaks, sessions can be forged. The secret lives only in Vercel environment variables.
- Revoking access is done from the user's Google account permissions page or by rotating the cookie secret.

## Alternatives considered

- **A simple password gate.** Rejected in the brainstorm. Google sign-in is needed for Drive anyway.
- **A database-backed session store.** Unnecessary for one user, and adds a free database to manage.
