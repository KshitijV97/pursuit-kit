# Data model in Drive

Everything lives in your own Google Drive. There is no database. The app can see only files it created, because it requests the `drive.file` scope ([ADR 0003](../adr/0003-drive-file-scope-and-visible-data-layout.md)).

**Read this as a sketch, not a schema.** The plan's implementation units are the source of truth for every field. The shapes here are settled unit by unit: U2 for the files and schemas, U4 and U5 for the profile and evidence, U6 for match and strategy, U8 for content and cost records, U10 for tracker fields. When code and this page disagree, the code wins and this page needs an update.

## Files and folders

| Path                                                            | Holds                                                                                                                                                                                             | Settled by |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `Pursuit Kit/`                                                  | The app's visible folder in My Drive                                                                                                                                                              | U2         |
| `_data/index.json`                                              | The folder IDs and a schema version, so the app finds the folder again                                                                                                                            | U2         |
| `_data/profile.json`                                            | Fixed details, settings, claim rules and the do-not-claim list                                                                                                                                    | U2, U4, U5 |
| `_data/settings.json`                                           | Settings: skip-approval and experience level. [ADR 0003](../adr/0003-drive-file-scope-and-visible-data-layout.md) records these inside `profile.json`; U2 settles whether they get their own file | U2         |
| `_data/evidence.json`                                           | Evidence items, each with contribution and claim class                                                                                                                                            | U2, U4, U5 |
| `_data/applications.json`                                       | The tracker list                                                                                                                                                                                  | U2, U10    |
| `_data/sources/`                                                | Original uploads: resume, LinkedIn zip, project documents                                                                                                                                         | U4         |
| `Applications/`                                                 | One subfolder per application                                                                                                                                                                     | U2         |
| `Applications/<YYYY-MM-DD Company - Role>/`                     | One application workspace                                                                                                                                                                         | U2         |
| `.../application.json`                                          | Posting, match, strategy, generated content and run state                                                                                                                                         | U2, U6, U8 |
| `.../_pending/`                                                 | `.tex` and PDF files from a fit attempt that landed in target, held until save                                                                                                                    | U8         |
| `.../Firstname_Lastname_Resume.tex` `.pdf` and Google Doc       | Rendered outputs                                                                                                                                                                                  | U7, U8     |
| `.../Firstname_Lastname_Cover_Letter.tex` `.pdf` and Google Doc | Rendered outputs                                                                                                                                                                                  | U7, U8     |

Every JSON file carries a `schemaVersion` so a later stage can migrate it. Writes replace whole files, after a `modifiedTime` check that refuses to overwrite a file that changed since it was read.

## The content model rule

`application.json` holds one content model. Each generated piece — a bullet, a summary sentence, a cover-letter paragraph — carries the evidence IDs it rests on.

LaTeX, HTML and the Google Doc are pure renders of that model. They hold no content of their own, and the app never reads hand edits back. That is why regenerating updates all three formats together (R17) and why the app warns before it overwrites a hand-edited Doc (R18).

Two rules follow, and the validator enforces both:

- Every claim carries evidence IDs that exist and that are not marked do-not-claim.
- Do-not-claim items never reach output. They are removed from the evidence passed to generation, and any do-not-claim term in the text is a violation.

## `_data/index.json`

- `schemaVersion`
- `pursuitKitFolderId`, `dataFolderId`, `applicationsFolderId`

## `_data/profile.json`

- `schemaVersion`
- Fixed details: contact details, profile links, education, and a work-authorization or relocation line (R9)
- Settings: skip-approval (R14) and experience level, which sets the page target (R15)
- Claim rules per evidence item (R7)
- Do-not-claim list (R7)

## `_data/evidence.json`

- `schemaVersion`
- `id`: the ID that generated text cites
- `contribution`: `solo`, `shared` or `team-led` (R6)
- `claimClass`: `safe`, `hedge` or `do-not-claim`. New items default to `hedge` (R6)
- `mayClaim`, `mayNotClaim`: free text on how the item may and may not be described (R7)
- The item's own facts: role or project, dates, tools, and measurable results

## `_data/applications.json`

The tracker list. One entry per application, enough to render the list without opening each folder.

- `schemaVersion`
- `id`
- `company`, `role`
- `status`: `draft`, `applied`, `interview`, `offer` or `rejected`
- `deadline`: optional date
- `nextStep`: free text
- `resumeStep`: where reopening lands you: `match`, `questions`, `strategy`, `documents` or `edit`
- Last update time, used for sorting

A new draft starts at `resumeStep` `match`. A blocked application resumes at `edit`. The list is sorted by deadline, soonest first with undated entries last, then by last update.

## `application.json`

- `schemaVersion`
- The posting: pasted text or the text fetched from a link (R10)
- Company notes you paste for the cover letter (R12)
- `match`: each requirement labelled direct, bridge with confidence, or gap, plus ATS keywords (R11)
- `strategy`: lead narrative, emphasise list, downplay list and cover-letter hooks, after your approval (R11, R14)
- `content`: the generated content model, each piece with its evidence IDs (KTD7)
- `runToken`: an unguessable token that the advance endpoint requires (KTD8)
- `stepLease`: the step name, an attempt ID, and an expiry a few minutes away, written before the AI call or compile (KTD8)
- `costRecords`: one per AI call, retries and failed attempts included. Each record has the step name, attempt, model, input and output token counts, and the estimated cost (R22)
- Stored `modifiedTime` for each Google Doc, so a hand edit is detected (R18)
- A blocked state, with the validator violations or the page overflow and suggested cuts (R15)

## What is not stored in Drive

- No database, no credit ledger, no session store. The MVP has none of these.
- The session lives in an encrypted cookie.
- Secrets live in `.dev.vars`, Worker secrets and Render's environment, never in Drive.

## If a file goes missing

A missing or trashed expected file is reported with the item it belongs to: which application, by company and role, or which profile item (R3, AE9). The app does not recreate data silently and does not fail without a message.
