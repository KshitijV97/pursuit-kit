# 0006. Create the Google Doc by uploading HTML for Drive to convert

- **Status:** Accepted
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD6)

## Context

Each document is also saved as a Google Doc for convenience (R13). The app is the master copy, and Doc edits are never read back (R17, R18). The PDF from LaTeX is the file to submit.

## Decision

- Render the same generated content into a **simple HTML document** (headings, lists, bold, links) and upload it through the Drive API with the target type set to Google Docs, so Drive converts it.
- On regenerate, **update the same Doc's content** rather than creating a new file, so links to it keep working.
- Before regenerating, compare the Doc's `modifiedTime` with the time the app last wrote it. If the Doc was edited by hand, show the overwrite warning (R18).

## Consequences

- A small amount of code, with no Docs API batch-update logic.
- The Doc looks close to, but not the same as, the PDF. This is accepted: the PDF is the submit copy.
- Malformed HTML can make Drive store a plain HTML file instead of converting. The renderer emits a small, fixed set of tags, and a test checks the uploaded file's type is Google Docs.

## Alternatives considered

- **Google Docs API batchUpdate.** Precise formatting control, but much more code, and still not identical to the PDF.
- **Upload DOCX and convert.** Needs a DOCX generator, gives no better fidelity, and DOCX output was deferred.
