# Pursuit Kit

A personal web app for job applications. Paste a job posting and get a tailored resume and cover letter (LaTeX, Google Doc and PDF) in your own Google Drive, with every claim traced to evidence you recorded, plus a tracker for every application.

- What it is and how it works: [docs/README.md](docs/README.md) and [docs/architecture.md](docs/architecture.md)
- What is being built: [the MVP plan](docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md), tracked in issue [#13](https://github.com/KshitijV97/pursuit-kit/issues/13)
- Rules for coding agents: [AGENTS.md](AGENTS.md) (`CLAUDE.md` is a symlink to it)
- Setting up a machine or account: [docs/setup/](docs/setup/README.md)

---

# Owner's manual

How you, the owner, build Pursuit Kit with coding agents (Claude Code or OpenCode), using the **Compound Engineering** plugin for the work itself and Matt Pocock's **grill-with-docs** for domain rigor. Read it once; come back to [Choosing the workflow](#2-choosing-the-workflow) and [Blockers](#6-blockers) when you need them.

## 1. Who does what

Agents write the code, tests, docs, plans and PRs. **You** do what needs your judgment or your accounts:

| Only you | Why |
|---|---|
| Decide what to build and approve each plan | Plans are the contract agents build against |
| Answer interview questions (brainstorm, grilling) and decisions agents raise | Product and trade-off choices are yours |
| Do `owner-action` issues: accounts, consoles, secrets, settings, spend limits | Agents never handle your credentials |
| Run the manual smoke test against real services | Tests use fakes; only you can sign in for real |
| Merge PRs, edit "What's new" on the release PR, merge it | Merging a release deploys to production |

Everything else is the agent's job, including opening issues for anything it needs from you.

## 2. Choosing the workflow

| Situation | Start with |
|---|---|
| A new feature or stage, and the shape is still fuzzy | `/ce-brainstorm`, then the [full loop](#3-the-iteration-loop) |
| The direction is clear but it touches domain rules (evidence, claims, applications, runs) | `/grill-with-docs` on the plan, then `/ce-plan` |
| A planned unit or a clear, specified change | `/ce-work <plan or issue>` |
| Something is broken or slow | `/ce-debug` |
| A small issue labelled `ready-for-agent`, and you want it done hands-off | `/lfg <issue>` (ends as an open PR) |
| Review comments on an open PR | `/ce-resolve-pr-feedback` |
| A PR that needs watching until it can merge | `/ce-babysit-pr` |
| A fix taught a lesson worth keeping | `/ce-compound` |
| A long session felt costly or went wrong | `/ce-retro` |
| A one-off question or a tiny edit | Just ask. No skill needed. |

Rule of thumb: fuzzy → brainstorm; domain-heavy → grill; clear → work.

## 3. The iteration loop

One iteration takes one feature, stage or plan unit from idea to release. The session boundaries matter: some steps need a fresh context, one must **not** have its context cleared.

1. **Scope it** (fresh session): `/ce-brainstorm <idea>`.
   - Answer one question at a time, pick one of the approaches it offers.
   - Output: a requirements plan in `docs/plans/` with stable R / AE IDs.
2. **Grill it** (fresh session): `/grill-with-docs Read docs/plans/<plan>.md. Skip product ideation; interrogate domain boundaries, state transitions, failure modes and terminology.`
   - Answer the numbered rounds quickly ("1 yes, 2 B, 3 no because…").
   - `GLOSSARY.md` and `docs/adr/` are updated as you go. Everything else you decide lives **only in the chat**.
   - Skip this step for work that touches no domain rules.
3. **Plan it** (**same session as step 2, no `/clear`**): `/ce-plan docs/plans/<plan>.md`.
   - This folds the grilling decisions into the plan and adds the technical design, units, tests and Operational Notes.
   - Optional: `/ce-doc-review docs/plans/<plan>.md` for a second look.
4. **Approve it**: read the plan's Goal Capsule, scope and Operational Notes. Ask for changes until it's right. The agent then:
   - opens or updates the tracking issue for the plan;
   - opens one `owner-action` issue per owner step in Operational Notes, linked from the tracking issue;
   - commits the plan in its own PR, which you merge.
5. **Build it** (fresh session): `/ce-work docs/plans/<plan>.md`. It builds unit by unit, runs the gates, reviews its own diff, and opens the PR when you tell it to. Anything it needs from you comes back as an issue ([section 6](#6-blockers)).
6. **Smoke test and merge**: CI must be green. If the change touches sign-in, Drive, AI or the doc service, run the manual smoke test and note it in the PR. Squash-merge.
7. **After merge**: the regression pack runs on `main`. If it fails, a `regression` issue opens and releases are blocked until it's fixed: start a fresh session with `/ce-debug #<issue>`; it works from the issue and needs nothing from earlier sessions.
8. **Keep the lesson**: if something surprised you or a review caught a real defect, run `/ce-compound` so the next agent doesn't repeat it. Run it in the session that made the fix, before closing it: it judges the lesson from what that session tried and dropped, which the diff doesn't show. If you forget, run it later with a one-line description of the problem; it searches the last week's sessions, but may find nothing worth keeping. One lesson per run.
9. **Release**: when you want to ship, edit "What's new" on release-please's open PR and merge it. That deploys. See [docs/runbooks/release.md](docs/runbooks/release.md).

Small work skips steps 1–4: an issue with a clear "done when" goes straight to `/ce-work` or `/lfg`.

## 4. Using grill-with-docs with Compound Engineering

The two tools work at different **altitudes**. Use each for what it is good at, and don't run both on everything.

| | `/ce-brainstorm` (Compound Engineering) | `/grill-with-docs` (Matt Pocock) |
|---|---|---|
| Job | Decide **what** to build and why | Stress-test **how it holds together** |
| Style | One question per turn; offers 2–3 approaches | Batches of numbered questions, each with a recommended answer |
| Writes | A requirements plan in `docs/plans/` at the end | `GLOSSARY.md` and ADRs **during** the chat; nothing else |
| Survives `/clear`? | Yes, it's a file | Only the glossary and ADRs; other decisions are lost |

**Two ways to combine them:**

- **Per feature** (fuzzy and domain-heavy): brainstorm → `/clear` → grill → `/ce-plan` in the **same** session → `/clear` → `/ce-work`. This is steps 1–5 above.
- **Per milestone** (routine features): run `/grill-with-docs` on its own when you start a new domain area, before a stage like payments or the MCP server, or when names in the code start to drift. Day-to-day features then use the plain Compound Engineering loop with the glossary and ADRs as guardrails.

**Rules for this repo:**

- **One vocabulary file: `GLOSSARY.md`.** Compound Engineering looks for `CONCEPTS.md`; AGENTS.md tells it to use `GLOSSARY.md` instead. Don't let a `CONCEPTS.md` appear.
- **ADRs keep this repo's format** (Status, Date, Plan, Decisions, Context, Decision, Consequences, Alternatives), not grill-with-docs' one-paragraph default. An ADR is only for a decision that is hard to reverse, surprising without context, and a real trade-off.
- **Grill a plan, not a vague idea.** Grilling a fuzzy idea drills deep into the wrong product.
- **Flush before you clear.** After grilling, run `/ce-plan` in the same session before `/clear` or a new session.
- **Compound Engineering owns plans and execution.** Don't also use Matt Pocock's `/to-spec`, `/to-tickets` or `/implement`; two planning systems drift apart. From his set, use `/grill-with-docs` (and `/grilling` or `/domain-modeling` alone), plus `/tdd`, `/triage` and `/wizard` when they fit.
- **First grilling to run:** `/grill-with-docs Help me build GLOSSARY.md from docs/plans/ and docs/adr/.` The plan already uses terms such as evidence item, claim class, do-not-claim list, application, run and step lease; they deserve one written definition each.

## 5. Issues

GitHub Issues are the only to-do list. Plans say **what** and **why**; issues say **what's open** and **who it's waiting on**. A plan is never edited to tick things off.

**Kinds of issue:**

| Kind | Who opens it | Label | Who closes it |
|---|---|---|---|
| Plan tracking (one per plan, e.g. #13) | Agent, when you approve a plan | none | Agent, when the plan is complete |
| Owner action: something only you can do | Agent | `owner-action` | You, when its "Done when" is true |
| Owner decision: a choice an agent paused on | Agent | `owner-decision` | You, by answering in a comment |
| Bug or idea you notice | You or agent | `needs-triage` until sorted | Whoever fixes it, via the PR |
| Ready work an agent can pick up | Agent, after triage | `ready-for-agent` | The PR that fixes it |
| Regression on `main` | CI | `regression` | The PR that fixes it |
| Leftover review finding | `/ce-work` | `ready-for-agent` or `needs-triage` | The PR that fixes it |

**How an issue moves:**

1. New bugs and ideas start as `needs-triage`. Run `/triage` now and then, or sort them yourself: `ready-for-agent`, `owner-decision`, `owner-action`, or `wontfix`.
2. A `ready-for-agent` issue goes to `/ce-work <issue>` or `/lfg <issue>`. The PR says `Fixes #N`, so merging closes it.
3. When an issue can't move until another one is done, the agent marks it **blocked by** that issue (GitHub's issue dependencies, or a `Blocked by: #N` line at the top). It unblocks when every blocker is closed.

**Handy filters:**

- Everything waiting on you: [`label:owner-action,owner-decision`](https://github.com/KshitijV97/pursuit-kit/issues?q=is%3Aissue+is%3Aopen+label%3Aowner-action%2Cowner-decision)
- Work an agent can take: [`label:ready-for-agent`](https://github.com/KshitijV97/pursuit-kit/issues?q=is%3Aissue+is%3Aopen+label%3Aready-for-agent)
- To sort: [`label:needs-triage`](https://github.com/KshitijV97/pursuit-kit/issues?q=is%3Aissue+is%3Aopen+label%3Aneeds-triage)

## 6. Blockers

A blocker is anything that stops a step from finishing. What happens depends on its type:

| Type | Example | Tracked as | What the agent does | What you do |
|---|---|---|---|---|
| **Owner action** | Create the OAuth client; set a secret; set the Anthropic spend limit; run a smoke test | `owner-action` issue | Holds only the steps that need it, finishes everything else, links the issue in the PR | Do it, check "Done when", close the issue |
| **Owner decision** | Two valid designs; the plan contradicts itself or an ADR; a requirement is unclear | Asked in chat; an `owner-decision` issue if you're not there to answer | Stops that thread (`status: blocked`), states the options with a recommendation, keeps going on independent work | Answer in the issue or chat |
| **Stop condition** | A free-tier limit breaks a decision; a wider Google scope is needed; a recurring cost appears | `owner-decision` issue | Stops immediately; never works around it | Decide, then update the plan and ADR |
| **Work dependency** | U2 waits on U1; PR 2 waits on PR 1 | The plan's dependency order; "blocked by" links between issues | Builds in order; never your problem | Merge the earlier PR |
| **Red gate** | CI fails; a `regression` issue is open | CI, `regression` issue | Fixes it before anything else | Nothing, unless the fix needs a decision |
| **Outside service** | GitHub, Google or Render outage; a library deprecated | Comment on the affected issue or PR | Waits or proposes an alternative as an owner decision | Decide if it lasts |

### How owner blockers work

**Agents:**
- Never use your accounts, enter your secrets, or change repository settings unless you ask in chat for that one change.
- Check the open `owner-action` issues before starting, so they don't re-ask for something already tracked.
- Open a new issue for each new owner step, in the [owner-action template](.github/ISSUE_TEMPLATE/owner-action.md): **Blocks** (what exactly waits, and what doesn't), **Steps** (linking `docs/setup/` or a runbook), a checklist, and **Done when** (a check you can run).
- Keep working on everything that doesn't depend on it. Code is never blocked by an owner action, because tests run on fakes; only real runs, releases and deploys are.
- List open owner blockers in the PR description and the plan's tracking issue.

**You:**
1. Open the "waiting on you" filter above.
2. Work top-down in the order the tracking issue lists them (each issue says what it unblocks).
3. Follow the linked steps, check "Done when", then close the issue with a short comment. If a secret is involved, put it where the doc says, never in the issue.
4. Tell the agent, or re-run `/ce-work` on the same plan: it picks up from what already exists and continues the held steps.

**Owner decisions:** answer in the issue in one line, the way you'd answer a grilling round. If the answer changes the plan or a decision, the agent updates the plan and its ADR in the same PR, then closes the issue.

## 7. Tool setup

Done once per machine. The repo side is already set up.

**Claude Code:**

```text
/plugin marketplace add EveryInc/compound-engineering-plugin
/plugin install compound-engineering
```

```bash
claude plugin install mattpocock-skills@claude-plugins-official
```

Install Matt Pocock's skills one way only, or every command appears twice. Plugin commands may show with a prefix, such as `/mattpocock-skills:grill-with-docs`.

**OpenCode:** `opencode.json` in the repo root lists the Compound Engineering plugin. Restart OpenCode after changing it. For Matt Pocock's skills:

```bash
npx skills@latest add mattpocock/skills -a opencode
```

Select all skills: `grill-with-docs` only calls `grilling` and `domain-modeling`, and silently breaks without them.

**Already configured in this repo** (what `/setup-matt-pocock-skills` would write): the issue tracker, label mapping and domain-doc rules in [docs/agents/](docs/agents/), and the `Agent skills` section in AGENTS.md. Re-run it only to change trackers.

**Some skills only you can start.** `/grill-with-docs` and `/setup-matt-pocock-skills` are user-invoked: type them yourself; an agent can't trigger them.

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| Grilling asked everything at once with no recommended answers and never touched `GLOSSARY.md` | `grilling` or `domain-modeling` is missing. Reinstall Matt Pocock's skills with all of them. |
| Decisions from grilling vanished when planning | The session was cleared before `/ce-plan`. Re-grill the gaps, then plan in the same session. |
| A `CONCEPTS.md` appeared | Move its terms into `GLOSSARY.md`, delete it, and check AGENTS.md still has the glossary rule. |
| OpenCode doesn't show `/ce-brainstorm` | Restart OpenCode. Some versions expect the key `"plugin"` rather than `"plugins"` in `opencode.json`. |
| An agent asks for a key or account step | Point it at the open `owner-action` issues. If none covers it, it should open one. |
| A release PR's checks never run | The GitHub App for release-please isn't set up yet (#20). |
