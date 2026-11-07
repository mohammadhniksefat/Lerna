# AGENTS.md — Lerna

> Project-wide instructions for AI coding agents and automated development tools.
>
> **Product:** Lerna — Minimal Learning Management Platform  
> **Document status:** Initial  
> **Product requirements source:** `docs/MVP-PRD.md`

---

## 1. Project Context

Lerna is a web-based, text-first learning platform for creating, organizing, publishing, and consuming educational courses.

The MVP has two roles:

- **Admin:** manages courses, sections, chapters, Markdown content, ordering, and publication.
- **Student:** browses published courses, reads chapters, manually marks chapters as completed, views progress, and resumes learning.

The product requirements are defined in the project PRD. Treat that document as the source of truth for product scope and expected behavior.

### Product invariants

Do not violate these requirements:

- The only MVP roles are `Admin` and `Student`.
- Public registration creates Student accounts only. Admin accounts are provisioned through a secure process, never public self-registration.
- All published courses are available to all students. There is no separate enrollment workflow.
- A course uses exactly one structure: `Flat` or `Section-based`.
- Flat courses contain chapters directly. Section-based courses contain sections, and sections contain chapters.
- Nested sections are not supported.
- A course cannot mix direct chapters and sections.
- Every chapter belongs to exactly one parent: either a course or a section.
- A course needs at least one chapter before it can be published.
- Chapter content is stored as raw Markdown. The Admin editor is a plain textarea; an Admin Markdown preview is out of scope.
- Student-facing Markdown must be rendered safely and sanitized against XSS.
- Chapter completion is manual and tracked independently for each student.
- Course progress is derived from completed chapters divided by total chapters; do not store a separately maintained course percentage.
- A student's `(user_id, chapter_id)` progress record must be unique.
- Adding a chapter affects the calculated progress denominator.
- Deleting a course, section, or chapter cascades to dependent content and progress records, as defined in the PRD.
- Unpublishing a course preserves existing progress.
- Students may study chapters in any order.
- Do not add features explicitly listed as out of scope in the PRD.

If a task or existing implementation conflicts with these invariants, stop and report the conflict instead of silently changing product behavior.

---

## 2. Technology Stack

Use the following stack unless the project owner explicitly changes it:

| Area | Technology |
|---|---|
| Language | TypeScript |
| Monorepo | pnpm Workspaces |
| Frontend | Vue 3 + Vite |
| Frontend styling | Tailwind CSS |
| UI components | shadcn-vue, selectively |
| Backend | NestJS |
| API style | REST |
| API contract and documentation | OpenAPI |
| Database | PostgreSQL |
| ORM | TypeORM |
| Frontend validation | Zod, where appropriate |
| Backend validation | NestJS DTO validation |
| Unit / integration testing | Vitest and the NestJS-compatible test tooling selected by the project |
| End-to-end testing | Playwright |

### Stack usage rules

- Use TypeScript across the application.
- Use pnpm for package management. Do not introduce npm or Yarn lockfiles.
- Use pnpm Workspaces for monorepo package management.
- Do not introduce Nx, Turborepo, or another orchestration layer unless explicitly approved.
- Keep the frontend and backend as separate applications with independent build and runtime processes.
- PostgreSQL is the system of record. Do not introduce another database without approval.
- Use TypeORM for persistence. Do not add a second ORM or query builder without approval.
- Use database migrations for schema changes. Do not rely on TypeORM `synchronize` in application environments.
- Keep the REST API contract explicit and document it with OpenAPI.
- Do not expose TypeORM entities as public API response models. Define API request/response DTOs at the application boundary.
- Keep generated API clients or shared API contracts synchronized with the OpenAPI contract when such tooling is introduced.

The exact versions of dependencies should follow the versions already established in the repository. Do not upgrade major versions or replace foundational dependencies as part of an unrelated task.

---

## 3. Monorepo Structure

Use this as the intended starting structure. Adapt only when the repository already has a justified convention or an approved technical decision.

```text
lerna/
├── apps/
│   ├── web/                  # Vue 3 + Vite frontend
│   └── api/                  # NestJS backend
├── packages/
│   ├── api-client/           # Generated API client, if adopted
│   └── config/               # Shared tooling configuration, if needed
├── docs/                     # Technical and project documentation
├── pnpm-workspace.yaml
├── package.json
├── pnpm-lock.yaml
└── AGENTS.md
```

