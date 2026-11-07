# Project Constitution

> This file is small and changes rarely. It is copied — verbatim, in full —
> into every Todo's constitution-brief (see `scripts/constitution-brief`).
> Do not put per-Todo status here (see `PROJECT-LEDGER.md`) and do not put
> "what got built" here (see `PROJECT-INTERFACES.md`). This file only holds
> rules that bind every Todo.
>
> Patch this file (append, with rationale) per Step 4 of the
> `decomposing-projects` skill whenever a child plan surfaces a new
> project-wide constraint. Never let a constraint like this live only inside
> one Todo's local plan.

## Naming & Schema Conventions

- All database columns and TypeORM entity properties use `snake_case` (e.g. `chapter_id`, `course_id`, `is_completed`, `created_at`, `structure_type`) — exact field names per the PRD Section 9 domain model.
- API request/response DTOs use `camelCase` field names (e.g. `chapterId`, `isCompleted`, `structureType`) at the API boundary; TypeORM entities stay `snake_case` internally and are never exposed as API responses.
- REST resource paths are plural nouns: `/courses`, `/sections`, `/chapters`, `/users`, `/auth`, `/progress`.
- The `(user_id, chapter_id)` uniqueness invariant on `ChapterProgress` is enforced both at the database level (unique constraint) and in application validation.

## API / Message Format Conventions

- All responses use a consistent error envelope: `{ error: { code, message, details? } }` with appropriate HTTP status codes (400, 401, 403, 404, 409, 500).
- Authentication is bearer-token based (session strategy to be confirmed in Todo 1); every protected endpoint checks authentication + role on the backend.
- OpenAPI spec documents every endpoint: auth requirements, authorization expectations, request parameters, request bodies, response schemas, error responses — kept in sync with DTOs.
- No breaking API changes without identifying frontend impact first.

## Tech Stack / Version Floors

- Monorepo: pnpm Workspaces; TypeScript across all packages and apps.
- Frontend: Vue 3 + Vite + Tailwind CSS + shadcn-vue (selective).
- Backend: NestJS + REST + OpenAPI.
- Database: PostgreSQL; ORM: TypeORM; migrations for every schema change (no `synchronize` in app environments).
- Testing: Vitest (unit/integration), Playwright (e2e).
- Workspace layout: `apps/web`, `apps/api`, `packages/api-client`, `packages/config`.

## Todo Dependency Graph

```
Todo 1 → (none)
Todo 2 → Todo 1
Todo 3 → Todo 2
Todo 4 → Todo 3
```

## Constitution Patch Log

[Append-only log of every patch made under Step 4 of the `decomposing-projects` skill. One entry per patch:
- `<date>` — Patch by Todo <N>: [exact new rule added] — rationale: [one line]. Todos flagged needs-recheck as a result: [list, or "none"].]

## Project Definition of Done

> Populate this once, right after Step 1, using the same No-Placeholder
> discipline as `writing-plans`'s own Definition of Done: exact commands,
> exact expected results, nothing generic like "integration works."

Project is DONE when all of the following hold:

- [ ] Every row in `PROJECT-LEDGER.md` is `done`, with no `needs-recheck` or `blocked` flags remaining
- [ ] `pnpm --filter @lerna/api run test` passes (NestJS backend integration tests)
- [ ] `pnpm --filter @lerna/web run test` passes (Vitest frontend tests)
- [ ] `pnpm playwright test` passes end-to-end smoke test exercising the seam between Todo 2 (Content Management) and Todo 4 (Progress Tracking): create a course → add a chapter → mark chapter complete → verify progress recalculates
- [ ] Every `Consumes`-shaped dependency between Todos, as declared in each Todo's own plan, is confirmed against the matching `Produces` entry in `PROJECT-INTERFACES.md` by the project-level integration reviewer (Step 7) with zero unresolved mismatches
- [ ] `grep -rn "TODO\|TBD" docs/superp/PROJECT-*.md` returns nothing
