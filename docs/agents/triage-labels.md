# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the label strings used in this repo's GitHub Issues. The owner's manual in [README.md](../../README.md#5-issues) explains each label.

| Label in mattpocock/skills | Label in our tracker | Meaning |
| -------------------------- | -------------------- | ------- |
| `needs-triage`             | `needs-triage`       | New; not yet sorted |
| `needs-info`               | `owner-decision`     | An agent paused for a choice only the owner can make |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified; an agent can pick it up |
| `ready-for-human`          | `owner-action`       | Only the owner can do this: account, console, secret, setting or manual check |
| `wontfix`                  | `wontfix`            | Will not be actioned |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

`regression` is opened by the post-merge regression workflow and blocks releases; it is not a triage role.
