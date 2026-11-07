# Project Interfaces Registry

> Append-only. One section per Todo, added the moment that Todo's own
> Definition of Done passes (Step 5 of `decomposing-projects`), never before
> and never edited retroactively. If a later Todo needs an earlier Todo's
> interface to change, that change is a `PROJECT-CONSTITUTION.md` patch
> (Step 4) plus a `Deviations from plan` note on the *later* Todo's own
> section — the earlier Todo's section stays as written.
>
> `scripts/constitution-brief <TODO_ID>` reads this file and extracts only
> the `Produces` block(s) for the Todo IDs listed in that Todo's `Depends on`
> row in `PROJECT-LEDGER.md` — not the whole file. Keep each section's
> heading and field names exactly as shown below so the extractor's `awk`
> pattern keeps matching.

<!-- Example section — delete once real Todos start finishing:

## Todo 2: Python capability service
**Depends on:** none
**Produces:**
- `mission_id: string (uuid)` — canonical identifier used by every
  downstream service; snake_case per Constitution naming section
- `POST /internal/missions/{mission_id}/status` — body `{status: "queued"|
  "running"|"done"|"failed"}`, returns 200 with the updated mission object
**Deviations from plan:** none

-->