### Repository boundaries

- `apps/web` owns presentation, frontend routing, client-side state, and user interaction.
- `apps/api` owns authentication, authorization, business rules, API behavior, and persistence.
- The frontend must communicate with the backend through the documented API. Do not connect the frontend directly to PostgreSQL.
- Do not import backend implementation modules, TypeORM entities, or database code into the frontend.
- Shared packages must contain genuinely shared, stable code or generated contracts. Do not create shared packages merely to avoid a small amount of duplication.
- Keep application-specific dependencies inside the relevant workspace package.
- Keep root scripts limited to repository-wide tasks such as workspace checks, linting, formatting, and coordinated tests.

---

## 4. Architecture and Engineering Principles

### 4.1 Backend

- Organize the NestJS application around clear business modules. Expected domain areas include:
  - Authentication and users
  - Courses
  - Sections
  - Chapters
  - Progress
- Keep controllers focused on HTTP concerns: parsing input, invoking application logic, and returning appropriate responses.
- Put business rules in services or other suitable application/domain components, not in controllers.
- Keep persistence concerns behind repositories or clearly defined data-access boundaries where that improves separation.
- Do not introduce microservices or distributed infrastructure for this MVP.
- Use transactions for operations that must remain atomic, especially destructive hierarchy operations and other multi-record changes.
- Enforce authorization on the backend for every protected operation. Hiding UI controls is not authorization.
- Validate incoming data at the API boundary.
- Use explicit DTOs for requests and responses. Avoid leaking internal database fields.
- Keep error responses consistent with the API error contract once it is defined.

### 4.2 Frontend

- Organize the Vue application by product feature or domain rather than accumulating unrelated components in generic folders.
- Keep presentation components separate from API access and business-specific state where practical.
- Centralize API communication rather than scattering raw `fetch` calls throughout views and components.
- Treat backend responses as untrusted runtime data; handle loading, empty, success, and error states explicitly.
- Enforce role-aware navigation and presentation for usability, while relying on the backend for actual authorization.
- Build responsive interfaces as required by the PRD.
- Do not invent product features or flows that are not supported by the PRD.

### 4.3 Database and data integrity

- Make important domain constraints enforceable at the database level where practical, in addition to application validation.
- Add and review migrations for every schema change.
- Do not edit an already-applied migration to change its historical meaning; create a new migration instead.
- Use foreign keys and deliberate deletion behavior to implement the PRD's cascade rules.
- Enforce uniqueness for `(user_id, chapter_id)` in chapter progress.
- Ensure a chapter cannot have both `course_id` and `section_id`, or neither.
- Ensure course structure rules are enforced consistently. If a rule cannot be expressed safely as a database constraint, enforce it in the application transaction boundary and test it.
- Do not use destructive database commands or reset user data unless explicitly requested and the target environment is confirmed.

### 4.4 Security

- Passwords must be securely hashed. Never store plaintext passwords or reversible password representations.
- Never allow public registration or user-editable profile fields to grant the Admin role.
- Check authentication and role authorization on the server for every protected endpoint.
- Prevent insecure direct object reference (IDOR) issues: verify that requested resources belong to the expected course/section hierarchy and are accessible to the current user.
- Sanitize rendered Markdown output against XSS. Do not assume Markdown parsing alone is safe.
- Avoid unsafe HTML rendering. Any deliberate raw-HTML support must be explicitly reviewed and sanitized.
- Never commit secrets, credentials, private keys, access tokens, or real environment files.
- Use environment variables for environment-specific configuration and maintain a safe example file with placeholders only.
- Do not log passwords, tokens, session identifiers, or sensitive authentication data.

---

## 5. Stitch Design and Frontend Implementation

The project uses Google Stitch as a design input. When Stitch MCP is available, use it to inspect the relevant project, screens, and design context before implementing UI work.

### Design implementation rules

