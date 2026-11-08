# Todo 4 — Progress Tracking Implementation Plan

> **For agentic workers:** this plan defines tasks, dependencies, and acceptance criteria only. Execute tasks inline in topo order (one at a time), with review between tasks. Task ordering MUST respect each task's `Depends on` field. The plan is not finished until every item in the Definition of Done section at the end is satisfied — task checkboxes alone do not mean the project is done.

**Goal:** Build the Lerna backend Progress Tracking API per PRD §4.6 (Progress Tracking) and PRD Phase 4 — chapter completion (mark as completed), progress calculation, and student dashboard/resume — behind authenticated `/progress/*` student endpoints. Todo 4 creates the `ChapterProgress` entity + migration (Todo 3 explicitly deferred it), adds student progress endpoints, and wires everything into the existing `AppModule`.

**Architecture:** A new `ProgressModule` in `apps/api` holding student-facing progress controllers and services, separate from Todo 2's Admin `CoursesModule` and Todo 3's `StudentModule`. Progress endpoints are authenticated via Todo 1's `JwtAuthGuard` (any authenticated role, not Admin-restricted — any student can mark their own chapters complete; authorization verified per-chapter ownership via `user_id`). Reuses Todo 1 (`User`, `JwtAuthGuard`, `HttpExceptionFilter`, `TypeOrmModule`), Todo 2 (`Course`, `Section`, `Chapter` entities), and Todo 3 (`StudentModule`). No changes to earlier Todo interfaces — Todo 4 adds a new `ChapterProgress` entity, a new `ProgressModule`, and new `/progress/*` routes.

**Tech Stack:** TypeScript, NestJS, TypeORM, PostgreSQL, class-validator (DTO validation), Vitest + Supertest (integration tests). New dependencies: none beyond existing stack — `ChapterProgress` is a new TypeORM entity + migration; `marked`/`sanitize-html` from Todo 3 are not needed here.

**Decision (documented):** Progress is calculated on-the-fly from chapter completion records (PRD §4.6: "Course progress percentages do not need to be stored independently. They should be calculated from chapter completion records.") — no separate `course_progress` percentage column or table. The `(user_id, chapter_id)` uniqueness invariant is enforced both at the database level (unique constraint) and in application validation (AGENTS.md §4.3 / product invariants). Progress is read-only for students except marking their own chapter complete via `POST /progress/chapters/:id/complete`; `GET /progress/courses/:id` returns aggregate course progress; `GET /progress/resume` returns last visited/in-progress chapter per course.

## Global Constraints

Copied verbatim from `docs/superp/PROJECT-CONSTITUTION.md`:

- All database columns and TypeORM entity properties use `snake_case` (e.g. `chapter_id`, `course_id`, `created_at`) — exact field names per the PRD Section 9 domain model.
- API request/response DTOs use `camelCase` field names (e.g. `chapterId`, `courseId`, `isCompleted`, `completedAt`) at the API boundary; TypeORM entities stay `snake_case` internally and are never exposed as API responses.
- REST resource paths are plural nouns: `/courses`, `/sections`, `/chapters`, `/users`, `/auth`, `/progress`.
- The `(user_id, chapter_id)` uniqueness invariant on `ChapterProgress` is enforced both at the database level (unique constraint) and in application validation.
- All responses use a consistent error envelope: `{ error: { code, message, details? } }` with appropriate HTTP status codes (400, 401, 403, 404, 409, 500).
- Authentication is bearer-token based; every protected endpoint checks authentication + role on the backend.
- OpenAPI spec documents every endpoint: auth requirements, authorization expectations, request parameters, request bodies, response schemas, error responses — kept in sync with DTOs.
- Database: PostgreSQL; ORM: TypeORM; migrations for every schema change (no `synchronize` in application environments).
- Testing: Vitest (unit/integration), Playwright (e2e).

Todo 4-specific rules derived from PRD §4.6:

- Progress endpoints require authentication (valid JWT) but NOT the Admin role; any authenticated user may manage their own progress.
- `POST /progress/chapters/:id/complete` marks a chapter as completed for the current user; returns the created/updated progress record; 404 if chapter not found; 409 if already completed (NFR-06 — safe against repeated requests).
- `GET /progress/courses/:id` returns course progress = completed chapters / total chapters × 100; 404 if course not found.
- `GET /progress/resume` returns the student's in-progress/last-visited chapter per course (the last chapter completed, or first uncompleted chapter).
- Marking a chapter complete on a course whose parent is unpublished is allowed (progress is independent of publication — PRD §4.6 says unpublishing preserves progress).
- Deleting a course/section/chapter cascades to dependent progress records (FK `ON DELETE CASCADE`).
- A course with no chapters has progress zero.

## Task Dependency Graph

```
Task 1 → (none)
Task 2 → Task 1
Task 3 → Task 2
Task 4 → Task 3
Task 5 → Task 4
Task 6 → Task 3, Task 5
Task 7 → Task 6
```

---

### Task 1: ChapterProgress entity + migration + unit test

**Priority:** Critical

**Depends on:** none

**Parallel-safe with:** none — foundation entity Tasks 2–5 depend on.

**Files:**
- Create: `apps/api/src/progress/chapter-progress.entity.ts` — `ChapterProgress` entity: `id`, `userId`, `chapterId`, `isCompleted`, `completedAt`; `user_id`/`chapter_id` unique constraint; FKs `ON DELETE CASCADE` to `users` and `chapters`.
- Create: `apps/api/src/database/migrations/create-chapter-progress-table.ts` — migration creating `chapter_progress` table with `user_id`, `chapter_id`, `is_completed`, `completed_at`, unique(`user_id`, `chapter_id`), FKs `ON DELETE CASCADE`.
- Create: `apps/api/src/progress/chapter-progress.entity.spec.ts` — Vitest unit tests: unique constraint on `(user_id, chapter_id)`, FK cascade on chapter deletion, `completedAt` set when `isCompleted = true`.

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: none.
- Produces: `ChapterProgress` entity + migration.

**Validation Method:** `tdd`
- Write failing Vitest unit tests; implement entity + migration; `npm test -- --run src/progress/chapter-progress.entity.spec.ts` exits 0.

**Acceptance Criteria:**
- `(user_id, chapter_id)` unique constraint at DB level.
- `chapter_id` FK `ON DELETE CASCADE` to `chapters` table.
- `user_id` FK `ON DELETE CASCADE` to `users` table.

- [ ] **Step 1:** Create ChapterProgress entity
- [ ] **Step 2:** Create migration
- [ ] **Step 3:** Entity/migration unit tests pass
- [ ] **Step 4: Commit**

---

### Task 2: ProgressService + spec

**Priority:** Critical

**Depends on:** Task 1

**Parallel-safe with:** Task 3 (ProgressController) — separate files; Task 3 depends on Task 2 only for wiring.

**Files:**
- Create: `apps/api/src/progress/progress.service.ts` — `ProgressService`:
  - `markComplete(userId: string, chapterId: string): Promise<ProgressDto>` — mark a chapter completed for the user; returns created/updated record; 404 if chapter not found; 409 if already completed.
  - `getCourseProgress(userId: string, courseId: string): Promise<CourseProgressDto>` — progress = completed chapters / total chapters × 100; 404 if course not found; course with no chapters → 0.
  - `getResume(userId: string): Promise<ResumeDto[]>` — per-course resume data (last completed chapter / next chapter to read).
  - `@Injectable()`, injects `ChapterProgressRepository`, `ChapterRepository`, `CourseRepository` via `@InjectRepository`.
- Create: `apps/api/src/progress/dto/progress.dto.ts` — `ProgressDto`, `CourseProgressDto`, `ResumeDto`, `ResumeChapterDto`.
- Test: `apps/api/src/progress/progress.service.spec.ts` — unit tests with mocked repositories: mark complete creates record, repeated mark is idempotent (409), course progress calculation, resume returns next chapter.

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: `ChapterProgress`, `Chapter`, `Course` entities (Todo 1/2); DTOs (this task).
- Produces: `ProgressService.markComplete`, `getCourseProgress`, `getResume`.

