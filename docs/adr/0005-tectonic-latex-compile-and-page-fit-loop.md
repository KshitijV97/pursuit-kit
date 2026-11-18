# 0005. Compile LaTeX with Tectonic and enforce page count with a fit loop

- **Status:** Accepted
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD5)

## Context

Outputs include a `.tex` source and a PDF compiled from it (R13). The PDF must never run over its page target: one page for freshers, two at most for experienced owners (R15). ADR 0001 puts compilation in a separate container.

## Decision

- The app fills **one resume template and one cover-letter template** (LaTeX, with escaping for every inserted value) from the generated content.
- The compile service runs **Tectonic** (MIT licensed, fetches only the packages a document needs, bundled in the image at build time so compiles never download at run time). It exposes:
  - `POST /compile`: takes a `.tex` source, returns the PDF and its page count, or the compiler log on failure;
  - `GET /health`: used as the wake-up call.
- **Page-fit loop:** each attempt is its own request. After compiling, if the page count exceeds the target, the app asks the writing model to drop or shorten the lowest-priority bullet (keeping evidence links, never removing the last resume use of evidence the cover letter cites), re-runs the validator, then recompiles. At most three tries. After an owner's in-app edit, overflow shows suggested cuts for the owner to accept instead of trimming automatically. If it still overflows, no PDF is saved; the owner sees the overflow and the bullets it suggests cutting, so an over-target PDF never reaches the application folder.
- Underfull pages are acceptable in the MVP. The reference tool's line-by-line polish (no stranded words, no large gaps) is deferred.

## Consequences

- The PDF is exactly what the `.tex` produces, so a hand-compiled `.tex` gives the same result.
- Each fit retry costs one AI call and one compile, a few seconds each.
- LaTeX escaping is a correctness requirement. Unescaped `&`, `%`, `$`, `#`, `_` from user text would break compilation.

## Alternatives considered

- **Typst.** Faster and simpler, but the owner asked for `.tex` output.
- **HTML to PDF with a headless browser.** No `.tex`, and page control is weaker.