- Treat the approved Stitch design as the primary visual reference for the screens it covers.
- Inspect the actual design before implementation; do not rely only on a textual description or memory of the design.
- Preserve the design's visual hierarchy, spacing, typography, colors, sizing, alignment, component proportions, and responsive behavior as closely as the available design reference allows.
- Do not replace a distinctive design with a generic dashboard or a default component-library appearance.
- Do not assume that a conventional LMS layout, sidebar, card grid, or navigation pattern is required unless the design or product requirements establish it.
- If a design detail is missing or ambiguous, make the smallest reasonable implementation decision and report the assumption. Do not redesign unrelated areas.
- If the design conflicts with a product requirement or accessibility/usability constraint, explain the conflict and propose a resolution rather than silently choosing one.
- After implementation, run the application and compare the result with the Stitch reference when browser or visual inspection tools are available. Correct visible discrepancies before considering the UI task complete.

### Selective use of shadcn-vue

shadcn-vue is an optional implementation resource, not a design system that dictates Lerna's appearance.

- Use it selectively for suitable primitives such as dialogs, dropdowns, selects, tabs, or other interaction patterns where it helps.
- Customize component markup, styles, variants, and composition to match the approved design.
- Do not use a shadcn-vue component merely because it exists.
- Do not force every screen into default shadcn layouts, cards, sidebars, buttons, or visual conventions.
- Prefer a project-specific component when the design requires distinctive behavior or appearance.
- Keep shared UI components consistent with the project's design tokens and visual language.

### Design tokens

When implementing the design system, establish reusable tokens for the values actually present in the approved designs (for example color, typography, spacing, radius, and elevation). Do not invent a large token system before inspecting the design. Avoid scattered one-off values when a stable shared token is appropriate.

---

## 6. API Contract

- Design APIs around product resources and use appropriate HTTP methods and status codes.
- Keep the OpenAPI specification accurate and update it when endpoint behavior or DTOs change.
- Document authentication requirements, authorization expectations, request parameters, request bodies, response schemas, and relevant error responses.
- Do not make breaking API changes without identifying their impact on the frontend and any generated client.
- Keep API DTOs independent from TypeORM entities.
- Do not invent endpoint paths, response envelopes, pagination conventions, authentication mechanisms, or versioning policies if they have not been established. Check the existing contract or ask for a decision.
- Validate that frontend usage matches the API contract. Do not work around a contract mismatch by silently weakening types or adding undocumented response assumptions.

---

## 7. Development Workflow for Agents

For every task, follow this workflow.

### Before editing

1. Read this `AGENTS.md` and the relevant sections of the PRD.
2. Inspect the existing repository structure and the files directly related to the task.
3. Read relevant technical documentation and existing implementation patterns before introducing a new pattern.
4. Identify the task's scope, expected behavior, and acceptance criteria.
5. Check for existing uncommitted user changes. Never overwrite, discard, or reformat unrelated work.
6. If requirements are ambiguous, contradictory, or technically consequential, ask for clarification before making an irreversible decision.

### While editing

- Make the smallest coherent change that fully addresses the task.
- Follow existing naming, formatting, and architectural conventions unless they conflict with this document or an approved decision.
- Do not refactor unrelated code.
- Do not add dependencies without a concrete need. Explain why a new dependency is justified.
- Do not add speculative abstractions, generic frameworks, or extension points for hypothetical future requirements.
- Do not silently change product behavior, data semantics, API contracts, or security assumptions.
- Keep code, tests, and relevant documentation aligned.
- Never generate or modify secrets or real environment credentials.
- Do not run destructive commands against databases, files, or infrastructure without explicit approval.

### After editing

1. Review the complete diff, not just the files you remember changing.
2. Run the relevant formatter, linter, type checks, tests, and build commands available in the repository.
3. Add or update tests for changed behavior, including important edge cases.
4. If a check cannot be run, state exactly which check was skipped and why. Never claim that unexecuted checks passed.
5. Check for accidental changes, debug code, temporary files, secrets, and unrelated formatting churn.
6. Update documentation when the task changes documented behavior or developer workflow.
7. Provide a concise completion report and a suggested commit message.

---

## 8. Git and Commit Policy

**Agents must never create commits.**

- Do not run `git commit`, `git commit --amend`, or any command that creates or rewrites commits.
- Do not push, force-push, rebase, reset, or rewrite Git history unless the user explicitly requests that exact operation.
- Do not stage changes unless staging is explicitly requested.
- Do not discard or overwrite existing user changes.
- Do not modify Git configuration or hooks unless explicitly requested.
- At the end of every completed editing task, provide one suggested commit message describing the actual changes.
- The suggested commit message must not mention the agent, AI, model, assistant, or tool used.
- Do not claim that a commit was created. The user is responsible for reviewing and committing changes.