**Validation Method:** `tdd`
- Write failing Vitest unit tests with `@InjectRepository` mocks; implement service; `npm test -- --run src/progress/progress.service.spec.ts` exits 0.

**Acceptance Criteria:**
- `markComplete()` creates a progress record with `isCompleted = true` and `completedAt` set.
- Repeated `markComplete()` on same `(user_id, chapter_id)` returns 409 (idempotent, NFR-06).
- `getCourseProgress()` = completed / total × 100; course with no chapters → 0.
- `getResume()` returns per-course next chapter to read.

- [ ] **Step 1:** Write failing ProgressService unit tests
- [ ] **Step 2:** Create DTOs (`progress.dto.ts`)
- [ ] **Step 3:** Implement `progress.service.ts` with mark-complete + calculation
- [ ] **Step 4:** Service tests pass
- [ ] **Step 5: Commit**

---

### Task 3: ProgressController + spec

**Priority:** Critical

**Depends on:** Task 2

**Parallel-safe with:** none — controller imports service from Task 2; Task 5 wires module after controllers exist.

**Files:**
- Create: `apps/api/src/progress/progress.controller.ts` — `ProgressController`:
  - `@Controller('progress')`, `@UseGuards(JwtAuthGuard)` only (no `@Roles(ADMIN)` — any authenticated user).
  - `POST /progress/chapters/:id/complete` → `markComplete()` → `ProgressDto`; 404 if chapter not found; 409 if already completed.
  - `GET /progress/courses/:id` → `getCourseProgress()` → `CourseProgressDto`; 404 if course not found.
  - `GET /progress/resume` → `getResume()` → `ResumeDto[]`.
- Test: `apps/api/src/progress/progress.controller.spec.ts` — Supertest integration against in-memory NestJS app: authenticated → 200 + progress; unauthenticated → 401; already completed → 409; unknown chapter → 404.

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: `ProgressService` (Task 2); `JwtAuthGuard` (Todo 1); DTOs (Task 2).
- Produces: `POST /progress/chapters/:id/complete`, `GET /progress/courses/:id`, `GET /progress/resume` — authenticated, student-owned.

**Validation Method:** `contract-test`
- Supertest integration: mark complete → 200; repeat → 409; no token → 401; course progress → 200 with percentage.
- `npm test -- --run src/progress/progress.controller.spec.ts` exits 0.

**Acceptance Criteria:**
- Every progress endpoint requires authentication; no token → 401.
- No Admin role required; Student JWT → 200.
- Repeated mark-complete → 409 (idempotent).
- Error envelope `{ error: { code, message } }` on 401/404/409.

- [ ] **Step 1:** Write failing Supertest controller integration tests
- [ ] **Step 2:** Implement `progress.controller.ts`
- [ ] **Step 3:** Controller tests pass
- [ ] **Step 4: Commit**

---

### Task 4: ProgressModule wiring + AppModule registration + build

**Priority:** Critical

**Depends on:** Task 3

**Parallel-safe with:** none — modifies shared wiring files (`app.module.ts`, `typeorm.module.ts`) after service/controller exist.

**Files:**
- Create: `apps/api/src/progress/progress.module.ts` — `ProgressModule`: `imports: [TypeOrmModule.forFeature([ChapterProgress])]`, `providers: [ProgressService]`, `controllers: [ProgressController]`.
- Modify: `apps/api/src/database/typeorm.module.ts` — add `ChapterProgress` to `entities` array (for `forRoot`) and `forFeature([...])` (for `forFeature`).
- Modify: `apps/api/src/app.module.ts` — anchor: `imports: [ConfigModule, TypeormModule, AuthModule, UsersModule, CoursesModule, StudentModule]`; add `ProgressModule` to imports.

**Shared files (conflict risk):**
- `apps/api/src/database/typeorm.module.ts` — modified only by Task 4 (adds ChapterProgress to entities).
- `apps/api/src/app.module.ts` — modified only by Task 4 (adds ProgressModule).

**Interfaces:**
- Consumes: `ProgressService`, `ProgressController` (Task 3); `ChapterProgress` entity (Task 1); Todo 1's `AppModule`, `TypeormModule`.
- Produces: `ProgressModule` — registered in `AppModule`; progress API mounted at `/progress/*`.

