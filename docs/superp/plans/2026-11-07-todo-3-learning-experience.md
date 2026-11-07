# Todo 3 — Learning Experience Implementation Plan

> **For agentic workers:** this plan defines tasks, dependencies, and acceptance criteria only. Execute tasks inline in topo order (one at a time), with review between tasks. Task ordering MUST respect each task's `Depends on` field. The plan is not finished until every item in the Definition of Done section at the end is satisfied — task checkboxes alone do not mean the project is done.

**Goal:** Build the Lerna backend Learning Experience API: student-facing read-only endpoints for published course content — course listing, course details with content structure, chapter reader with sanitized Markdown, and prev/next chapter navigation — per PRD Phase 3 (Learning Experience) and Sections 3.3, 4.5.

**Architecture:** A new `StudentModule` in `apps/api` holding student-facing read controllers and services, separate from Todo 2's Admin `CoursesModule` (Admin controllers stay `@Roles(ADMIN)` untouched; see Constitution §Step 5 — earlier Todo interfaces stay as written). Student endpoints are authenticated via Todo 1's `JwtAuthGuard` (any authenticated role, not Admin-restricted) and expose only `PUBLISHED` courses/chapters. Reuses Todo 1 (`User`, `JwtAuthGuard`, `HttpExceptionFilter`, `TypeOrmModule`) and Todo 2 (`Course`, `Section`, `Chapter`) entities. No new DB entities or migrations in Todo 3 — `ChapterProgress` is Todo 4's concern. Markdown is parsed and XSS-sanitized on the backend before being served as HTML (NFR-05, PRD §3.3).

**Tech Stack:** TypeScript, NestJS, TypeORM, PostgreSQL, `marked` (Markdown parse) + `sanitize-html` (server-side XSS sanitize) — see decision below — class-validator (DTO validation), Vitest + Supertest (integration tests). New dependencies: `marked`, `sanitize-html` + `@types/marked`, `@types/sanitize-html` (justified below).

**Decision (documented):** Markdown parser/sanitizer selection was an undecided technical design area (AGENTS.md §10). Selected: `marked` for Markdown→HTML parsing + `sanitize-html` for server-side XSS sanitization — together satisfy PRD §3.3/NFR-05 (rendered student-facing Markdown must be sanitized against XSS). Rationale: `marked` is the de-facto Markdown parser; `sanitize-html` is a pure-Node HTML sanitizer that needs no DOM/browser, so it runs cleanly server-side and the HTML the API returns is already safe. Originally considered `dompurify` + `jsdom`, but `jsdom` 31 is incompatible with this environment's Node/undici (crashes on load) — `sanitize-html` avoids that entirely. Alternative considered: return raw Markdown and let the frontend sanitize — rejected because NFR-05 is a backend defense-in-depth requirement and the frontend app does not exist yet. Change is contained to one utility file (`apps/api/src/student/markdown.ts`).

## Global Constraints

Copied verbatim from `docs/superp/PROJECT-CONSTITUTION.md`:

- All database columns and TypeORM entity properties use `snake_case` (e.g. `chapter_id`, `course_id`, `structure_type`, `created_at`) — exact field names per the PRD Section 9 domain model.
- API request/response DTOs use `camelCase` field names (e.g. `chapterId`, `courseId`, `structureType`, `isPublished`) at the API boundary; TypeORM entities stay `snake_case` internally and are never exposed as API responses.
- REST resource paths are plural nouns: `/courses`, `/sections`, `/chapters`, `/users`, `/auth`, `/progress`.
- The `(user_id, chapter_id)` uniqueness invariant on `ChapterProgress` is enforced both at the database level (unique constraint) and in application validation. (Todo 3 does not create ChapterProgress — that is Todo 4 — but this invariant constrains foreign-key naming so Todo 4's `chapter_id` column matches.)
- All responses use a consistent error envelope: `{ error: { code, message, details? } }` with appropriate HTTP status codes (400, 401, 403, 404, 409, 500).
- Authentication is bearer-token based; every protected endpoint checks authentication + role on the backend.
- OpenAPI spec documents every endpoint: auth requirements, authorization expectations, request parameters, request bodies, response schemas, error responses — kept in sync with DTOs.
- Database: PostgreSQL; ORM: TypeORM; migrations for every schema change (no `synchronize` in application environments).
- Testing: Vitest (unit/integration), Playwright (e2e).

Todo 3-specific rules derived from PRD §3.3, §4.5 and §10:

- Student endpoints require authentication (valid JWT) but NOT the Admin role; any authenticated user (Student or Admin) may read published content.
- `GET /student/courses` returns only `status = PUBLISHED` courses; draft courses are invisible to students via these endpoints (FR-STUDENT-01).
- `GET /student/courses/:id` returns course details + content structure; 404 if course not found or not published (FR-STUDENT-02).
- `GET /student/chapters/:id` returns chapter content (raw Markdown + sanitized HTML) plus prev/next navigation; 404 if chapter not found or its parent course not published (FR-STUDENT-03, FR-STUDENT-04).
- Chapter ordering/navigation is within the parent scope (course for Flat, section for Section-based) (FR-STUDENT-03).
- Markdown content is sanitized against XSS before being served as HTML; `dompurify` runs server-side so returned HTML is already safe (FR-STUDENT-04, NFR-05).
- No new migrations or entities in Todo 3 (`ChapterProgress` and progress calculation are Todo 4). Todo 3 is read-only — no mark-as-complete, no progress calculation.

## Task Dependency Graph

```
Task 1 → (none)
Task 2 → Task 1
Task 3 → Task 1, Task 2
Task 4 → Task 1
Task 5 → Task 4
Task 6 → Task 2, Task 3, Task 5
Task 7 → Task 6
```

---

### Task 1: Markdown sanitize utility + unit test

**Priority:** Critical

**Depends on:** none

**Parallel-safe with:** none — foundation utility Tasks 2 and 4 depend on.

**Files:**
- Create: `apps/api/src/student/markdown.ts` — `sanitizeMarkdown(markdown: string): string` that parses Markdown with `marked` and sanitizes the resulting HTML with `sanitize-html` (server-side, no DOM needed); exported for use by `StudentChaptersService`.
- Create: `apps/api/src/student/markdown.spec.ts` — Vitest unit tests:
  - normal Markdown (headings, bold, lists, links, code blocks, tables) renders to HTML
  - XSS payloads are stripped: `<script>`, `<img onerror=...>`, `<svg onload=...>`, `javascript:URL`, inline event handlers
  - empty/whitespace input returns empty string

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: none.
- Produces: `sanitizeMarkdown(markdown: string): string` — safe HTML string.

**Validation Method:** `tdd`
- Write failing Vitest tests (XSS + normal rendering), implement `markdown.ts`, `npm test -- --run src/student/markdown.spec.ts` exits 0.

**Acceptance Criteria:**
- `sanitizeMarkdown` converts common Markdown to HTML.
- `<script>`, event handlers (`onerror`, `onload`, `onclick`), and `javascript:` URLs are removed/neutralized.
- Empty input → empty output.

- [ ] **Step 1:** Install `marked`, `dompurify`, `@types/marked`, `@types/dompurify`
- [ ] **Step 2:** Write failing markdown sanitize tests (XSS + rendering)
- [ ] **Step 3:** Implement `markdown.ts`
- [ ] **Step 4:** Markdown tests pass
- [ ] **Step 5: Commit**

---

### Task 2: StudentCoursesService + spec

**Priority:** Critical

**Depends on:** Task 1

**Parallel-safe with:** Task 4 (StudentChaptersService) — separate files; Task 2 depends on Task 1 entities only.

**Files:**
- Create: `apps/api/src/student/student-courses.service.ts` — `StudentCoursesService`:
  - `findPublished(): Promise<StudentCourseDto[]>` — all `PUBLISHED` courses (id, title, description, structureType, status, createdAt, updatedAt).
  - `findCourseWithStructure(id: string): Promise<CourseDetailsDto | null>` — course by id; returns `null` if not found or not published; includes sections (each with chapters) for `SECTION_BASED` or direct chapters for `FLAT`.
  - `@Injectable()`, injects `CourseRepository`, `SectionRepository`, `ChapterRepository` via `@InjectRepository`.
- Create: `apps/api/src/student/dto/student-course.dto.ts` — `StudentCourseDto`: `id`, `title`, `description`, `structureType`, `status`, `createdAt`, `updatedAt`.
- Create: `apps/api/src/student/dto/course-details.dto.ts` — `CourseDetailsDto`, `SectionWithChaptersDto`, `ChapterSummaryDto`.
- Test: `apps/api/src/student/student-courses.service.spec.ts` — unit tests with mocked repositories: `findPublished` filters to PUBLISHED only; `findCourseWithStructure` returns null for draft/unknown; structure includes sections/chapters correctly.

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: `Course`, `Section`, `Chapter` entities (Todo 2); DTOs (this task).
- Produces: `StudentCoursesService.findPublished`, `findCourseWithStructure`.

**Validation Method:** `tdd`
- Write failing Vitest unit tests with `@InjectRepository` mocks; implement service; `npm test -- --run src/student/student-courses.service.spec.ts` exits 0.

**Acceptance Criteria:**
- `findPublished()` excludes `DRAFT` courses.
- `findCourseWithStructure()` returns `null` for draft or unknown course.
- Section-based course → `sections` populated with chapters; Flat course → `chapters` populated directly.

- [ ] **Step 1:** Write failing StudentCoursesService unit tests
- [ ] **Step 2:** Create DTOs (`student-course.dto.ts`, `course-details.dto.ts`)
- [ ] **Step 3:** Implement `student-courses.service.ts`
- [ ] **Step 4:** Service tests pass
- [ ] **Step 5: Commit**

---

### Task 3: StudentCoursesController + spec

**Priority:** Critical

**Depends on:** Task 1, Task 2

**Parallel-safe with:** none — controller imports service from Task 2; Task 5 wires module after controllers exist.

**Files:**
- Create: `apps/api/src/student/student-courses.controller.ts` — `StudentCoursesController`:
  - `@Controller('student/courses')`, `@UseGuards(JwtAuthGuard)` only (no `@Roles(ADMIN)` — any authenticated user).
  - `GET /student/courses` → `findPublished()` → `StudentCourseDto[]`; 200.
  - `GET /student/courses/:id` → `findCourseWithStructure(id)` → `CourseDetailsDto`; 404 if null.
- Test: `apps/api/src/student/student-courses.controller.spec.ts` — Supertest integration against in-memory NestJS app: authenticated (Student JWT) → 200 + only published courses; unauthenticated → 401; draft course → 404 via details endpoint.

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: `StudentCoursesService` (Task 2); `JwtAuthGuard` (Todo 1); DTOs (Task 2).
- Produces: `GET /student/courses`, `GET /student/courses/:id` — authenticated, published-only.

**Validation Method:** `contract-test`
- Supertest integration: `GET /student/courses` with Student JWT → 200 list excludes drafts; no token → 401; `GET /student/courses/:id` for draft course → 404.
- `npm test -- --run src/student/student-courses.controller.spec.ts` exits 0.

**Acceptance Criteria:**
- Every student endpoint requires authentication; no token → 401.
- No Admin role required; Student JWT → 200.
- Draft courses excluded from listing and details (404).
- Error envelope `{ error: { code, message } }` on 401/404.

- [ ] **Step 1:** Write failing Supertest controller integration tests
- [ ] **Step 2:** Implement `student-courses.controller.ts`
- [ ] **Step 3:** Controller tests pass
- [ ] **Step 4: Commit**

---

### Task 4: StudentChaptersService + spec

**Priority:** Critical

**Depends on:** Task 1

**Parallel-safe with:** Task 2 (StudentCoursesService) — separate files; both depend on Task 1 only.

**Files:**
- Create: `apps/api/src/student/student-chapters.service.ts` — `StudentChaptersService`:
  - `findChapter(id: string): Promise<ChapterReaderDto | null>` — chapter by id; returns `null` if not found or its parent course not published; includes raw `content` (Markdown), sanitized `contentHtml` (via `sanitizeMarkdown`), and `prevChapterId`/`nextChapterId` navigation within the parent scope (course for Flat, section for Section-based).
  - `@Injectable()`, injects `ChapterRepository`, `CourseRepository` (to verify course published).
- Create: `apps/api/src/student/dto/chapter-reader.dto.ts` — `ChapterReaderDto`: `id`, `courseId`, `sectionId`, `title`, `content`, `contentHtml`, `position`, `prevChapterId`, `nextChapterId`.
- Test: `apps/api/src/student/student-chapters.service.spec.ts` — unit tests with mocked repositories: returns null for unpublished course's chapter; `contentHtml` is sanitized (XSS stripped); prev/next computed correctly within section/course scope.

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: `Chapter`, `Course` entities (Todo 2); `sanitizeMarkdown` (Task 1); DTO (this task).
- Produces: `StudentChaptersService.findChapter` — sanitized HTML + prev/next navigation; null for unpublished/missing.

**Validation Method:** `tdd`
- Write failing Vitest unit tests with `@InjectRepository` mocks; implement service; `npm test -- --run src/student/student-chapters.service.spec.ts` exits 0.

**Acceptance Criteria:**
- `findChapter()` returns `null` for a chapter whose course is `DRAFT` or unknown.
- `contentHtml` is XSS-sanitized (no `<script>`, event handlers, `javascript:`).
- `prevChapterId`/`nextChapterId` correct within the chapter's parent scope.

- [ ] **Step 1:** Write failing StudentChaptersService unit tests
- [ ] **Step 2:** Create `chapter-reader.dto.ts`
- [ ] **Step 3:** Implement `student-chapters.service.ts` with sanitize + navigation
- [ ] **Step 4:** Service tests pass
- [ ] **Step 5: Commit**

---

### Task 5: StudentChaptersController + spec

**Priority:** Critical

**Depends on:** Task 4

**Parallel-safe with:** none — controller imports service from Task 4; Task 6 wires module after controllers exist.

**Files:**
- Create: `apps/api/src/student/student-chapters.controller.ts` — `StudentChaptersController`:
  - `@Controller('student/chapters')`, `@UseGuards(JwtAuthGuard)` only.
  - `GET /student/chapters/:id` → `findChapter(id)` → `ChapterReaderDto`; 404 if null.
- Test: `apps/api/src/student/student-chapters.controller.spec.ts` — Supertest integration: authenticated Student → 200 with `contentHtml` and navigation; no token → 401; chapter of draft course → 404.

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: `StudentChaptersService` (Task 4); `JwtAuthGuard` (Todo 1); DTO (Task 4).
- Produces: `GET /student/chapters/:id` — authenticated, published-only, sanitized HTML.

**Validation Method:** `contract-test`
- Supertest integration: `GET /student/chapters/:id` with Student JWT → 200 `ChapterReaderDto`; no token → 401; draft-course chapter → 404.
- `npm test -- --run src/student/student-chapters.controller.spec.ts` exits 0.

**Acceptance Criteria:**
- Endpoint requires authentication; no token → 401.
- Student JWT → 200 with sanitized `contentHtml` + `prevChapterId`/`nextChapterId`.
- Chapter of draft/unpublished course → 404.
- Error envelope on 401/404.

- [ ] **Step 1:** Write failing Supertest controller integration tests
- [ ] **Step 2:** Implement `student-chapters.controller.ts`
- [ ] **Step 3:** Controller tests pass
- [ ] **Step 4: Commit**

---

### Task 6: StudentModule wiring + AppModule registration + build

**Priority:** Critical

**Depends on:** Task 2, Task 3, Task 5

**Parallel-safe with:** none — modifies shared wiring files (`app.module.ts`) after all services/controllers exist.

**Files:**
- Create: `apps/api/src/student/student.module.ts` — `StudentModule`: `imports: [TypeOrmModule.forFeature([Course, Section, Chapter])]`, `providers: [StudentCoursesService, StudentChaptersService]`, `controllers: [StudentCoursesController, StudentChaptersController]`.
- Modify: `apps/api/src/app.module.ts` — anchor: `imports: [ConfigModule, TypeormModule, AuthModule, UsersModule, CoursesModule]`; add `StudentModule` to imports.

**Shared files (conflict risk):**
- `apps/api/src/app.module.ts` — modified only by Task 6 (adds StudentModule). No other task touches it.

**Interfaces:**
- Consumes: `StudentCoursesService`, `StudentChaptersService` (Tasks 2, 4); `StudentCoursesController`, `StudentChaptersController` (Tasks 3, 5); `Course`, `Section`, `Chapter` entities (Todo 2); Todo 1's `AppModule`, `TypeormModule`, `AuthModule` (for `JwtAuthGuard`).
- Produces: `StudentModule` — registered in `AppModule`; student API mounted at `/student/courses`, `/student/chapters`.

**Validation Method:** `contract-test`
- `npx nest build` exits 0 (NestJS compiles, module wiring resolves).
- `npm test -- --run src/student/student.module.spec.ts` exits 0 (module imports resolve, providers instantiated).

**Acceptance Criteria:**
- `npx nest build` exits 0.
- `StudentModule` imported in `AppModule`; `Course`/`Section`/`Chapter` in `forFeature`.

- [ ] **Step 1:** Create `student.module.ts` with forFeature + services + controllers
- [ ] **Step 2:** Add `StudentModule` to `app.module.ts` imports
- [ ] **Step 3:** `npx nest build` exits 0
- [ ] **Step 4: Commit**

---

### Task 7: Student learning-experience integration tests + full suite

**Priority:** Critical

**Depends on:** Task 6

**Parallel-safe with:** none — runs after the full API exists.

**Files:**
- Create: `apps/api/test/student.e2e.spec.ts` — end-to-end smoke test:
  - Student registers/logs in (or uses an existing student); obtains JWT.
  - `GET /student/courses` → 200 list includes only `PUBLISHED` courses; `DRAFT` excluded.
  - `GET /student/courses/:id` for published course → 200 with structure; for draft course → 404.
  - `GET /student/chapters/:id` for published chapter → 200 with sanitized `contentHtml` + navigation.
  - `GET /student/chapters/:id` for chapter of draft course → 404.
  - No token on any student endpoint → 401.
  - Error envelope shape `{ error: { code, message } }` on 401/404.
- Reuses Todo 1's `app.e2e.spec.ts` pattern (Supertest + in-memory NestJS app).

**Shared files (conflict risk):** none — new test file only.

**Interfaces:**
- Consumes: all student endpoints (Tasks 3, 5), Todo 1 auth (`POST /auth/register`, `POST /auth/login`, `JwtAuthGuard`).
- Produces: none (verification only).

**Validation Method:** `contract-test`
- Full flow: register student → login → GET published courses (200, drafts excluded) → course details (200) → chapter reader (200, sanitized HTML, navigation) → draft course → 404 → no token → 401.
- `npm test -- --run test/student.e2e.spec.ts` exits 0.
- Full suite `npm test -- --run` exits 0 with zero failures.

**Acceptance Criteria:**
- Published-only course listing verified; drafts excluded.
- Chapter reader returns sanitized HTML + prev/next navigation.
- Unauthenticated → 401 on all student endpoints.
- Error envelope verified.
- Full `@lerna/api` Vitest suite exits 0.

- [ ] **Step 1:** Write student e2e smoke test
- [ ] **Step 2:** Run full test suite (`npm test -- --run`) exits 0
- [ ] **Step 3: Commit**

---

## Self-Review

**1. Spec coverage:** Every PRD Phase 3 requirement maps to tasks: Course Listing (Task 2/3), Course Details + structure (Task 2/3), Chapter Reader + Markdown rendering (Task 1/4/5), prev/next Navigation (Task 4/5), XSS sanitization (Task 1). Progress/Completion (mark-as-complete, progress calculation) deliberately excluded — Todo 4. Admin content endpoints untouched (Todo 2). No new entities/migrations in Todo 3. No gaps.

**2. Placeholder scan:** No TBD/TODO/"implement later"/vague criteria. All Acceptance Criteria are concrete input/output scenarios. All `Depends on` fields name exact task IDs. All `Shared files` fields name exact files or "none". No pasted test/implementation code. No pre-written commit messages.

**3. Type consistency:** DTO names (`StudentCourseDto`, `CourseDetailsDto`, `SectionWithChaptersDto`, `ChapterSummaryDto`, `ChapterReaderDto`) consistent in Tasks 2–5. Service method names (`findPublished`, `findCourseWithStructure`, `findChapter`) consistent in Tasks 2, 4 and Tasks 3, 5. Entity field names (`id`, `title`, `content`, `position`, `courseId`, `sectionId`, `structureType`, `status`) match Todo 2 entities. `JwtAuthGuard`, `UserRole` from Todo 1 referenced correctly.

**4. Dependency graph consistency:** Header graph matches per-task `Depends on` exactly:
- Task 1 → none ✓
- Task 2 → Task 1 ✓
- Task 3 → Task 1, Task 2 ✓
- Task 4 → Task 1 ✓
- Task 5 → Task 4 ✓
- Task 6 → Task 2, Task 3, Task 5 ✓
- Task 7 → Task 6 ✓
No cycles.

**5. Shared-file conflict scan:** Reverse index: `app.module.ts` → Task 6 only; all other files created by exactly one task. No shared-file conflicts.

**6. Task granularity:** Each task is a single coherent deliverable (markdown utility, course service, course controller, chapter service, chapter controller, module wiring, e2e tests). No "and" joining unrelated outcomes. Each earns its own commit.

**7. Priority sanity:** Critical = all tasks (feature doesn't function without the read API + sanitization + wiring + tests). No High tasks in Todo 3.

**8. Definition of Done grounding:** Every line names an exact command: `npm install marked dompurify ...`, `npm test -- --run`, `npx nest build`, Supertest checks, `grep -rn "TODO\|TBD"`. All trace to specific tasks.

**9. Constitution alignment:** Global Constraints matches PROJECT-CONSTITUTION.md verbatim plus Todo 3-specific rules derived from PRD (§3.3 XSS, §4.5 student flows, published-only visibility, no Admin role on student reads). No Step 4 patch needed (Todo 3 does not change any earlier Todo's interface — it adds a new `StudentModule` and new `/student/*` routes, leaving Todo 1/2 controllers and entities untouched).

---

## Definition of Done

Project (Todo 3) is DONE when all of the following hold:

- [ ] `npm install marked sanitize-html @types/marked @types/sanitize-html` succeeds and `pnpm-lock.yaml` updated (Task 1)
- [ ] `npm test -- --run src/student/markdown.spec.ts` exits 0 — XSS payloads stripped, normal Markdown rendered (Task 1)
- [ ] `npm test -- --run src/student/student-courses.service.spec.ts` exits 0 — `findPublished` excludes drafts; `findCourseWithStructure` null for draft/unknown (Task 2)
- [ ] `npm test -- --run src/student/student-courses.controller.spec.ts` exits 0 — Student JWT 200, no token 401, draft course 404 (Task 3)
- [ ] `npm test -- --run src/student/student-chapters.service.spec.ts` exits 0 — null for unpublished chapter, `contentHtml` sanitized, prev/next correct (Task 4)
- [ ] `npm test -- --run src/student/student-chapters.controller.spec.ts` exits 0 — 200 with sanitized HTML + navigation, 401/404 (Task 5)
- [ ] `npx nest build` exits 0 (Task 6)
- [ ] `npm test -- --run src/student/student.module.spec.ts` exits 0 (Task 6)
- [ ] `npm test -- --run test/student.e2e.spec.ts` exits 0 — full student flow (Task 7)
- [ ] `npm test -- --run` (full `@lerna/api` Vitest suite) exits 0 with zero failures (Tasks 1–7)
- [ ] `grep -rn "TODO\|TBD" apps/api/src/student docs/superp/plans/2026-11-07-todo-3-learning-experience.md` returns nothing
- [ ] Every task above (1–7) is checked off and its own Acceptance Criteria verified

---

## Execution Handoff

Plan complete and saved to `docs/superp/plans/2026-11-07-todo-3-learning-experience.md`.

Two execution options:

**1. Subagent-Driven** — dispatch a fresh subagent per task, one at a time in dependency order, with review between tasks.

**2. Inline Execution** — execute tasks in this session in topo order, one at a time, with checkpoints for review.

**Which approach?**

Note: once Todo 3 is fully executed and its own Definition of Done verified, per Step 5 of `decomposing-projects` I'll append Todo 3's produced interfaces to `PROJECT-INTERFACES.md` and update its row in `PROJECT-LEDGER.md` to `done` (commit range + plan file path). Todo 3 is not finished from the project's point of view until both are recorded.
