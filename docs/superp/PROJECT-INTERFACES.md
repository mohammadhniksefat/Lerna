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

## Todo 1: Foundation
**Depends on:** none
**Produces:**
- `main.ts: bootstrap()` — app entry point; `AppModule` — root module wiring
- `configuration: Record<string, any>` — typed env config; `ConfigModule` (global) — injectable `ConfigService` everywhere
- `TypeOrmModule` — PostgreSQL connection ready for Task 4 entity; `synchronize: false`
- `User` entity — `id`, `email`, `passwordHash`, `role`, `createdAt`; `UserRole` enum; `create-users-table` migration — `users` table with `id`, `email`, `password_hash`, `role`, `created_at`
- `AuthService.validateUser`, `AuthService.login`, `AuthService.register`, `AuthService.bootstrapAdmin`; DTOs `RegisterDto`, `LoginDto`, `AuthResponseDto`, `UserDto`
- `LocalStrategy`, `JwtStrategy`, `RolesGuard`, `Roles` decorator
- `POST /auth/register`, `POST /auth/login` HTTP endpoints
- `UsersService.findByEmail`, `findById`, `create`, `findAll`, `updateRole`; `GET/POST/PATCH /users/*` endpoints (Admin-protected)
- `HttpExceptionFilter` — global error envelope `{ error: { code, message, details? } }`
- App startup bootstrap — Admin created from `ADMIN_EMAIL`/`ADMIN_PASSWORD` on first start
**Deviations from plan:** none

## Todo 2: Content Management
**Depends on:** Todo 1
**Produces:**
- `Course` entity — `id`, `title`, `description`, `structureType`, `status`, `createdAt`, `updatedAt`; `CourseStructureType` enum (`FLAT`, `SECTION_BASED`); `CourseStatus` enum (`DRAFT`, `PUBLISHED`); `create-courses-table` migration — `courses` table
- `Section` entity — `id`, `courseId`, `title`, `position`, `createdAt`, `updatedAt`; `create-sections-table` migration — `sections` table with `course_id` FK `ON DELETE CASCADE`
- `Chapter` entity — `id`, `courseId` (nullable), `sectionId` (nullable), `title`, `content`, `position`, `createdAt`, `updatedAt`; `create-chapters-table` migration — `chapters` table with `course_id`/`section_id` FKs (`ON DELETE CASCADE`) and `chapters_parent_check` CHECK constraint (XOR parent)
- DTOs: `CourseDto`, `CreateCourseDto`, `UpdateCourseDto`, `SectionDto`, `CreateSectionDto`, `UpdateSectionDto`, `ChapterDto`, `CreateChapterDto`, `UpdateChapterDto` (camelCase at API boundary)
- `CoursesService` — `findAll`, `findOne`, `create`, `update`, `remove`, `publish` (≥1 chapter rule), `unpublish` (preserves progress)
- `SectionsService` — `findAllByCourse`, `findOne`, `create`, `update`, `remove`, `reorder`
- `ChaptersService` — `findAllByCourse`, `findAllBySection`, `findOne`, `create` (XOR parent rule), `update`, `remove`, `reorder`
- `CoursesController`, `SectionsController`, `ChaptersController` — all endpoints `@Roles(UserRole.ADMIN)`; paths `POST/GET/PATCH/DELETE /courses`, `POST /courses/:id/publish`, `POST /courses/:id/unpublish`, `POST/GET/PATCH/DELETE /courses/:courseId/sections` + reorder, `GET/POST/PATCH/DELETE /chapters` + reorder
- `CoursesModule` — wired in `AppModule`; `Course`/`Section`/`Chapter` registered in TypeORM entities
- `apps/api/test/content.e2e.spec.ts` — e2e smoke test covering full Admin flow, Student 403, unauthenticated 401, publish gating, error envelopes
**Deviations from plan:** none

## Todo 3: Learning Experience
**Depends on:** Todo 2
**Produces:**
- `sanitizeMarkdown(markdown: string): string` — Markdown→sanitized HTML via `marked` + `sanitize-html` (server-side, no DOM); `apps/api/src/student/markdown.ts`
- DTOs: `StudentCourseDto`, `CourseDetailsDto`, `SectionWithChaptersDto`, `ChapterSummaryDto`, `ChapterReaderDto` (camelCase at API boundary)
- `StudentCoursesService.findPublished()` — all `PUBLISHED` courses; `findCourseWithStructure(id)` — null for draft/unknown; sections+chapters for SECTION_BASED, direct chapters for FLAT
- `StudentCoursesController` — `@Controller('student/courses')`, `@UseGuards(JwtAuthGuard)` only (no `@Roles(ADMIN)`); `GET /student/courses`, `GET /student/courses/:id`
- `StudentChaptersService.findChapter(id)` — sanitized `contentHtml` via `sanitizeMarkdown`, plus `prevChapterId`/`nextChapterId` within parent scope (course for Flat, section for Section-based); null for unpublished/unknown
- `StudentChaptersController` — `@Controller('student/chapters')`, `@UseGuards(JwtAuthGuard)` only; `GET /student/chapters/:id`
- `StudentModule` — `TypeOrmModule.forFeature([Course, Section, Chapter])`, services, controllers; registered in `AppModule`; student API mounted at `/student/courses`, `/student/chapters`
- `apps/api/test/student.e2e.spec.ts` — e2e smoke test covering published-only listing, course details, chapter reader with sanitized HTML + navigation, 401/404
- `apps/api/src/student/student.module.spec.ts` — module wiring verification
**Deviations from plan:** none
