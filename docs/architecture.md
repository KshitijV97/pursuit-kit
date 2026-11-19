# Architecture

This page is the source of truth for the system's current shape. The diagrams use Mermaid only, so they render on GitHub and show up in review diffs. The plan and the ADRs link here instead of keeping their own copies.

**Status:** This describes the planned shape of the MVP, built by units U1–U10, as recorded in the [plan](plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md). After U0 only the skeleton exists: a hello page on the Worker, a doc service that answers its health checks, and the hooks and workflows. Each diagram below names the unit that builds it. When a diagram and the code disagree, the code is ahead and this page is out of date.

The diagrams come from three places: the plan's High-Level Technical Design, the key technical decisions (KTD1–KTD15), and the ADRs. The list of nine is fixed by [ADR 0012](adr/0012-docs-and-mermaid-diagrams.md) and decision D28 in the [setup decisions](brainstorms/2026-11-18-technical-setup-decisions.md).

## 1. System context and containers

Shows who and what talks to the app, and where the CPU-heavy work runs. The app is a Hono Worker; almost all product work sits in `src/core/`; the outside services sit behind adapters. It serves the deployment shape in KTD1 (one Worker plus one doc service, both free, both allowing commercial use) and the core layer in [ADR 0013](adr/0013-core-product-layer.md). Built by U0, U1, U2, U3 and U4.

```mermaid
flowchart TB
  Owner["Owner: one person in a browser"] -->|"HTTPS, session cookie, plain forms"| Web["src/web: routes, JSX views, small enhancement scripts"]
  Web --> Core["src/core: product actions and claim rules"]
  Core --> Adapters["src/adapters: drive, ai, docservice, google-oauth"]
  Adapters -->|"OAuth tokens, Drive REST over fetch"| Google["Google: sign-in and Drive API"]
  Adapters -->|"provider interface"| AI["AI provider: Anthropic API"]
  Adapters -->|"shared secret"| Doc["Doc service: Hono and Tectonic on Render"]
  Doc -->|"owner's access token, reads uploads"| Google
  Google --> Drive[("Owner's Drive: Pursuit Kit folder")]
  Core --> Platform["src/platform: session crypto, CSRF, config, logs, version"]
```

## 2. Google sign-in and token refresh

Shows the one sign-in path and what happens to an expired token on a later request. The run uses PKCE, a `state` check, offline access and a forced consent prompt, so the app always receives a refresh token. The allowlist is checked after the code exchange, against a Google-verified email, and again on every request. The session is an AES-GCM sealed cookie. Serves R1 and R21 (tokens stay server-side). See [ADR 0002](adr/0002-google-sign-in-allowlist-cookie-session.md) and KTD2. Built by U1.

```mermaid
sequenceDiagram
  participant B as Browser
  participant W as Worker: auth routes and middleware
  participant G as Google OAuth
  B->>W: GET /signin
  W->>W: Create PKCE verifier and state, seal them in a short-lived cookie
  W-->>B: Redirect to Google with the PKCE challenge and the drive.file scope
  B->>G: Sign in and consent (prompt=consent, access_type=offline)
  G-->>B: Redirect to /auth/callback with code and state
  B->>W: GET /auth/callback
  W->>W: Check state against the short-lived cookie
  W->>G: Exchange the code for tokens
  G-->>W: ID token, access token, refresh token, expiry
  alt Email is Google-verified and on ALLOWED_EMAILS
    W-->>B: Set the sealed session cookie and redirect into the app
  else Email is not allowed
    W-->>B: Redirect to /denied
  end
  Note over W: Every later request re-checks the allowlist.<br/>An expired access token is refreshed with the refresh token.
  W->>G: Refresh grant
  G-->>W: New access token and expiry
  Note over W: A failed refresh clears the session and sends the owner to /signin.<br/>/signout revokes the Google grant and clears the cookie.
```

## 3. Per-job pipeline with checks

Shows every step from a pasted posting to saved files, including where the claim validator, the humanize pass and the page-fit loop sit. This is the flow behind F2 and R10–R18. The validator is the accuracy guarantee, so it runs after generation and again after the humanize rewrite. A draft that still has violations is saved as blocked and opened on the edit page rather than shipped. The page-fit loop makes at most three trims. Serves R6, R7, R13, R15, R16 and the 10-minute target. See KTD4, KTD5 and KTD8. Built by U6, U7 and U8; editing returns through the same checks in U9.

