# 0002. Google sign-in with an email allowlist and cookie-only sessions

- **Status:** Accepted (revised 2026-11-18: Auth.js replaced by `oauth4webapi` and a hand-built encrypted cookie)
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD2)

## Context

The site has a public URL, but in the MVP only the owner may use it (R1). Data lives in the user's Google Drive (R2), so the app needs a Google OAuth grant anyway. Later stages open the site to other users.

The app runs on Cloudflare Workers with Hono (ADR 0007), so Next.js-bound Auth.js no longer fits. `arctic`, the obvious small OAuth library, was deprecated by its author in July 2026.

## Decision

- **Sign-in flow.** Use **`oauth4webapi`** (maintained, standards-based, runs on Workers) for the Google authorization code flow.
  - PKCE and a `state` check.
  - Scopes `openid email profile` plus the Drive scope from ADR 0003.
  - `access_type=offline` and `prompt=consent`, so a refresh token is always returned.
- **Allowlist.** After the code exchange, admit the user only when the ID token's email is verified and the lowercased email is on `ALLOWED_EMAILS` (a comma-separated secret).
- **Consent screen.** Publish it "In production". Only non-sensitive scopes are requested, so no verification is needed. "Testing" would expire refresh tokens every 7 days.
- **Sessions, with no database.**
  - The access token, refresh token, expiry and email are sealed with **AES-GCM through Web Crypto** into one `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
  - The key is the `SESSION_KEY` secret.
  - Tokens are read only on the server and are never rendered.
- **Protection.**
  - Middleware refreshes an expired access token, ends the session when a refresh fails, and re-checks the allowlist on every request.
  - Signing out revokes the Google grant.
  - Every state-changing form carries a CSRF token tied to the session. The exception is the idempotent advance endpoint (a GET), protected by the session plus an unguessable run token that only a CSRF-protected POST creates.

## Consequences

- There's no database to host or secure, and all user data stays in the user's Drive.
- Opening to more users means changing the allowlist rule, not adding login.
- The app owns about 200 lines of sign-in code, covered by tests (plan U1). In return it carries no deprecated dependency.
- Without brand verification, which needs an owned domain, the consent screen shows no logo. That's acceptable while the owner is the only user. Adding a domain is a stage 3 decision.
- If `SESSION_KEY` leaks, sessions can be forged. Rotating it signs everyone out (runbook `docs/runbooks/rotate-secret.md`).

## Alternatives considered

- **Auth.js.** Tied to Next.js, which was dropped (ADR 0007).
- **`arctic`.** Deprecated in July 2026.
- **Writing the OAuth protocol entirely by hand.** More code to get right than a maintained, spec-compliant library.
- **A database-backed session store.** Unnecessary for one user. It would add a database that has to stay free.
