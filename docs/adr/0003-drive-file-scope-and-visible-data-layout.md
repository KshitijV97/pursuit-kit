# 0003. Use the drive.file scope and a visible app folder with JSON data files

- **Status:** Accepted (revised 2026-11-18: REST over `fetch` and the upload path for Workers)
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD3)

## Context

All profile data, applications and documents are stored in the user's Drive (R2). Google classes Drive scopes as non-sensitive, sensitive or restricted. Restricted scopes (full Drive access) need a security assessment before an app can be offered to other users. `drive.file` is non-sensitive: the app can read and write only files it created, or files the user opens through the Google Picker. The app is the master copy of every document, so it never needs to read files the user made by hand.

## Decision

- Request only **`https://www.googleapis.com/auth/drive.file`**.
- On first sign-in, create a visible folder **`Pursuit Kit`** in My Drive and remember its ID in a small `_data/index.json` inside it. Find it again by searching for app-created files with that name.
- Layout:

```text
Pursuit Kit/
  _data/
    index.json            folder IDs and schema version
    profile.json          fixed details, settings, claim rules, do-not-claim list
    evidence.json         evidence items with contribution and claim class
    sources/              original uploads (resume, LinkedIn zip, docs)
    applications.json     tracker list: id, company, role, status, deadline, next step
  Applications/
    2026-11-18 Acme - Backend Engineer/
      application.json    posting, match, strategy, generated content with evidence links
      Firstname_Lastname_Resume.pdf / .tex / (Google Doc)
      Firstname_Lastname_Cover_Letter.pdf / .tex / (Google Doc)
```

- Every JSON file carries a `schemaVersion` so later stages can migrate it.
- Writes replace whole files. There is one user, so the app does not need locking. It does check each file's Drive `modifiedTime` before overwriting, and refuses if the file changed since it was read.
- When a file the app expects is missing or in the Drive trash (`trashed: true`, which the API still returns normally), it reports which profile item or application is affected (R3), rather than failing silently. The folder search filters out trashed folders.
- All Drive calls use the REST API with `fetch`. The `googleapis` package doesn't run on Cloudflare Workers (ADR 0007).
- Every upload is a plain form whose multipart body the Worker streams, unparsed, to the doc service. The doc service writes each file to Drive through a resumable session with the owner's access token (for a LinkedIn zip, only the known CSVs) and returns the file IDs. JavaScript and no-JavaScript use the same path. The Worker never buffers the body, which keeps it inside its 10 ms CPU limit, and bodies are capped at 100 MB. The doc service later reads those files from Drive to extract text.

## Consequences

- No Google security review, now or when the site opens to other users.
- Files the user drops into the folder by hand are invisible to the app. That matches "the app is the master copy".
- The data is readable and easy to back up, and deleting the folder deletes everything.
- Hand-editing or deleting the JSON files can break an application. R3 makes this visible.

## Alternatives considered

- **Full `drive` scope.** Restricted scope, needs a security assessment, and is far more access than needed.
- **The hidden `appDataFolder`.** Protects data from accidental edits, but the user cannot see or back it up, and it is removed if the app's access is revoked. This runs against the brainstorm's choice of data the user can see.