**Validation Method:** `contract-test`
- `npx nest build` exits 0 (NestJS compiles, module wiring resolves).
- `npm test -- --run src/progress/progress.module.spec.ts` exits 0 (module imports resolve, providers instantiated).

**Acceptance Criteria:**
- `npx nest build` exits 0.
- `ProgressModule` imported in `AppModule`; `ChapterProgress` in `forFeature`.
- `typeorm.module.ts` includes `ChapterProgress` in entities.

- [ ] **Step 1:** Create `progress.module.ts` with forFeature + service + controller
- [ ] **Step 2:** Add `ChapterProgress` to `typeorm.module.ts` entities
- [ ] **Step 3:** Add `ProgressModule` to `app.module.ts` imports
- [ ] **Step 4:** `npx nest build` exits 0
- [ ] **Step 5: Commit**

---

### Task 5: Progress module spec + full suite

**Priority:** Critical

**Depends on:** Task 4

**Parallel-safe with:** none — runs after the full API exists.

**Files:**
- Create: `apps/api/src/progress/progress.module.spec.ts` — module wiring verification.
- Reuse: all existing specs (Todo 1/2/3) remain unchanged.

**Shared files (conflict risk):** none — new test file only.

**Interfaces:**
- Consumes: all progress endpoints (Task 3), Todo 1 auth (`JwtAuthGuard`).
- Produces: none (verification only).

**Validation Method:** `contract-test`
- `npm test -- --run src/progress/progress.module.spec.ts` exits 0.
- Full suite `npm test -- --run` exits 0 with zero failures.

**Acceptance Criteria:**
- Progress module instantiates correctly.
- Full `@lerna/api` Vitest suite exits 0.

- [ ] **Step 1:** Write progress module spec
- [ ] **Step 2:** Run full test suite (`npm test -- --run`) exits 0
- [ ] **Step 3: Commit**

---

### Task 6: Progress e2e smoke test

**Priority:** Critical

**Depends on:** Task 5

**Parallel-safe with:** none — runs after the full API exists.

**Files:**
- Create: `apps/api/test/progress.e2e.spec.ts` — end-to-end smoke test:
  - Student registers/logs in; obtains JWT.
  - `POST /progress/chapters/:id/complete` → 200 with progress record; repeat → 409.
  - `GET /progress/courses/:id` → 200 with percentage (completed/total × 100).
  - `GET /progress/resume` → 200 with resume data per course.
  - No token on any progress endpoint → 401.
  - Error envelope shape `{ error: { code, message } }` on 401/404/409.

**Shared files (conflict risk):** none — new test file only.

**Interfaces:**
- Consumes: all progress endpoints (Task 3), Todo 1 auth (`POST /auth/register`, `POST /auth/login`, `JwtAuthGuard`), Todo 2 chapters (for existing chapter IDs).
- Produces: none (verification only).

**Validation Method:** `contract-test`
- Full flow: register student → login → mark chapter complete (200) → repeat (409) → course progress (200) → resume (200) → no token (401).
- `npm test -- --run test/progress.e2e.spec.ts` exits 0.

**Acceptance Criteria:**
- Mark complete verified; repeat returns 409.
- Course progress percentage calculated correctly.
- Resume returns per-course next chapter.
- Unauthenticated → 401 on all progress endpoints.
- Error envelope verified.

- [ ] **Step 1:** Write progress e2e smoke test
- [ ] **Step 2:** Run e2e test exits 0
- [ ] **Step 3: Commit**

---

## Self-Review

**1. Spec coverage:** Every PRD §4.6 requirement maps to tasks: ChapterProgress entity (Task 1), mark-as-complete + progress calculation (Task 2/3), resume (Task 3/6), uniqueness + cascade (Task 1), no stored percentage (calculated on-the-fly, Task 2). Admin content endpoints untouched (Todo 2). Student read endpoints untouched (Todo 3). No gaps.

**2. Placeholder scan:** No TBD/TODO/"implement later"/vague criteria. All Acceptance Criteria are concrete input/output scenarios. All `Depends on` fields name exact task IDs. All `Shared files` fields name exact files or "none". No pasted test/implementation code. No pre-written commit messages.