```mermaid
flowchart TB
  P["Posting text or link"] --> WK["Wake doc service"]
  P --> X["Extract requirements: extraction model"]
  X --> M["Match against evidence: direct, bridge, gap"]
  M --> Q["Up to 3 gap questions, each skippable"]
  Q --> S["Propose strategy: lead, emphasise, downplay"]
  S --> AP{"Skip-approval setting on?"}
  AP -->|"no"| OK["Owner approves or edits strategy"]
  AP -->|"yes"| GEN
  OK --> GEN["Generate content model with evidence IDs"]
  GEN --> V{"Validator passes?"}
  V -->|"no, once"| GEN
  V -->|"no again"| ERR["Save draft as blocked with violations; owner fixes on edit page"]
  V -->|"yes"| H["Humanize: one rewrite pass of flagged sentences"]
  H --> V2{"Validator passes again?"}
  V2 -->|"no"| ERR
  V2 -->|"yes"| R["Render LaTeX"]
  R --> CMP["Compile on doc service"]
  CMP --> F{"Within page target?"}
  F -->|"no, tries under 3"| TRIM["Trim lowest-priority bullet, re-validate"] --> R
  F -->|"no, tries at 3"| OVER["Save draft as blocked with overflow and suggested cuts"]
  F -->|"yes"| SAVE["Save .tex, PDF and Doc to the application folder; record step costs"]
```

## 4. One generation step with save and resume

Shows how a long run stays inside the Workers CPU limit and survives a reload. Each request runs exactly one step, through an idempotent advance endpoint keyed by an unguessable run token in `application.json`. A step lease written before the AI call or compile stops a reload or a second tab from paying for the same step twice. Without JavaScript, a 0-second `<noscript>` meta refresh plus a Continue link drive the same endpoint. Serves R22 and R25, and AE12. See KTD8 and [ADR 0007](adr/0007-typescript-hono-workers-and-render-doc-service.md). Built by U8.

```mermaid
sequenceDiagram
  participant B as Browser
  participant W as Worker route
  participant C as Core: advance run
  participant S as Drive: application.json
  participant X as AI provider or doc service
  B->>W: POST start generation with CSRF token
  W->>C: Start the run
  C->>S: Save run token, next step = generate
  W-->>B: Progress page (noscript refresh and Continue link, or script polls)
  loop Until the next step is done or blocked
    B->>W: GET advance with the run token
    W->>C: Advance
    C->>S: Read run state and step lease
    alt Step already finished, or the lease is unexpired
      C-->>W: Current progress, no new work
    else Step pending and no live lease
      C->>S: Write the lease: step name, attempt ID, expiry
      C->>X: One AI call or one compile
      X-->>C: Result, or a typed error
      C->>S: Save step output, cost record and next step
    end
    W-->>B: Progress page
  end
```

## 5. Application status lifecycle

Shows the five statuses in R19. You set any status by hand and the app never blocks a transition, so the diagram shows the usual path and not an enforced one: for example, a rejection can also follow a direct application, and any status can go back to `draft`. Built by U10 in the tracker, with the field written from U6 onward.

```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> applied
  applied --> interview
  interview --> offer
  applied --> rejected
  interview --> rejected
```

## 6. Data model

Shows the JSON records in Drive and what each one holds. Every file carries a `schemaVersion`, so later stages can migrate it. Writes replace whole files after a `modifiedTime` check. Evidence IDs are what make a claim traceable: `application.json` content points at items in `evidence.json`, and the validator rejects a claim with no IDs, unknown IDs or do-not-claim IDs. Serves R2, R3, R17 and R22; see KTD3, KTD7 and [ADR 0003](adr/0003-drive-file-scope-and-visible-data-layout.md). The exact field shapes are settled in U2 (schemas), U4–U5 (profile and evidence), U6 (match and strategy) and U8 (content and cost records); [reference/data-model.md](reference/data-model.md) lists what the plan names so far.

```mermaid
erDiagram
  PURSUIT_KIT_FOLDER ||--|| INDEX_JSON : "holds"
  PURSUIT_KIT_FOLDER ||--|| PROFILE_JSON : "holds"
  PURSUIT_KIT_FOLDER ||--|| EVIDENCE_JSON : "holds"
  PURSUIT_KIT_FOLDER ||--|| APPLICATIONS_JSON : "holds"
  PURSUIT_KIT_FOLDER ||--o{ APPLICATION_FOLDER : "contains"
  PROFILE_JSON ||--o{ EVIDENCE_JSON : "claim rules govern"
  APPLICATIONS_JSON ||--o{ APPLICATION_FOLDER : "lists"
  APPLICATION_FOLDER ||--|| APPLICATION_JSON : "holds"
  APPLICATION_FOLDER ||--o{ DOCUMENT : "holds"

  INDEX_JSON {
    string schemaVersion
    string pursuitKitFolderId
    string dataFolderId
    string applicationsFolderId
  }
  PROFILE_JSON {
    string schemaVersion
    string fixedDetails
    string settings
    string claimRules
    string doNotClaimList
  }
  EVIDENCE_JSON {
    string schemaVersion
    string id
    string contribution
    string claimClass
    string mayClaim
    string mayNotClaim
  }
  APPLICATIONS_JSON {
    string schemaVersion
    string id
    string company
    string role
    string status
    string deadline
    string nextStep
    string resumeStep
  }
  APPLICATION_JSON {
    string schemaVersion
    string posting
    string match
    string strategy
    string content
    string runToken
    string stepLease
    string costRecords
  }
  DOCUMENT {
    string format
    string fileName
    string driveFileId
    string modifiedTime
  }
```

