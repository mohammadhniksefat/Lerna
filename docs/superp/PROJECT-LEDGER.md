# Project Ledger

> Live status table, updated on every transition. Unlike the Constitution
> (rarely changes) and Interfaces (append-only), this file is expected to
> churn constantly — that's exactly why it's a separate file: a status flip
> here should never look like a constraint change in a diff of
> `PROJECT-CONSTITUTION.md`.
>
> Status values: `not-started` | `in-progress` | `blocked` | `needs-recheck`
> | `done`. A Todo cannot be dispatched while `needs-recheck` or move to
> `done` while `needs-recheck` — resolve the flag first (Step 4 of
> `decomposing-projects`).

| Todo | Status | Depends on | Plan file | Commit range | Needs-recheck reason |
|------|--------|------------|-----------|--------------|----------------------|
| Todo 1 | not-started | none | | | |
| Todo 2 | not-started | Todo 1 | | | |
| Todo 3 | not-started | Todo 2 | | | |
| Todo 4 | not-started | Todo 3 | | | |

<!-- Add one row per Todo from the Constitution's Todo Dependency Graph.
Keep `Depends on` here mechanically identical to the Constitution's graph —
a mismatch between the two is a bug, exactly like writing-plans's own
Task Dependency Graph vs. per-task Depends on check. -->
