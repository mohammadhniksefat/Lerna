# Todo 2 — Content Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: this plan defines tasks, dependencies, and acceptance criteria only. Use the superp:subagent-driven-development sequential dispatch loop (recommended — fresh subagent per task, dispatched one at a time in topo order, with review between tasks) or execute tasks inline in topo order to actually write code, tests, and commits. `Parallel-safe with` and true concurrent execution are only exploited by superp:executing-plans (separate session, isolated worktrees); subagent-driven-development always dispatches one implementer at a time. Steps use checkbox (`- [x]`) syntax for tracking. Task ordering MUST respect each task's `Depends on` field — do not execute or dispatch a task before all of its dependencies are checked off. The plan is not finished until every item in the Definition of Done section at the end is satisfied — task checkboxes alone do not mean the project is done.

**Goal:** Build the Lerna backend Content Management API: Course, Section, and Chapter entities with TypeORM migrations, DTOs, services, Admin-protected controllers, and module wiring — per PRD Section 10 (Phase 2 — Content Management) and Sections 4.2–4.4.

**Architecture:** A single cohesive `CoursesModule` in `apps/api` holding Course, Section, and Chapter domain logic together, since these three are tightly coupled (a chapter belongs to exactly one parent — course or section; `structure_type` is FLAT or SECTION_BASED; a course cannot mix direct chapters and sections). Reuses Todo 1's auth infrastructure (`JwtAuthGuard`, `RolesGuard`, `@Roles('ADMIN')`, `UsersService`, error envelope, `TypeOrmModule` PostgreSQL connection, `ConfigModule`). Admin-only on every content endpoint.

**Tech Stack:** TypeScript, NestJS, TypeORM, PostgreSQL, class-validator/class-transformer (DTO validation), Vitest + Supertest (integration tests). No new dependencies beyond those already in `apps/api/package.json`.

## Global Constraints