## 7. Drive folder layout

Shows what you see in your own Drive. The `Pursuit Kit` folder is visible and app-created, with the data files under `_data/` and one subfolder per application. Application folders are named `YYYY-MM-DD Company - Role`, with characters Drive rejects made safe. A missing or trashed file is reported with the application or profile item it belongs to, never silently. Serves R2 and R3; see [ADR 0003](adr/0003-drive-file-scope-and-visible-data-layout.md). Built by U2, with files added by U4 and U7–U9.

```mermaid
flowchart TB
  MYDRIVE["My Drive"] --> PK["Pursuit Kit/ (visible, created by the app)"]
  PK --> DATA["_data/"]
  PK --> APPS["Applications/"]
  DATA --> IDX["index.json: folder IDs and schema version"]
  DATA --> PROF["profile.json: fixed details, settings, claim rules, do-not-claim list"]
  DATA --> EV["evidence.json: evidence items with contribution and claim class"]
  DATA --> APPSJ["applications.json: tracker list"]
  DATA --> SRC["sources/: original uploads (resume, LinkedIn zip, documents)"]
  APPS --> APP["2026-11-18 Acme - Backend Engineer/"]
  APP --> APPJ["application.json: posting, match, strategy, content with evidence IDs"]
  APP --> RES["Firstname_Lastname_Resume.tex, .pdf and Google Doc"]
  APP --> COV["Firstname_Lastname_Cover_Letter.tex, .pdf and Google Doc"]
```

## 8. Delivery pipeline

Shows how a change gets from your laptop to a release, and where the checks sit. Commits are checked by lefthook; pull requests repeat the important checks in CI; the regression pack runs after each merge and blocks releases while it fails. Deploys happen only when a release is published. Serves R24 and R25 through the enforced gates; see [ADR 0008](adr/0008-quality-gates-and-test-packs.md), [ADR 0009](adr/0009-versioning-releases-and-deploys.md), KTD11 and KTD12. Built by U0, and grown by U1, U3, U7 and U10 as they add tests to the packs.

```mermaid
flowchart TB
  C["Commit"] --> PC["pre-commit: staged format and lint, gitleaks, sanity pack"]
  PC --> CM["commit-msg: Conventional Commits"]
  CM --> PP["pre-push: lint, typecheck, unit tests, build"]
  PP --> PR["PR CI: same as pre-push, plus pnpm audit; docs and Mermaid job when Markdown changes"]
  PR --> SQ["Squash merge to main"]
  SQ --> RG["Regression pack: doc-service Docker tests, e2e, axe, keyboard, no-JS, budgets, knip"]
  RG -->|"fails"| IS["Open or update the regression issue; release blocked"]
  RG -->|"passes"| RP["release-please release PR; owner writes What's new"]
  RP --> REL["GitHub Release vX.Y.Z"]
  REL --> DW["Deploy Worker with wrangler, version injected"]
  REL --> DI["Build doc-service image, push to GHCR, call the Render deploy hook"]
```

## 9. Infrastructure resources

Shows every account and resource the MVP runs on, and which ones you create by hand. Everything is free, needs no card and allows commercial use (R26). There is no infrastructure as code in the MVP: `wrangler.toml` records the Cloudflare setup, and the Render service is created once from the checklist in [setup/render.md](setup/render.md). See [ADR 0010](adr/0010-no-infrastructure-as-code-in-mvp.md), KTD13, and the Operational Notes in the plan. Set up by U0's checklists; the Render service is created after the first release.

```mermaid
flowchart TB
  REPO["GitHub repository pursuit-kit (public)"] --> GHACT["GitHub Actions: ci, regression, docs, release-please, deploy"]
  GHACT -->|"wrangler deploy on release"| WORKER["Cloudflare Worker pursuit-kit (free plan)"]
  GHACT -->|"build, tag with the version, push"| GHCR["GitHub Container Registry package"]
  GHACT -->|"deploy hook with the image URL"| RENDER["Render free web service (doc service)"]
  GHCR -->|"image pull"| RENDER
  WORKER -->|"HTTPS with the shared secret"| RENDER
  WORKER -->|"OAuth and Drive REST"| GCP["Google Cloud project: OAuth client, Drive API"]
  WORKER -->|"API key, spend limit"| ANTH["Anthropic API"]
  GCP --> DRIVE[("Owner's Google Drive")]
  BROWSER["Owner's browser"] -->|"workers.dev URL"| WORKER
```