**3. Type consistency:** DTO names (`ProgressDto`, `CourseProgressDto`, `ResumeDto`, `ResumeChapterDto`) consistent in Tasks 2–3. Service method names (`markComplete`, `getCourseProgress`, `getResume`) consistent in Tasks 2–3. Entity field names (`userId`, `chapterId`, `isCompleted`, `completedAt`) match PRD §4.6 Progress Data. `JwtAuthGuard`, `UserRole` from Todo 1 referenced correctly.

**4. Dependency graph consistency:** Header graph matches per-task `Depends on` exactly:
- Task 1 → none ✓
- Task 2 → Task 1 ✓
- Task 3 → Task 2 ✓
- Task 4 → Task 3 ✓
- Task 5 → Task 4 ✓
- Task 6 → Task 5 ✓
No cycles.

**5. Shared-file conflict scan:** Reverse index: `typeorm.module.ts` → Task 4 only; `app.module.ts` → Task 4 only; all other files created by exactly one task. No shared-file conflicts.

**6. Task granularity:** Each task is a single coherent deliverable (entity+migration, service+DTOs, controller, module wiring+build, module spec+full suite, e2e smoke test). No "and" joining unrelated outcomes. Each earns its own commit.

**7. Priority sanity:** Critical = all tasks (feature doesn't function without the entity + service + controller + wiring + tests). No High tasks in Todo 4.

**8. Definition of Done grounding:** Every line names an exact command: `npm test -- --run`, `npx nest build`, Supertest checks, `grep -rn "TODO\|TBD"`. All trace to specific tasks.

**9. Constitution alignment:** Global Constraints matches PROJECT-CONSTITUTION.md verbatim plus Todo 4-specific rules derived from PRD (§4.6 progress calculation, uniqueness, cascade, no stored percentage). No Step 4 patch needed (Todo 4 does not change any earlier Todo's interface — it adds a new `ChapterProgress` entity, `ProgressModule`, and new `/progress/*` routes, leaving Todo 1/2/3 controllers and entities untouched).

**10. Branch workflow:** Todo 4 work happens on `develop` branch; `main` is protected and must not be touched.

---

## Definition of Done

Project (Todo 4) is DONE when all of the following hold:

- [ ] `npx nest build` exits 0 (Task 4)
- [ ] `npm test -- --run src/progress/chapter-progress.entity.spec.ts` exits 0 — unique constraint, FK cascade (Task 1)
- [ ] `npm test -- --run src/progress/progress.service.spec.ts` exits 0 — mark complete, idempotent 409, progress calculation (Task 2)
- [ ] `npm test -- --run src/progress/progress.controller.spec.ts` exits 0 — mark complete 200, repeat 409, no token 401, course progress 200 (Task 3)
- [ ] `npm test -- --run src/progress/progress.module.spec.ts` exits 0 (Task 5)
- [ ] `npm test -- --run test/progress.e2e.spec.ts` exits 0 — full progress flow (Task 6)
- [ ] `npm test -- --run` (full `@lerna/api` Vitest suite) exits 0 with zero failures (Tasks 1–6)
- [ ] `grep -rn "TODO\|TBD" apps/api/src/progress docs/superp/plans/2026-11-07-todo-4-progress-tracking.md` returns nothing
- [ ] Every task above (1–6) is checked off and its own Acceptance Criteria verified

---

## Execution Handoff

Plan complete and saved to `docs/superp/plans/2026-11-07-todo-4-progress-tracking.md`.

Two execution options:

**1. Subagent-Driven** — dispatch a fresh subagent per task, one at a time in dependency order, with review between tasks.

**2. Inline Execution** — execute tasks in this session in topo order, one at a time, with checkpoints for review.

**Which approach?**

Note: once Todo 4 is fully executed and its own Definition of Done verified, per Step 5 of `decomposing-projects` I'll append Todo 4's produced interfaces to `PROJECT-INTERFACES.md` and update its row in `PROJECT-LEDGER.md` to `done` (commit range + plan file path). Todo 4 is not finished from the project's point of view until both are recorded.