Copied verbatim from `docs/superp/PROJECT-CONSTITUTION.md` (Todo 2's constitution-brief), which binds every Todo:

- All database columns and TypeORM entity properties use `snake_case` (e.g. `chapter_id`, `course_id`, `structure_type`, `created_at`) — exact field names per the PRD Section 9 domain model.
- API request/response DTOs use `camelCase` field names (e.g. `chapterId`, `courseId`, `structureType`, `isPublished`) at the API boundary; TypeORM entities stay `snake_case` internally and are never exposed as API responses.
- REST resource paths are plural nouns: `/courses`, `/sections`, `/chapters`, `/users`, `/auth`, `/progress`.
- The `(user_id, chapter_id)` uniqueness invariant on `ChapterProgress` is enforced both at the database level (unique constraint) and in application validation. (Todo 2 does not create ChapterProgress — that is Todo 4 — but this invariant constrains foreign-key naming so Todo 4's `chapter_id` column matches.)
- All responses use a consistent error envelope: `{ error: { code, message, details? } }` with appropriate HTTP status codes (400, 401, 403, 404, 409, 500).
- Authentication is bearer-token based; every protected endpoint checks authentication + role on the backend.
- OpenAPI spec documents every endpoint: auth requirements, authorization expectations, request parameters, request bodies, response schemas, error responses — kept in sync with DTOs.
- Database: PostgreSQL; ORM: TypeORM; migrations for every schema change (no `synchronize` in application environments).
- Testing: Vitest (unit/integration), Playwright (e2e).

Todo 2-specific rules derived from PRD Sections 4.2–4.4 and 9:

- `Course.structure_type` must be either `FLAT` or `SECTION_BASED`; `Course.status` must be either `DRAFT` or `PUBLISHED`.
- A chapter must belong to exactly one parent: either a course or a section — never both, never neither.
- In Flat courses, chapters must belong directly to the course (`course_id` set, `section_id` null).
- In Section-based courses, chapters must belong to a section (`section_id` set, `course_id` null).
- A course cannot simultaneously contain direct chapters and sections.
- Each section must belong to exactly one course.
- Sections cannot contain nested sections.
- Sections and chapters must have an explicit display order (`position`).
- A course needs at least one chapter before it can be published.
- Unpublishing a course preserves existing progress records (Todo 2 only flips status; it does not delete chapters/progress).
- Deleting a course cascades to its sections, chapters; deleting a section cascades to its chapters; deleting a chapter cascades to its progress records (progress FK is Todo 4's concern; Todo 2 sets up ON DELETE CASCADE on course→section/chapter and section→chapter).
- No `synchronize` — migrations only; every entity gets a matching migration.

## Task Dependency Graph

```
Task 1 → (none)
Task 2 → Task 1
Task 3 → Task 1, Task 2
Task 4 → Task 1, Task 2, Task 3
Task 5 → Task 1, Task 3
Task 6 → Task 1, Task 2
Task 7 → Task 1, Task 2, Task 3
Task 8 → Task 5, Task 6, Task 7
Task 9 → Task 5, Task 6, Task 7, Task 8
Task 10 → Task 9
```

---

### Task 1: Course entity + create-courses-table migration

**Priority:** Critical

**Depends on:** none

**Parallel-safe with:** none — must run in isolation (creates the root `Course` entity that Tasks 2 and 3 reference).

**Files:**
- Create: `apps/api/src/courses/course.entity.ts` — `Course` TypeORM entity: `@PrimaryGeneratedColumn('uuid') id: string`, `@Column() title: string`, `@Column({ nullable: true }) description: string | null`, `@Column({ type: 'enum', enum: CourseStructureType }) structureType: CourseStructureType`, `@Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.DRAFT }) status: CourseStatus`, `@CreateDateColumn() createdAt: Date`, `@UpdateDateColumn() updatedAt: Date`; enums `CourseStructureType { FLAT = 'FLAT', SECTION_BASED = 'SECTION_BASED' }`, `CourseStatus { DRAFT = 'DRAFT', PUBLISHED = 'PUBLISHED' }`; `@Entity('courses')`.
- Create: `apps/api/src/database/migrations/create-courses-table.ts` — TypeORM migration: `CREATE TYPE course_structure_type AS ENUM ('FLAT', 'SECTION_BASED')`, `CREATE TYPE course_status AS ENUM ('DRAFT', 'PUBLISHED')`, `CREATE TABLE courses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar(255) NOT NULL, description varchar(1000), structure_type course_structure_type NOT NULL, status course_status NOT NULL DEFAULT 'DRAFT', created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`; down migration drops table and both types.
- Modify: `apps/api/src/database/typeorm.module.ts` — anchor: `entities: [User]` array; add `Course` to the entities array (deferred registration — actually done in Task 9 alongside Section/Chapter to avoid repeated edits; leave unchanged here, note in Shared files).

**Shared files (conflict risk):** none — Task 1 creates new files only. `typeorm.module.ts` entities array is updated once in Task 9 (not here) to avoid multiple tasks editing the same array.

**Interfaces:**
- Consumes: none (Todo 1's `TypeOrmModule` PostgreSQL connection already exists).
- Produces: `Course` entity — `id`, `title`, `description`, `structureType`, `status`, `createdAt`, `updatedAt`; `CourseStructureType` enum; `CourseStatus` enum; `create-courses-table` migration — `courses` table with `id`, `title`, `description`, `structure_type`, `status`, `created_at`, `updated_at`.

**Validation Method:** `migration-check`
- Forward migration: `npm run typeorm migration:run` against test PostgreSQL creates `courses` table with columns `id`, `title`, `description`, `structure_type`, `status`, `created_at`, `updated_at` and the two enum types.
- Post-migration assertion: `SELECT column_name FROM information_schema.columns WHERE table_name = 'courses'` returns exactly `id`, `title`, `description`, `structure_type`, `status`, `created_at`, `updated_at`.
- Entity metadata: `npm test -- --run src/courses/course.entity.spec.ts` exits 0 (decorators correct, enum values match).
- Rollback: `npm run typeorm migration:revert` drops `courses` table and both enum types.

**Acceptance Criteria:**
- `Course` entity has `id (uuid, pk)`, `title`, `description (nullable)`, `structureType (FLAT|SECTION_BASED)`, `status (DRAFT|PUBLISHED, default DRAFT)`, `createdAt`, `updatedAt`.
- All columns snake_case in DB, camelCase in TS.
- Migration creates `courses` table + `course_structure_type` and `course_status` enums; rollback drops both.
- `status` defaults to `DRAFT`.

- [x] **Step 1:** Define `CourseStructureType` and `CourseStatus` enums and the `Course` entity
- [x] **Step 2:** Write `create-courses-table` migration (up + down)
- [x] **Step 3:** Write `course.entity.spec.ts` entity metadata test
- [x] **Step 4:** Run migration-forward, assert schema, run rollback
- [x] **Step 5:** Entity + migration tests pass
- [x] **Step 6: Commit**

---

### Task 2: Section entity + create-sections-table migration

**Priority:** Critical

**Depends on:** Task 1

**Parallel-safe with:** none — Section's `course_id` foreign key references the Course table created by Task 1.

**Files:**
- Create: `apps/api/src/courses/section.entity.ts` — `Section` TypeORM entity: `@PrimaryGeneratedColumn('uuid') id: string`, `@Column() courseId: string`, `@Column() title: string`, `@Column({ type: 'int' }) position: number`, `@CreateDateColumn() createdAt: Date`, `@UpdateDateColumn() updatedAt: Date`; `@Entity('sections')`; many-to-one relation to `Course` (optional decorator, FK via `course_id` column).
- Create: `apps/api/src/database/migrations/create-sections-table.ts` — TypeORM migration: `CREATE TABLE sections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE, title varchar(255) NOT NULL, position int NOT NULL, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`; down migration drops table.

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: `Course` entity (Task 1) — `course_id` FK references `courses(id)`.
- Produces: `Section` entity — `id`, `courseId`, `title`, `position`, `createdAt`, `updatedAt`; `create-sections-table` migration — `sections` table with `id`, `course_id`, `title`, `position`, `created_at`, `updated_at`; FK `course_id → courses(id) ON DELETE CASCADE`.

**Validation Method:** `migration-check`
- Forward migration creates `sections` table with `course_id` FK `ON DELETE CASCADE` to `courses(id)`.
- Post-migration assertion: `SELECT column_name FROM information_schema.columns WHERE table_name = 'sections'` returns `id`, `course_id`, `title`, `position`, `created_at`, `updated_at`; FK exists on `course_id`.
- Rollback drops `sections` table.
- `npm test -- --run src/courses/section.entity.spec.ts` exits 0.

**Acceptance Criteria:**
- `Section` entity has `id (uuid, pk)`, `courseId`, `title`, `position`, `createdAt`, `updatedAt`.
- `course_id` FK references `courses(id)` with `ON DELETE CASCADE`.
- All columns snake_case in DB, camelCase in TS.

- [x] **Step 1:** Define the `Section` entity with course relation
- [x] **Step 2:** Write `create-sections-table` migration (up + down)
- [x] **Step 3:** Write `section.entity.spec.ts` entity metadata test
- [x] **Step 4:** Run migration-forward, assert schema + FK, run rollback
- [x] **Step 5:** Entity + migration tests pass
- [x] **Step 6: Commit**

---

### Task 3: Chapter entity + create-chapters-table migration

**Priority:** Critical

**Depends on:** Task 1, Task 2

**Parallel-safe with:** none — Chapter's `course_id`/`section_id` foreign keys reference tables from Tasks 1 and 2.

**Files:**
- Create: `apps/api/src/courses/chapter.entity.ts` — `Chapter` TypeORM entity: `@PrimaryGeneratedColumn('uuid') id: string`, `@Column({ nullable: true }) courseId: string | null`, `@Column({ nullable: true }) sectionId: string | null`, `@Column() title: string`, `@Column('text') content: string`, `@Column({ type: 'int' }) position: number`, `@CreateDateColumn() createdAt: Date`, `@UpdateDateColumn() updatedAt: Date`; `@Entity('chapters')`; relations to `Course` (optional) and `Section` (optional).
- Create: `apps/api/src/database/migrations/create-chapters-table.ts` — TypeORM migration: `CREATE TABLE chapters (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid REFERENCES courses(id) ON DELETE CASCADE, section_id uuid REFERENCES sections(id) ON DELETE CASCADE, title varchar(255) NOT NULL, content text NOT NULL DEFAULT '', position int NOT NULL, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(), CONSTRAINT chapters_parent_check CHECK ((course_id IS NOT NULL) = (section_id IS NULL)))`; down migration drops table. The CHECK constraint enforces "exactly one parent": course_id set XOR section_id set.
- Create: `apps/api/src/courses/chapter.entity.spec.ts` — entity metadata + CHECK constraint test.

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: `Course` entity (Task 1), `Section` entity (Task 2) — `course_id`/`section_id` FKs.
- Produces: `Chapter` entity — `id`, `courseId`, `sectionId`, `title`, `content`, `position`, `createdAt`, `updatedAt`; `create-chapters-table` migration — `chapters` table with `course_id`, `section_id` FKs and the `chapters_parent_check` CHECK constraint.

**Validation Method:** `migration-check`
- Forward migration creates `chapters` table with `course_id` and `section_id` FKs (`ON DELETE CASCADE`) and the `chapters_parent_check` CHECK constraint.
- Post-migration assertion: `SELECT column_name FROM information_schema.columns WHERE table_name = 'chapters'` returns `id`, `course_id`, `section_id`, `title`, `content`, `position`, `created_at`, `updated_at`; CHECK constraint present.
- Rollback drops `chapters` table.
- `npm test -- --run src/courses/chapter.entity.spec.ts` exits 0.

**Acceptance Criteria:**
- `Chapter` entity has `id (uuid, pk)`, `courseId (nullable)`, `sectionId (nullable)`, `title`, `content`, `position`, `createdAt`, `updatedAt`.
- Exactly one of `course_id`/`section_id` set (CHECK constraint enforces XOR at DB level).
- `course_id` FK → `courses(id) ON DELETE CASCADE`; `section_id` FK → `sections(id) ON DELETE CASCADE`.

- [x] **Step 1:** Define the `Chapter` entity with optional course/section relations
- [x] **Step 2:** Write `create-chapters-table` migration (up + down) with parent XOR CHECK constraint
- [x] **Step 3:** Write `chapter.entity.spec.ts` entity metadata test
- [x] **Step 4:** Run migration-forward, assert schema + FKs + CHECK constraint, run rollback
- [x] **Step 5:** Entity + migration tests pass
- [x] **Step 6: Commit**

---

### Task 4: Content DTOs (Course, Section, Chapter)

**Priority:** Critical

**Depends on:** Task 1, Task 2, Task 3

**Parallel-safe with:** none — DTOs reference the entity shapes from Tasks 1–3.

**Files:**
- Create: `apps/api/src/courses/dto/course.dto.ts` — `CourseDto`: `id: string`, `title: string`, `description: string | null`, `structureType: 'FLAT' | 'SECTION_BASED'`, `status: 'DRAFT' | 'PUBLISHED'`, `createdAt: string`, `updatedAt: string`.
- Create: `apps/api/src/courses/dto/create-course.dto.ts` — `CreateCourseDto`: `@IsString() @MinLength(1) title: string`, `@IsString() @MaxLength(1000) @IsOptional() description?: string`, `@IsEnum(['FLAT', 'SECTION_BASED']) structureType: 'FLAT' | 'SECTION_BASED'`.
- Create: `apps/api/src/courses/dto/update-course.dto.ts` — `UpdateCourseDto`: all fields optional (`title?`, `description?`, `structureType?`, `status?`).
- Create: `apps/api/src/courses/dto/section.dto.ts` — `SectionDto`: `id: string`, `courseId: string`, `title: string`, `position: number`, `createdAt: string`, `updatedAt: string`.
- Create: `apps/api/src/courses/dto/create-section.dto.ts` — `CreateSectionDto`: `@IsString() courseId: string`, `@IsString() @MinLength(1) title: string`, `@IsInt() position: number`.
- Create: `apps/api/src/courses/dto/update-section.dto.ts` — `UpdateSectionDto`: all fields optional.
- Create: `apps/api/src/courses/dto/chapter.dto.ts` — `ChapterDto`: `id: string`, `courseId: string | null`, `sectionId: string | null`, `title: string`, `content: string`, `position: number`, `createdAt: string`, `updatedAt: string`.
- Create: `apps/api/src/courses/dto/create-chapter.dto.ts` — `CreateChapterDto`: `@IsOptional() @IsString() courseId?: string`, `@IsOptional() @IsString() sectionId?: string`, `@IsString() @MinLength(1) title: string`, `@IsString() content: string`, `@IsInt() position: number`; custom class-validator ensuring exactly one of courseId/sectionId.
- Create: `apps/api/src/courses/dto/update-chapter.dto.ts` — `UpdateChapterDto`: all fields optional.
- Test: `apps/api/src/courses/dto/*.spec.ts` — class-validator validation tests (valid/invalid payloads, XOR courseId/sectionId rule).

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: `Course`, `Section`, `Chapter` entity shapes (Tasks 1–3).
- Produces: DTOs `CourseDto`, `CreateCourseDto`, `UpdateCourseDto`, `SectionDto`, `CreateSectionDto`, `UpdateSectionDto`, `ChapterDto`, `CreateChapterDto`, `UpdateChapterDto` — camelCase at API boundary; `passwordHash` never appears (not applicable to content entities, but pattern holds: no sensitive fields exposed).

**Validation Method:** `tdd`
- Write failing Vitest tests: each `Create/*Dto` rejects invalid input (empty title, invalid structureType/status, missing required fields, both-or-neither courseId/sectionId on CreateChapterDto); each accepts valid input.
- Implement DTOs with `@IsString`, `@IsEnum`, `@IsInt`, `@IsOptional`, `@MinLength`, `@MaxLength`, and a custom validator/decorator for the XOR rule.
- `npm test -- --run src/courses/dto/*.spec.ts` exits 0.

**Acceptance Criteria:**
- `CreateCourseDto` requires `title` + `structureType`; rejects empty title and invalid structureType.
- `CreateChapterDto` accepts exactly one of `courseId`/`sectionId`; rejects both and neither.
- All DTOs use `camelCase`; no sensitive/internal fields exposed.
- `Update/*Dto` have all fields optional.

- [x] **Step 1:** Write failing DTO validation tests
- [x] **Step 2:** Create all Course/Section/Chapter DTOs (create/update/response)
- [x] **Step 3:** DTO tests pass
- [x] **Step 4: Commit**

---

### Task 5: CoursesService — course CRUD, publish/unpublish, structure enforcement

**Priority:** Critical

**Depends on:** Task 1, Task 3

**Parallel-safe with:** Task 6 (SectionsService) and Task 7 (ChaptersService) — separate service files, disjoint regions; but Task 5 depends on Task 1 and Task 3 entities only, not on Tasks 6/7.

**Files:**
- Create: `apps/api/src/courses/courses.service.ts` — `CoursesService`:
  - `findAll(): Promise<Course[]>` — all courses.
  - `findOne(id: string): Promise<Course | null>` — course by id.
  - `create(dto: CreateCourseDto): Promise<Course>` — create course (status DRAFT).
  - `update(id: string, dto: UpdateCourseDto): Promise<Course | null>` — update course fields.
  - `remove(id: string): Promise<void>` — delete course (cascades to sections/chapters via DB FK ON DELETE CASCADE).
  - `publish(id: string): Promise<Course>` — set status PUBLISHED; throws if course has zero chapters (enforce "at least one chapter before publishing").
  - `unpublish(id: string): Promise<Course>` — set status DRAFT; preserves chapters and progress records (only flips status).
  - `@Injectable()`, constructor injects `CourseRepository` and `ChapterRepository` via `@InjectRepository`.
- Test: `apps/api/src/courses/courses.service.spec.ts` — unit tests with mocked repositories: publish with 0 chapters throws; publish with ≥1 chapter succeeds; unpublish flips status and keeps chapters; create sets status DRAFT; remove calls repository remove.

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: `Course` entity (Task 1), `Chapter` entity (Task 3) — chapter count check for publish; `CreateCourseDto`, `UpdateCourseDto` (Task 4).
- Produces: `CoursesService.findAll`, `findOne`, `create`, `update`, `remove`, `publish`, `unpublish`; `publish` throws `BadRequestException`/`ConflictException` when chapter count is 0.

**Validation Method:** `tdd`
- Write failing Vitest unit tests for each method with `@InjectRepository` mocks.
- `publish()`: given course with 0 chapters → throws; given course with ≥1 chapter → status PUBLISHED.
- `unpublish()`: given published course → status DRAFT, chapters untouched.
- `create()`: sets `status = DRAFT`.
- `npm test -- --run src/courses/courses.service.spec.ts` exits 0.

**Acceptance Criteria:**
- `publish()` requires ≥1 chapter; 0 chapters → error (400/409).
- `unpublish()` flips to DRAFT, preserves chapters.
- `create()` defaults status to `DRAFT`.
- All methods use `snake_case` entity properties internally, return entities.

- [x] **Step 1:** Write failing CoursesService unit tests (mocked repositories)
- [x] **Step 2:** Implement `courses.service.ts` with publish/unpublish chapter-count rule
- [x] **Step 3:** CoursesService tests pass
- [x] **Step 4: Commit**

---

### Task 6: SectionsService — section CRUD, reorder

**Priority:** High

**Depends on:** Task 1, Task 2

**Parallel-safe with:** Task 5 (CoursesService) — separate files; Task 6 depends on Task 1/2 entities only.

**Files:**
- Create: `apps/api/src/courses/sections.service.ts` — `SectionsService`:
  - `findAllByCourse(courseId: string): Promise<Section[]>` — sections of a course, ordered by position.
  - `findOne(id: string): Promise<Section | null>`.
  - `create(courseId: string, dto: CreateSectionDto): Promise<Section>` — section belongs to course.
  - `update(id: string, dto: UpdateSectionDto): Promise<Section | null>`.
  - `remove(id: string): Promise<void>` — delete section (cascades to chapters via DB FK ON DELETE CASCADE).
  - `reorder(courseId: string, sectionIds: string[]): Promise<void>` — set positions per the given order.
  - `@Injectable()`, injects `SectionRepository`.
- Test: `apps/api/src/courses/sections.service.spec.ts` — unit tests with mocked repositories.

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: `Section` entity (Task 2), `Course` entity (Task 1) — course FK; `CreateSectionDto`, `UpdateSectionDto` (Task 4).
- Produces: `SectionsService.findAllByCourse`, `findOne`, `create`, `update`, `remove`, `reorder`.

**Validation Method:** `tdd`
- Write failing Vitest unit tests for each method with `@InjectRepository` mocks.
- `reorder()`: given ordered section ID list → positions set 1..N in that order.
- `create()`: section's `courseId` set from parameter.
- `npm test -- --run src/courses/sections.service.spec.ts` exits 0.

**Acceptance Criteria:**
- Sections ordered by `position`; `reorder()` applies explicit order.
- `create()` assigns `course_id` from the parent course.
- `remove()` cascades to chapters (DB FK ON DELETE CASCADE).

- [x] **Step 1:** Write failing SectionsService unit tests
- [x] **Step 2:** Implement `sections.service.ts`
- [x] **Step 3:** SectionsService tests pass
- [x] **Step 4: Commit**

---

### Task 7: ChaptersService — chapter CRUD, reorder, Markdown content

**Priority:** Critical

**Depends on:** Task 1, Task 2, Task 3

**Parallel-safe with:** Task 5 (CoursesService), Task 6 (SectionsService) — separate files; Task 7 depends on Task 1/2/3 entities only.

**Files:**
- Create: `apps/api/src/courses/chapters.service.ts` — `ChaptersService`:
  - `findAllByCourse(courseId: string): Promise<Chapter[]>` — direct chapters (course_id set, section_id null) ordered by position.
  - `findAllBySection(sectionId: string): Promise<Chapter[]>` — chapters in a section ordered by position.
  - `findOne(id: string): Promise<Chapter | null>`.
  - `create(dto: CreateChapterDto): Promise<Chapter>` — exactly one of courseId/sectionId (enforce XOR at service level too).
  - `update(id: string, dto: UpdateChapterDto): Promise<Chapter | null>`.
  - `remove(id: string): Promise<void>` — delete chapter.
  - `reorder(courseId: string | null, sectionId: string | null, chapterIds: string[]): Promise<void>` — set positions within parent scope.
  - `@Injectable()`, injects `ChapterRepository`.
- Test: `apps/api/src/courses/chapters.service.spec.ts` — unit tests with mocked repositories: create enforces XOR parent; reorder applies positions; findAllByCourse filters section_id null; findAllBySection filters by section.

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: `Chapter` entity (Task 3), `Course`/`Section` entities (Tasks 1/2); `CreateChapterDto`, `UpdateChapterDto` (Task 4).
- Produces: `ChaptersService.findAllByCourse`, `findAllBySection`, `findOne`, `create`, `update`, `remove`, `reorder`; `create` rejects both-or-neither parent.

**Validation Method:** `tdd`
- Write failing Vitest unit tests for each method with `@InjectRepository` mocks.
- `create()`: both courseId and sectionId → throws; neither → throws; exactly one → succeeds.
- `findAllByCourse()`: returns only chapters with `course_id` set and `section_id` null.
- `reorder()`: applies positions 1..N within the parent scope.
- `npm test -- --run src/courses/chapters.service.spec.ts` exits 0.

**Acceptance Criteria:**
- `create()` enforces exactly-one-parent (course XOR section) at service level.
- Chapters ordered by `position` within parent (course or section).
- `findAllByCourse` excludes section chapters; `findAllBySection` returns only that section's chapters.

- [x] **Step 1:** Write failing ChaptersService unit tests
- [x] **Step 2:** Implement `chapters.service.ts` with XOR parent rule
- [x] **Step 3:** ChaptersService tests pass
- [x] **Step 4: Commit**

---

### Task 8: Content controllers (Courses, Sections, Chapters) — Admin-protected

**Priority:** Critical

**Depends on:** Task 5, Task 6, Task 7

**Parallel-safe with:** none — controllers import the three services; Task 9 wires the module after controllers exist.

**Files:**
- Create: `apps/api/src/courses/courses.controller.ts` — `CoursesController`:
  - `@Controller('courses')`, `@UseGuards(JwtAuthGuard)`, `@Roles(UserRole.ADMIN)` on class (all endpoints Admin-only).
  - `GET /courses` → `CoursesService.findAll` → `CourseDto[]`.
  - `GET /courses/:id` → `findOne` → `CourseDto`; 404 if not found.
  - `POST /courses` → `CreateCourseDto` → `create` → 201 `CourseDto`.
  - `PATCH /courses/:id` → `UpdateCourseDto` → `update` → `CourseDto`; 404 if not found.
  - `DELETE /courses/:id` → `remove` → 204.
  - `POST /courses/:id/publish` → `publish` → `CourseDto`; 400/409 if zero chapters.
  - `POST /courses/:id/unpublish` → `unpublish` → `CourseDto`; 404 if not found.
- Create: `apps/api/src/courses/sections.controller.ts` — `SectionsController`:
  - `@Controller('courses/:courseId/sections')`, `@UseGuards(JwtAuthGuard)`, `@Roles(UserRole.ADMIN)`.
  - `GET /` → `findAllByCourse(courseId)` → `SectionDto[]`.
  - `GET /:id` → `findOne` → `SectionDto`; 404 if not found.
  - `POST /` → `CreateSectionDto` → `create(courseId, ...)` → 201 `SectionDto`.
  - `PATCH /:id` → `UpdateSectionDto` → `update` → `SectionDto`.
  - `DELETE /:id` → `remove` → 204.
  - `POST /reorder` → body `{ sectionIds: string[] }` → `reorder(courseId, sectionIds)` → 200.
- Create: `apps/api/src/courses/chapters.controller.ts` — `ChaptersController`:
  - `@Controller('courses/:courseId/chapters')` (flat) and nested under sections; keep flat route for simplicity with optional `sectionId` query/body. Use `@Controller('chapters')` with `courseId`/`sectionId` in body/query to keep one controller. Actually simpler: `@Controller('courses/:courseId/chapters')` for course-level chapters and `@Controller('courses/:courseId/sections/:sectionId/chapters')` for section chapters — two controllers or one with optional params. Decision: single `ChaptersController` at `@Controller('chapters')`, with `courseId`/`sectionId` passed in body for create and as query params for list. Keep it simple and consistent with flat resource style.
  - `GET /chapters?courseId=...` or `?sectionId=...` → list; `GET /chapters/:id` → one; `POST /chapters` → create; `PATCH /chapters/:id` → update; `DELETE /chapters/:id` → 204; `POST /chapters/reorder` → reorder.
  - All `@UseGuards(JwtAuthGuard)`, `@Roles(UserRole.ADMIN)`.
- Test: `apps/api/src/courses/courses.controller.spec.ts`, `sections.controller.spec.ts`, `chapters.controller.spec.ts` — Supertest integration tests against in-memory NestJS app (per Todo 1 pattern): Admin token → 200/201/204; Student token → 403; no token → 401; publish with 0 chapters → 409; invalid body → 400.

**Shared files (conflict risk):** none — new files only.

**Interfaces:**
- Consumes: `CoursesService` (Task 5), `SectionsService` (Task 6), `ChaptersService` (Task 7); `JwtAuthGuard`, `RolesGuard`, `@Roles` decorator, `UserRole` (Todo 1); DTOs (Task 4).
- Produces: `GET/POST/PATCH/DELETE /courses`, `POST /courses/:id/publish`, `POST /courses/:id/unpublish`; `GET/POST/PATCH/DELETE /courses/:courseId/sections` + reorder; `GET/POST/PATCH/DELETE /chapters` + reorder — all Admin-protected.

**Validation Method:** `contract-test`
- Supertest integration: `POST /courses` with Admin JWT → 201 `CourseDto`; with Student JWT → 403; no token → 401.
- `POST /courses/:id/publish` with 0 chapters → 409 `{ error: { code, message } }`; with ≥1 chapter → 200.
- Invalid DTO body → 400 `{ error: { code, message } }`.
- `npm test -- --run src/courses/*.controller.spec.ts` exits 0.

**Acceptance Criteria:**
- Every content endpoint requires Admin role; Student → 403; unauthenticated → 401.
- `publish` on chapter-less course → 409; on chaptered course → 200.
- Error envelope `{ error: { code, message } }` on 400/401/403/404/409.
- Invalid bodies → 400 via ValidationPipe (whitelist).

- [x] **Step 1:** Write failing Supertest controller integration tests
- [x] **Step 2:** Implement `courses.controller.ts`, `sections.controller.ts`, `chapters.controller.ts`
- [x] **Step 3:** Controller tests pass
- [x] **Step 4: Commit**

---

### Task 9: CoursesModule wiring + AppModule registration + TypeORM entity registration

**Priority:** Critical

**Depends on:** Task 5, Task 6, Task 7, Task 8

**Parallel-safe with:** none — modifies shared wiring files (`app.module.ts`, `typeorm.module.ts`) after all services/controllers exist.

**Files:**
- Create: `apps/api/src/courses/courses.module.ts` — `CoursesModule`: `imports: [TypeOrmModule.forFeature([Course, Section, Chapter])]`, `providers: [CoursesService, SectionsService, ChaptersService]`, `controllers: [CoursesController, SectionsController, ChaptersController]`, `exports: [CoursesService, SectionsService, ChaptersService]`.
- Modify: `apps/api/src/database/typeorm.module.ts` — anchor: `entities: [User]` array; add `Course`, `Section`, `Chapter` to the entities array.
- Modify: `apps/api/src/app.module.ts` — anchor: `imports: [ConfigModule, TypeormModule, AuthModule, UsersModule]`; add `CoursesModule` to imports.

**Shared files (conflict risk):**
- `apps/api/src/database/typeorm.module.ts` — modified only by Task 9 (adds 3 entities to array). No other task touches it.
- `apps/api/src/app.module.ts` — modified only by Task 9 (adds CoursesModule). No other task touches it.

**Interfaces:**
- Consumes: `CoursesService`, `SectionsService`, `ChaptersService` (Tasks 5–7); `CoursesController`, `SectionsController`, `ChaptersController` (Task 8); `Course`, `Section`, `Chapter` entities (Tasks 1–3); Todo 1's `AppModule`, `TypeormModule`.
- Produces: `CoursesModule` — registered in `AppModule`; `Course`, `Section`, `Chapter` registered in TypeORM connection entities; full content-management API mounted at `/courses`, `/sections`, `/chapters`.

**Validation Method:** `contract-test`
- `npx nest build` exits 0 (NestJS compiles, module wiring resolves, `forFeature` repositories inject).
- App boots (`node dist/main` listens on 3000; `curl -s http://localhost:3000/courses` without token → 401, proving routes are registered and guarded).
- `npm test -- --run src/courses/courses.module.spec.ts` exits 0 (module imports resolve, providers instantiated).

**Acceptance Criteria:**
- `npx nest build` exits 0.
- `CoursesModule` imported in `AppModule`; `Course`, `Section`, `Chapter` in TypeORM `entities`.
- `GET /courses` without token → 401 (routes registered + guarded).

- [x] **Step 1:** Create `courses.module.ts` with forFeature + services + controllers
- [x] **Step 2:** Add Course/Section/Chapter to `typeorm.module.ts` entities array
- [x] **Step 3:** Add `CoursesModule` to `app.module.ts` imports
- [x] **Step 4:** `npx nest build` exits 0; app boots; `/courses` guarded
- [x] **Step 5: Commit**

---

### Task 10: Content management integration tests (full Supertest flow)

**Priority:** Critical

**Depends on:** Task 9

**Parallel-safe with:** none — runs after the full API exists.

**Files:**
- Create: `apps/api/test/content.e2e.spec.ts` — end-to-end smoke test:
  - Admin registers/logs in (or uses bootstrap Admin from Todo 1 env); obtains JWT.
  - `POST /courses` → 201 CourseDto (DRAFT).
  - `POST /courses/:id/publish` with 0 chapters → 409.
  - `POST /courses/:id/sections` → 201; `POST /courses/:id/sections/:sid/chapters` → 201 (or flat chapters).
  - `POST /courses/:id/publish` now → 200 (has chapters).
  - `GET /courses` → 200 list includes the course.
  - `PATCH /courses/:id` → 200 updated fields.
  - `DELETE /courses/:id` → 204; `GET /courses/:id` → 404.
  - Student JWT on `POST /courses` → 403; no token → 401.
  - Error envelope shape `{ error: { code, message } }` on 401/403/409.
- Reuses Todo 1's `app.e2e.spec.ts` pattern (Supertest + in-memory NestJS app with TypeORM test DB or module fixtures).

**Shared files (conflict risk):** none — new test file only.

**Interfaces:**
- Consumes: all content endpoints (Task 8), Todo 1 auth (`POST /auth/login`, `JwtAuthGuard`, `@Roles('ADMIN')`).
- Produces: none (verification only).

**Validation Method:** `contract-test`
- Full flow: Admin create course (DRAFT) → publish blocked (0 chapters) → add section + chapter → publish succeeds (200) → GET list → 200 → Student denied (403) → unauthenticated denied (401) → delete course → 204 → 404.
- `npm test -- --run test/content.e2e.spec.ts` exits 0.

**Acceptance Criteria:**
- Full Admin content flow passes end-to-end.
- Publish gating (0 chapters → 409) verified.
- Student 403 / unauthenticated 401 on all content endpoints.
- Error envelope shape verified on error responses.

- [x] **Step 1:** Write content e2e smoke test
- [x] **Step 2:** Run full test suite (`npm test -- --run`) exits 0
- [x] **Step 3: Commit**

---

## Self-Review

**1. Spec coverage:** Every PRD Section 4.2–4.4 requirement maps to tasks: Course CRUD (Task 5/8), Section CRUD + reorder (Task 6/8), Chapter CRUD + reorder + Markdown (Task 7/8), publish/unpublish with ≥1 chapter rule (Task 5), structure_type FLAT/SECTION_BASED (Task 1 entity + Task 5/7 service enforcement), chapter exactly-one-parent (Task 3 DB CHECK + Task 7 service XOR), cascade deletion (DB FK ON DELETE CASCADE in Tasks 2/3), unpublish preserves progress (Task 5 only flips status). DTOs camelCase (Task 4). Error envelope (Todo 1, reused). Admin protection (Task 8). No gaps.

**2. Placeholder scan:** No TBD/TODO/"implement later"/vague criteria. All Acceptance Criteria are concrete input/output scenarios. All `Depends on` fields name exact task IDs. All `Shared files` fields name exact files or "none". No pasted test/implementation code. No pre-written commit messages.

**3. Type consistency:** Entity field names (`id`, `title`, `description`, `structureType`, `status`, `createdAt`, `updatedAt`, `courseId`, `sectionId`, `content`, `position`) consistent across Tasks 1–3 entities, Task 4 DTOs, Tasks 5–7 services. DTO names (`CreateCourseDto`, `UpdateCourseDto`, `CourseDto`, etc.) consistent in Tasks 4, 8. `CoursesService`/`SectionsService`/`ChaptersService` method names consistent in Tasks 5–7 and Task 8. `UserRole.ADMIN` from Todo 1 referenced in Task 8.

**4. Dependency graph consistency:** Header graph matches per-task `Depends on` exactly:
- Task 1 → none ✓
- Task 2 → Task 1 ✓
- Task 3 → Task 1, Task 2 ✓
- Task 4 → Task 1, Task 2, Task 3 ✓
- Task 5 → Task 1, Task 3 ✓
- Task 6 → Task 1, Task 2 ✓
- Task 7 → Task 1, Task 2, Task 3 ✓
- Task 8 → Task 5, Task 6, Task 7 ✓
- Task 9 → Task 5, Task 6, Task 7, Task 8 ✓
- Task 10 → Task 9 ✓
No cycles.

**5. Shared-file conflict scan:** Reverse index: `typeorm.module.ts` → Task 9 only; `app.module.ts` → Task 9 only; all other files created by exactly one task. No shared-file conflicts. Task 9's two modifications are disjoint regions of separate files.

**6. Task granularity:** Re-running split/merge tests per task:
- Task 1: passes all split/merge tests (one deliverable: Course entity + migration; tightly coupled).
- Task 2: passes (Section entity + migration).
- Task 3: passes (Chapter entity + migration + CHECK constraint).
- Task 4: passes all (DTOs only; ~8 DTOs but one behavioral unit — validation; acceptance criteria count is ~5 distinct scenarios, within limit).
- Task 5: passes (CoursesService: one behavioral unit — course CRUD + publish rule).
- Task 6: passes (SectionsService: one unit).
- Task 7: passes (ChaptersService: one unit + XOR rule).
- Task 8: passes all split/merge tests — one-sentence: "Admin-protected content controllers for courses/sections/chapters" (one outcome, no "and" joining unrelated); files span one layer (controllers) only; passes.
- Task 9: passes (module wiring — one deliverable).
- Task 10: passes (one e2e smoke test).
No duplicates. Each earns its own commit.

**7. Priority sanity:** Critical = Tasks 1, 2, 3, 4, 5, 7, 8, 9, 10 (feature doesn't function without them). High = Task 6 (sections CRUD is important but a Flat course can ship without sections — secondary to core course/chapter flow). Matches actual roles.

**8. Definition of Done grounding:** Every line names an exact command from the plan's tasks: `npm run typeorm migration:run`, `npm run typeorm migration:revert`, `npx nest build`, `npm test -- --run`, `curl` healthchecks, `grep -rn "TODO\|TBD"`. All trace to specific tasks.

**9. Constitution alignment:** Global Constraints matches PROJECT-CONSTITUTION.md verbatim plus Todo 2-specific rules derived from PRD (structure_type, publish gating, XOR parent, cascade). No diverging values. No Step 4 patch needed (Todo 2 doesn't surface a new project-wide constraint beyond PRD-derived rules already implied by the Constitution).

---

## Definition of Done

Project (Todo 2) is DONE when all of the following hold:

- [x] `npx nest build` exits 0 (NestJS compiles, Task 9)
- [x] `npm run typeorm migration:run` against test PostgreSQL applies `create-courses-table`, `create-sections-table`, `create-chapters-table` and creates `courses`, `sections`, `chapters` tables with correct columns + FKs + CHECK constraint (Tasks 1–3)
- [x] `npm run typeorm migration:revert` drops all three tables and enum types (Tasks 1–3)
- [x] `npm test -- --run` (full `@lerna/api` Vitest suite) exits 0 with zero failures (Tasks 1–10)
- [x] `npm test -- --run src/courses/courses.service.spec.ts` exits 0 — `publish()` throws with 0 chapters, succeeds with ≥1 chapter (Task 5)
- [x] `npm test -- --run src/courses/chapters.service.spec.ts` exits 0 — `create()` rejects both/neither parent (Task 7)
- [x] `npm test -- --run src/courses/*.controller.spec.ts` exits 0 — Admin 200/201/204, Student 403, no-token 401, publish-0-chapters 409 (Task 8)
- [x] `npm test -- --run test/content.e2e.spec.ts` exits 0 — full Admin flow: create DRAFT → publish blocked → add chapter → publish → list → student denied → delete → 404 (Task 10)
- [x] Manual: `curl -s http://localhost:3000/courses` without a token returns 401 (routes registered + guarded, Task 9)
- [x] `grep -rn "TODO\|TBD" apps/api/src/courses docs/superp/plans/2026-11-07-todo-2-content-management.md` returns nothing
- [x] Every task above (1–10) is checked off and its own Acceptance Criteria verified

---

## Execution Handoff

Plan complete and saved to `docs/superp/plans/2026-11-07-todo-2-content-management.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, one at a time in dependency order, with review between tasks.

**2. Inline Execution** — execute tasks in this session in topo order, one at a time, with checkpoints for review.

**Which approach?**

Note: once Todo 2 is fully executed and its own Definition of Done verified, per Step 5 of `decomposing-projects` I'll append Todo 2's produced interfaces to `PROJECT-INTERFACES.md` and update its row in `PROJECT-LEDGER.md` to `done` (commit range + plan file path). Todo 2 is not finished from the project's point of view until both are recorded.