Suggested format:

```text
<type>(<scope>): < concise description>
```

Use an appropriate type such as `feat`, `fix`, `refactor`, `test`, `docs`, `build`, or `chore`. Adapt to an existing repository convention if one is already established.

---

## 9. Testing Expectations

- Tests must verify behavior, not merely implementation details.
- Add tests when changing business rules, authorization, persistence behavior, or API contracts.
- Cover both allowed and rejected cases for authorization-sensitive operations.
- Test hierarchy invariants for Flat and Section-based courses.
- Test publication eligibility (a course without chapters cannot be published).
- Test cascade deletion and preservation of progress when a course is unpublished.
- Test progress uniqueness, repeated completion requests, and progress calculation.
- Test that adding or deleting chapters changes the calculated progress as required.
- Test Markdown rendering and sanitization against unsafe content.
- Use integration tests for behavior that depends on the database or multiple application layers.
- Use Playwright for critical end-to-end user journeys when the relevant flows exist.
- Keep tests deterministic and independent. Do not rely on production data or external services unless the test is explicitly designed for them.

Do not weaken or remove a failing test simply to make a task pass. Investigate whether the implementation or the test is incorrect.

---

## 10. Documentation and Technical Decisions

- Keep `MVP PRD.md` as the product requirements reference. Do not rewrite product requirements as part of an implementation task.
- Put implementation-level decisions in the appropriate technical documentation under `docs/`.
- Record consequential architectural decisions as short Architecture Decision Records (ADRs) when an ADR convention is established.
- If an implementation requires a decision that has not been made, document the options, trade-offs, and recommendation, then request approval.
- Do not treat an agent's previous suggestion as an approved decision unless the project owner accepted it.
- Keep documentation concise, accurate, and synchronized with the code.

The following areas remain subject to explicit technical design if not already documented elsewhere:

- Authentication and session strategy
- Password hashing algorithm and configuration
- API error response schema
- API versioning and route conventions
- Database schema details and exact constraints
- Markdown parser and sanitizer selection/configuration
- Logging and observability
- Deployment and environment strategy
- CI/CD pipeline

Do not infer approval for a specific library or policy from the fact that it appears in an example or recommendation.

---

## 11. Scope Control

The MVP does not include:

- Quizzes or exams
- Assignments or exercises
- Gamification or scoring
- Certificates
- Discussions or comments
- Video or audio content
- File attachments
- Multiple instructors
- Payments or subscriptions
- User-specific course assignment
- A separate enrollment system
- Advanced search
- Content versioning
- WYSIWYG editing
- Admin-side Markdown preview
- Advanced admin analytics
- Personal note-taking

Do not implement these features unless the project owner explicitly changes the scope.

Do not add Docker or container orchestration as part of the current baseline. Dockerization is intentionally deferred and may be addressed in a later task.

---

## 12. Agent Completion Report

At the end of each editing task, report:

1. **Summary:** What changed and why.
2. **Files changed:** The relevant files.
3. **Validation:** Commands/checks executed and their results.
4. **Limitations or follow-ups:** Anything not completed, assumptions made, or decisions requiring approval.
5. **Suggested commit message:** One commit message, with no agent/tool attribution.

Keep the report concise but specific. Distinguish verified results from assumptions.

---

## 13. Instruction Priority

When instructions conflict, use this order:

1. Explicit, current instruction from the project owner.
2. This `AGENTS.md` for repository-wide agent behavior and approved engineering conventions.
3. The current PRD for product requirements and MVP scope.
4. Approved technical specifications and ADRs for implementation details.
5. Existing code conventions, where they do not conflict with the above.

If two authoritative project documents conflict, do not silently choose one. Explain the conflict and request clarification.

## 14. Branch Workflow (Constitution)

All development work happens on the `develop` branch. The `main` branch is protected and must not be touched directly by agents:

- Create feature work on `develop` (or short-lived feature branches branched from `develop`).
- Do not commit, push, or merge anything directly to `main`.
- Do not rebase, reset, or rewrite `main` history.
- `main` is updated only via an approved merge request/PR from `develop`, reviewed and merged by the project owner.

This rule is the project constitution and takes precedence over general workflow convenience. If a task explicitly requires touching `main`, request clarification from the project owner before proceeding.
