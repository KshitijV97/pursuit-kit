# GitHub repository settings

These settings live on GitHub, not in the repo, so this page is the record of what they should be. They put ADR 0009's branching rule into effect: `main` is protected, and changes land through squash-merged PRs with Conventional Commit titles. Applied on 2026-11-19 (issue #22).

## Merge settings

Settings → General → Pull Requests.

| Setting | Value | Why |
|---|---|---|
| Allow merge commits | Off | One squashed commit per PR keeps history linear |
| Allow squash merging | On | The only merge method |
| Default squash commit title | Pull request title | release-please builds versions and `CHANGELOG.md` from it. With "commit or PR title", a one-commit PR would use the commit's title instead. |
| Default squash commit message | Commit messages | Keeps each commit's detail in the squashed commit |
| Allow rebase merging | Off | Squash only |
| Automatically delete head branches | On | A merged PR's branch disappears, so nothing can merge into it afterwards. This is what let #23 land on an already-merged branch and miss `main`. |

## Branch protection on `main`

Settings → Branches → `main`.

| Rule | Value | Why |
|---|---|---|
| Require a pull request before merging | On, 0 approvals | Every change goes through a PR. GitHub won't let you approve your own PR, so requiring an approval would block every merge. |
| Required status checks | `Lint, types, tests and build` and `Regression gate` | The two checks that report on every PR. Leave `Mermaid syntax` optional: it only runs when Markdown changes, so a PR without Markdown would wait for it forever. |
| Require branches to be up to date | Off | With one person merging squashed PRs, it would mostly mean extra rebases |
| Require conversation resolution | On | Review comments get an answer before merging |
| Require linear history | On | Matches squash-only merging |
| Do not allow bypassing the above settings (include administrators) | On | You can't push to `main` directly either. In an emergency, untick it, make the change through a PR anyway if you can, and tick it again. |
| Allow force pushes | Off | |
| Allow deletions | Off | |

A check name is the job's `name:` in `.github/workflows/`. If you rename a job, update the required checks here in the same PR, or every PR will wait for a check that no longer exists.

## Check the settings

```bash
gh api repos/KshitijV97/pursuit-kit --jq '{allow_squash_merge, allow_merge_commit, allow_rebase_merge, delete_branch_on_merge, squash_merge_commit_title, squash_merge_commit_message}'
```

```bash
gh api repos/KshitijV97/pursuit-kit/branches/main/protection --jq '{checks: .required_status_checks.contexts, strict: .required_status_checks.strict, approvals: .required_pull_request_reviews.required_approving_review_count, admins: .enforce_admins.enabled, linear: .required_linear_history.enabled, conversations: .required_conversation_resolution.enabled, force_push: .allow_force_pushes.enabled, deletions: .allow_deletions.enabled}'
```

The output should match the tables above.

## Re-apply the settings

These overwrite the current settings. Run them only if the check above shows a difference.

```bash
gh api -X PATCH repos/KshitijV97/pursuit-kit -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false -F delete_branch_on_merge=true -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=COMMIT_MESSAGES
```

```bash
gh api -X PUT repos/KshitijV97/pursuit-kit/branches/main/protection --input - <<'EOF'
{
  "required_status_checks": {
    "strict": false,
    "checks": [
      {"context": "Lint, types, tests and build", "app_id": 15368},
      {"context": "Regression gate", "app_id": 15368}
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {"required_approving_review_count": 0},
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
EOF
```

`app_id` 15368 is GitHub Actions; it stops another app from satisfying the check by posting a status with the same name.

## Not set yet

- **Signed commits:** every machine and agent that commits would need signing set up first.
- **Code owners and required reviewers:** useful once someone else contributes.
- **Approval before deploying:** the `production` environment could require your approval for each deploy. Merging the release PR already is that approval while you're the only one releasing.
