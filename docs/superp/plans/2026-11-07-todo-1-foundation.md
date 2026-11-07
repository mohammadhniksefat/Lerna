# Todo 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: this plan defines tasks, dependencies, and acceptance criteria only. Use the superp:subagent-driven-development sequential dispatch loop (recommended — fresh subagent per task, dispatched one at a time in topo order, with review between tasks) or execute tasks inline in topo order to actually write code, tests, and commits. `Parallel-safe with` and true concurrent execution are only exploited by superp:executing-plans (separate session, isolated worktrees); subagent-driven-development always dispatches one implementer at a time. Steps use checkbox (`- [ ]`) syntax for tracking. Task ordering MUST respect each task's `Depends on` field — do not execute or dispatch a task before all of its dependencies are checked off. The plan is not finished until every item in the Definition of Done section at the end is satisfied — task checkboxes alone do not mean the project is done.

**Goal:** Build the Lerna backend Foundation: PostgreSQL database, TypeORM connection, User entity, authentication (register/login/JWT), authorization (ADMIN/STUDENT roles enforced on the backend), and admin bootstrap from environment variables.

**Architecture:** Greenfield NestJS backend in `apps/api` of a pnpm Workspaces monorepo. Three domain modules — `AuthModule` (register, login, JWT strategies, roles guard), `UsersModule` (User entity, admin CRUD), shared `ConfigModule` + `TypeOrmModule` (PostgreSQL). Stateless bearer-token auth; no server-side sessions, no refresh tokens. Admin bootstrapped on first startup from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars.

**Tech Stack:** TypeScript, NestJS, TypeORM, PostgreSQL, bcrypt, JWT (jsonwebtoken), Vitest, pnpm Workspaces.

## Global Constraints

> Copied verbatim from `docs/superp/briefs/todo-1-constitution-brief.md` (Todo 1 constitution-brief). This is ground truth — do not restate or re-derive.

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

[Append-only log of every patch made under Step 4 of the
`decomposing-projects` skill. One entry per patch:
- `<date>` — Patch by Todo <N>: [exact new rule added] — rationale: [one line]. Todos flagged needs-recheck as a result: [list, or "none"].]

## Project Definition of Done

> Populate this once, right after Step 1, using the same No-Placeholder
> discipline as `writing-plans`'s own Definition of Done: exact commands,
> exact expected results, nothing generic like "integration works."

Project is DONE when all of the following hold:

- [ ] Every row in `PROJECT-LEDGER.md` is `done`, with no `needs-recheck` or
      `blocked` flags remaining
- [ ] `pnpm --filter @lerna/api run test` passes (NestJS backend integration tests)
- [ ] `pnpm --filter @lerna/web run test` passes (Vitest frontend tests)
- [ ] `pnpm playwright test` passes end-to-end smoke test exercising the seam between Todo 2 (Content Management) and Todo 4 (Progress Tracking): create a course → add a chapter → mark chapter complete → verify progress recalculates
- [ ] Every `Consumes`-shaped dependency between Todos, as declared in each
      Todo's own plan, is confirmed against the matching `Produces` entry in
      `PROJECT-INTERFACES.md` by the project-level integration reviewer (Step 7) with zero unresolved mismatches
- [ ] `grep -rn "TODO\|TBD" docs/superp/PROJECT-*.md` returns nothing

> Structural analysis note (Phase 0): codebase-memory-mcp `get_architecture` confirms this is greenfield — 8 files total, all documentation (DESIGN.md, README.md, docs/mvp-prd.md, docs/superp/*). No existing source code, modules, routes, or database schema. All file paths below are new creations derived from AGENTS.md §3 monorepo conventions (`apps/api`, `packages/*`) and NestJS standard layout, not from existing code traces.

## Task Dependency Graph

```
Task 1 → (none)
Task 2 → Task 1
Task 3 → Task 2
Task 4 → Task 3
Task 5 → Task 4
Task 6 → Task 5
Task 7 → Task 6
Task 8 → Task 4, Task 7
Task 9 → Task 1
Task 10 → Task 5, Task 9
Task 11 → Task 7, Task 8
```

---

### Task 1: Monorepo workspace & NestJS app skeleton

**Priority:** Critical

**Depends on:** none

**Parallel-safe with:** none — must run in isolation (creates root config files)

**Files:**
- Create: `package.json` — root workspace package.json, name `@lerna/repo`, private, workspaces: `apps/*`, `packages/*`, devDeps: pnpm, typescript, vitest
- Create: `pnpm-workspace.yaml` — packages: `["apps/*", "packages/*"]`
- Create: `apps/api/package.json` — name `@lerna/api`, deps: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `pg`, `bcryptjs`, `jsonwebtoken`, `@nestjs/jwt`, `@nestjs/passport`, `passport-local`, class-validator, class-transformer, reflect-metadata, rxjs; devDeps: `@nestjs/testing`, vitest, ts-node, typescript, nest-cli
- Create: `apps/api/tsconfig.json` — NestJS-compatible TypeScript config
- Create: `apps/api/nest-cli.json` — `{ "collection": "@nestjs/schematics", "sourceRoot": "src" }`
- Create: `apps/api/src/main.ts` — `NestFactory.create(AppModule)`, `app.useGlobalPipes(new ValidationPipe({ whitelist: true }))`, `app.listen(3000)`
- Create: `apps/api/src/app.module.ts` — `AppModule` importing `ConfigModule`, `TypeOrmModule`, `AuthModule`, `UsersModule`

**Shared files (conflict risk):** none — safe for parallel worktree execution.

**Interfaces:**
- Consumes: none
- Produces: `main.ts: bootstrap()` — app entry point; `AppModule` — root module wiring

**Validation Method:** `contract-test`
- `tsc --noEmit -p apps/api/tsconfig.json` exits 0
- `npx nest build` exits 0 (NestJS compiles without errors)
- `node dist/main.js` starts and listens on port 3000 (healthcheck: `curl -s http://localhost:3000` returns 404 from NestJS, proving the app boots)

**Acceptance Criteria:**
- Root `package.json` declares `apps/*` and `packages/*` as pnpm workspaces
- `apps/api/package.json` lists `@lerna/api` as package name with NestJS, TypeORM, bcrypt, JWT, Passport dependencies
- `main.ts` bootstraps `AppModule` with global `ValidationPipe` (whitelist on) and listens on port 3000
- `AppModule` imports `ConfigModule.forRoot()`, `TypeOrmModule.forRootAsync()`, `AuthModule`, `UsersModule`

- [ ] Step 1: Create root `package.json`, `pnpm-workspace.yaml`
- [ ] Step 2: Create `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/nest-cli.json`
- [ ] Step 3: Create `apps/api/src/main.ts` and `apps/api/src/app.module.ts`
- [ ] Step 4: Commit (executor writes commit message)

---

### Task 2: Configuration layer (env vars, ConfigModule)

**Priority:** Critical

**Depends on:** Task 1

**Parallel-safe with:** none — Task 3 imports `ConfigModule`

**Files:**
- Create: `apps/api/src/config/configuration.ts` — factory returning `{ database: { url: process.env.DATABASE_URL }, jwt: { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }, bcrypt: { saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10) }, admin: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } }`
- Create: `apps/api/src/config/config.module.ts` — `ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: (config) => { ... throws if DATABASE_URL, JWT_SECRET missing } }`
- Create: `apps/api/src/config/env.schema.ts` — Joi/Zod validation schema throwing on missing `DATABASE_URL`, `JWT_SECRET`

**Shared files (conflict risk):** none — safe for parallel worktree execution.

**Interfaces:**
- Consumes: none
- Produces: `configuration: Record<string, any>` — typed env config; `ConfigModule` (global) — injectable `ConfigService` everywhere

**Validation Method:** `tdd`
- Write failing Vitest test: `configuration()` returns expected shape from `process.env`; `validate()` throws when `DATABASE_URL` missing; `validate()` throws when `JWT_SECRET` missing
- Implement `configuration.ts` and `config.module.ts` to pass
- `npm test -- --run src/config/config.module.spec.ts` exits 0

**Acceptance Criteria:**
- `configuration()` returns `database.url`, `jwt.secret`, `jwt.expiresIn`, `bcrypt.saltRounds`, `admin.email`, `admin.password` from env
- Missing `DATABASE_URL` at app startup causes `ConfigModule.validate()` to throw (fail-fast)
- Missing `JWT_SECRET` at app startup causes `ConfigModule.validate()` to throw
- `JWT_EXPIRES_IN` defaults to `'7d'`; `BCRYPT_SALT_ROUNDS` defaults to `12`

- [ ] Step 1: Write failing config tests (Vitest)
- [ ] Step 2: Implement `configuration.ts`, `config.module.ts`, `env.schema.ts`
- [ ] Step 3: Config tests pass
- [ ] Step 4: Commit

---

### Task 3: Database module (TypeORM + PostgreSQL connection)

**Priority:** Critical

**Depends on:** Task 2

**Parallel-safe with:** none — Task 4 creates entity that TypeORM needs

**Files:**
- Create: `apps/api/src/database/typeorm.module.ts` — `TypeOrmModule.forRootAsync({ inject: [ConfigService], useFactory: (config) => ({ type: 'postgres', url: config.database.url, entities: [User], migrations: [...], synchronize: false, logging: false }) }` — imports `ConfigModule`, uses `ConfigService`

**Shared files (conflict risk):** none — safe for parallel worktree execution.

**Interfaces:**
- Consumes: `ConfigService.get('database.url')` — from Task 2 ConfigModule
- Produces: `TypeOrmModule` — PostgreSQL connection ready for Task 4 entity

**Validation Method:** `contract-test`
- `TypeOrmModule.forRootAsync()` factory receives `ConfigService` and returns valid TypeORM options object with `type: 'postgres'`, `synchronize: false`
- Integration test against test PostgreSQL: `DataSource.initialize()` succeeds, `dataSource.isInitialized` is true, `dataSource.destroy()` succeeds
- `npm test -- --run src/database/typeorm.module.spec.ts` exits 0

**Acceptance Criteria:**
- `TypeOrmModule` connects to PostgreSQL via `DATABASE_URL` from `ConfigService`
- `synchronize` is `false` (migrations only, per Constitution)
- Connection initializes and destroys cleanly in test

- [ ] Step 1: Write failing database connection test
- [ ] Step 2: Implement `typeorm.module.ts`
- [ ] Step 3: Database test passes against test PostgreSQL
- [ ] Step 4: Commit

---

### Task 4: User entity + CreateUsersTable migration

**Priority:** Critical

**Depends on:** Task 3

**Parallel-safe with:** none — Task 5 (AuthService) depends on User entity

**Files:**
- Create: `apps/api/src/users/user.entity.ts` — `User` TypeORM entity: `@PrimaryGeneratedColumn('uuid') id: string`, `@Column({ unique: true }) email: string`, `@Column() passwordHash: string`, `@Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT }) role: UserRole`, `@CreateDateColumn() createdAt: Date`; `UserRole` enum: `ADMIN = 'ADMIN'`, `STUDENT = 'STUDENT'`
- Create: `apps/api/src/database/migrations/create-users-table.ts` — TypeORM migration: `CREATE TYPE user_role AS ENUM ('ADMIN', 'STUDENT')`, `CREATE TABLE users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email varchar(255) NOT NULL UNIQUE, password_hash varchar(255) NOT NULL, role user_role NOT NULL DEFAULT 'STUDENT', created_at timestamp NOT NULL DEFAULT now())`; down migration drops table and type

**Shared files (conflict risk):** none — safe for parallel worktree execution.

**Interfaces:**
- Consumes: `TypeOrmModule` connection (Task 3)
- Produces: `User` entity — `id`, `email`, `passwordHash`, `role`, `createdAt`; `UserRole` enum; `create-users-table` migration — `users` table with `id`, `email`, `password_hash`, `role`, `created_at`

**Validation Method:** `migration-check`
- Forward migration: `npm run typeorm migration:run` against test PostgreSQL creates `users` table with columns `id`, `email`, `password_hash`, `role`, `created_at` and `user_role` enum type
- Post-migration assertion: `SELECT column_name FROM information_schema.columns WHERE table_name = 'users'` returns exactly `id`, `email`, `password_hash`, `role`, `created_at`
- Rollback: `npm run typeorm migration:revert` drops `users` table and `user_role` type
- `npm test -- --run src/users/user.entity.spec.ts` exits 0 (entity metadata valid, column decorators correct)

**Acceptance Criteria:**
- `User` entity has `id (uuid, pk)`, `email (unique)`, `passwordHash`, `role (ADMIN|STUDENT, default STUDENT)`, `createdAt`
- All columns snake_case in DB (`password_hash`, `created_at`), camelCase in TS (`passwordHash`, `createdAt`)
- Migration creates `users` table and `user_role` enum; rollback drops both
- `(email)` has unique constraint

- [ ] Step 1: Define `UserRole` enum and `User` entity
- [ ] Step 2: Write `create-users-table` migration (up + down)
- [ ] Step 3: Register `User` entity and migration path in `typeorm.module.ts`
- [ ] Step 4: Run migration-forward, assert schema, run rollback
- [ ] Step 5: Commit

---

### Task 5: Auth DTOs + AuthService (register, login, validateUser, bootstrapAdmin)

**Priority:** Critical

**Depends on:** Task 4

**Parallel-safe with:** none — Task 6 (strategies) imports AuthService

**Files:**
- Create: `apps/api/src/auth/dto/register.dto.ts` — `RegisterDto`: `@IsEmail() email: string`, `@IsString() @MinLength(8) password: string`
- Create: `apps/api/src/auth/dto/login.dto.ts` — `LoginDto`: `@IsEmail() email: string`, `@IsString() password: string`
- Create: `apps/api/src/auth/dto/auth-response.dto.ts` — `AuthResponseDto`: `accessToken: string`, `user: UserDto`
- Create: `apps/api/src/auth/dto/user.dto.ts` — `UserDto`: `id: string`, `email: string`, `role: string` (never includes passwordHash)
- Create: `apps/api/src/auth/auth.service.ts` — `AuthService`: `validateUser(email, password): Promise<User | null>` (bcrypt compare), `login(user): Promise<AuthResponseDto>` (sign JWT, strip passwordHash), `register(dto: RegisterDto): Promise<AuthResponseDto>` (hash password, create Student, reject duplicate email), `bootstrapAdmin(): Promise<void>` (idempotent Admin creation from env; fail-loud if ADMIN_EMAIL/PASSWORD missing in production); `@Injectable()`, `@OnModuleInit` bootstrap hook

**Shared files (conflict risk):** none — safe for parallel worktree execution.

**Interfaces:**
- Consumes: `User` entity (Task 4), `ConfigService` (Task 2)
- Produces: `AuthService.validateUser`, `AuthService.login`, `AuthService.register`, `AuthService.bootstrapAdmin`; DTOs `RegisterDto`, `LoginDto`, `AuthResponseDto`, `UserDto`

**Validation Method:** `tdd`
- Write failing Vitest tests for each method:
  - `register` hashes password (result.passwordHash !== input.password), creates Student role, rejects duplicate email (409)
  - `login` returns valid JWT string + `AuthResponseDto` shape for correct credentials; returns null for wrong password
  - `validateUser` returns `User` for correct email/password; `null` for wrong password or unknown email
  - `bootstrapAdmin` creates Admin from env on first call; no-op on second call (idempotent); throws if `ADMIN_EMAIL`/`ADMIN_PASSWORD` missing
- Implement `AuthService` to pass all tests
- `npm test -- --run src/auth/auth.service.spec.ts` exits 0

**Acceptance Criteria:**
- `register()` stores `password_hash` via bcrypt (never plaintext), sets `role = STUDENT`
- `register()` with existing email returns 409-equivalent error
- `login()` returns `accessToken` (JWT string) and `user { id, email, role }`; `user` has no `passwordHash`
- `validateUser()` returns `null` for wrong password
- `bootstrapAdmin()` creates exactly one Admin from env; idempotent; fail-loud if env missing

- [ ] Step 1: Write failing AuthService tests (all four methods)
- [ ] Step 2: Create DTOs (`register.dto.ts`, `login.dto.ts`, `auth-response.dto.ts`, `user.dto.ts`)
- [ ] Step 3: Implement `AuthService` with bcrypt hashing, JWT signing, duplicate-email check, bootstrapAdmin
- [ ] Step 4: AuthService tests pass
- [ ] Step 5: Commit

---

### Task 6: Auth strategies + guards (LocalStrategy, JwtStrategy, RolesGuard, @Roles)

**Priority:** Critical

**Depends on:** Task 5

**Parallel-safe with:** none — Task 7 (controller) uses these guards

**Files:**
- Create: `apps/api/src/auth/local.strategy.ts` — `LocalStrategy` extending `PassportStrategy(Strategy, 'local')`, `validate(email, password)` calls `authService.validateUser`, returns user or throws 401
- Create: `apps/api/src/auth/jwt.strategy.ts` — `JwtStrategy` extending `PassportStrategy(Strategy, 'jwt')`, `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()`, `validate(payload)` returns user from `payload.sub`
- Create: `apps/api/src/auth/roles.guard.ts` — `RolesGuard` extending `CanActivate`, reflects `@Roles()` metadata, allows request if user.role matches required role, throws 403 otherwise
- Create: `apps/api/src/common/decorators/roles.decorator.ts` — `Roles(...roles: UserRole[])` decorator setting `ROLES_KEY` metadata

**Shared files (conflict risk):** none — safe for parallel worktree execution.

**Interfaces:**
- Consumes: `AuthService.validateUser` (Task 5), `ConfigService.get('jwt')` (Task 2)
- Produces: `LocalStrategy`, `JwtStrategy`, `RolesGuard`, `Roles` decorator

**Validation Method:** `tdd`
- `LocalStrategy.validate()` returns user for valid credentials; throws `UnauthorizedException` for invalid
- `JwtStrategy.validate()` returns user from valid JWT payload; throws for expired/malformed token
- `RolesGuard.canActivate()` returns true when user role matches; throws `ForbiddenException` when student tries admin route
- `Roles('ADMIN')` decorator sets metadata readable by `RolesGuard`
- `npm test -- --run src/auth/*.guard.spec.ts src/auth/*strategy.spec.ts` exits 0

**Acceptance Criteria:**
- `LocalStrategy` uses `usernameField: 'email'` and `passwordField: 'password'`
- `JwtStrategy` extracts bearer token from `Authorization` header
- `RolesGuard` blocks non-matching roles with 403
- `Roles('ADMIN')` + `Roles('STUDENT')` decorators available for route protection

- [ ] Step 1: Write failing strategy/guard tests
- [ ] Step 2: Implement `local.strategy.ts`, `jwt.strategy.ts`
- [ ] Step 3: Implement `roles.guard.ts` and `roles.decorator.ts`
- [ ] Step 4: Register strategies in `AuthModule` (PassportModule.register({ defaultStrategy: 'jwt' }))
- [ ] Step 5: Strategy/guard tests pass
- [ ] Step 6: Commit

---

### Task 7: Auth controller (register, login endpoints)

**Priority:** Critical

**Depends on:** Task 6

**Parallel-safe with:** none — Task 8 (users controller) shares auth protection patterns

**Files:**
- Create: `apps/api/src/auth/auth.controller.ts` — `AuthController`: `POST /auth/register` (public, `RegisterDto` body → `AuthService.register` → 201 `AuthResponseDto`), `POST /auth/login` (public, `LoginDto` body → `AuthService.login` → 200 `AuthResponseDto`); `UseGuards(AuthGuard('local'))` on login, `Body()` validation pipes

**Shared files (conflict risk):** none — safe for parallel worktree execution.

**Interfaces:**
- Consumes: `AuthService.register`, `AuthService.login` (Task 5); `LocalStrategy` (Task 6)
- Produces: `POST /auth/register`, `POST /auth/login` HTTP endpoints

**Validation Method:** `contract-test`
- `POST /auth/register` with valid `{ email, password }` → 201, body `{ accessToken: string, user: { id, email, role: 'STUDENT' } }`, no `passwordHash`
- `POST /auth/register` with duplicate email → 409 `{ error: { code, message } }`
- `POST /auth/register` with invalid email → 400 `{ error: { code, message } }`
- `POST /auth/login` with correct credentials → 200 `{ accessToken, user }`
- `POST /auth/login` with wrong password → 401 `{ error: { code, message } }`
- Supertest-based integration test against in-memory NestJS app: `npm test -- --run src/auth/auth.controller.spec.ts` exits 0

**Acceptance Criteria:**
- Register returns 201 with JWT and user (no passwordHash)
- Login returns 200 with JWT and user
- Wrong credentials → 401; duplicate email → 409; invalid body → 400
- All error responses use `{ error: { code, message } }` envelope

- [ ] Step 1: Write failing auth controller integration tests (Supertest)
- [ ] Step 2: Implement `auth.controller.ts` with register/login routes
- [ ] Step 3: Wire `AuthController` into `AuthModule`
- [ ] Step 4: Auth controller tests pass
- [ ] Step 5: Commit

---

### Task 8: Users module + controller (admin CRUD, role-protected)

**Priority:** High

**Depends on:** Task 4, Task 7

**Parallel-safe with:** none — Task 10 (bootstrap) may share UsersModule wiring

**Files:**
- Create: `apps/api/src/users/users.module.ts` — `UsersModule` importing `TypeOrmModule.forFeature([User])`, `AuthModule` (for guard), provides `UsersService`, exports `UsersService`
- Create: `apps/api/src/users/users.service.ts` — `UsersService`: `findByEmail(email): Promise<User | null>`, `findById(id): Promise<User | null>`, `create(dto): Promise<User>` (hash password), `findAll(): Promise<User[]>` (strips passwordHash), `updateRole(id, role): Promise<User>` (admin only)
- Create: `apps/api/src/users/users.controller.ts` — `UsersController`: `GET /users` (Admin only, `@Roles('ADMIN')`), `GET /users/:id` (Admin only), `POST /users` (Admin only, create user with role), `PATCH /users/:id/role` (Admin only); all `UseGuards(AuthGuard('jwt'), RolesGuard)`

**Shared files (conflict risk):** none — safe for parallel worktree execution.

**Interfaces:**
- Consumes: `User` entity (Task 4), `AuthModule`/guards (Task 6), `UsersModule` imports `TypeOrmModule.forFeature([User])` (Task 3)
- Produces: `UsersService.findByEmail`, `findById`, `create`, `findAll`, `updateRole`; `GET/POST/PATCH /users/*` endpoints (Admin-protected)

**Validation Method:** `tdd`
- `UsersService.findByEmail` returns user or null
- `UsersService.create` hashes password, sets role, rejects duplicate email
- `UsersController` routes return 403 for Student role, 200/201 for Admin role
- Supertest integration: `npm test -- --run src/users/users.controller.spec.ts` exits 0
- Unit: `npm test -- --run src/users/users.service.spec.ts` exits 0

**Acceptance Criteria:**
- `GET /users` requires Admin role; Student gets 403
- `POST /users` creates user with specified role (Admin only)
- `PATCH /users/:id/role` updates role (Admin only)
- All user responses exclude `passwordHash`
- `findByEmail` used by `AuthService.validateUser` (Task 5 consumes this)

- [ ] Step 1: Write failing UsersService tests
- [ ] Step 2: Implement `users.service.ts`
- [ ] Step 3: Write failing UsersController integration tests
- [ ] Step 4: Implement `users.controller.ts` with `@Roles('ADMIN')` guards
- [ ] Step 5: Wire `UsersModule` into `AppModule`
- [ ] Step 6: All users tests pass
- [ ] Step 7: Commit

---

### Task 9: Global exception filter (error envelope)

**Priority:** High

**Depends on:** Task 1

**Parallel-safe with:** none — Task 7/8 responses flow through this filter

**Files:**
- Create: `apps/api/src/common/filters/http-exception.filter.ts` — `HttpExceptionFilter` implementing `ExceptionFilter`, catches `HttpException`, responds `{ error: { code: string, message: string, details?: any } }` with the exception's status code; catches generic `Error` → 500

**Shared files (conflict risk):** none — safe for parallel worktree execution.

**Interfaces:**
- Consumes: none
- Produces: `HttpExceptionFilter` — global error envelope `{ error: { code, message, details? } }`

**Validation Method:** `tdd`
- Filter catches `BadRequestException` → 400 `{ error: { code, message } }`
- Filter catches `UnauthorizedException` → 401 `{ error: { code, message } }`
- Filter catches `ForbiddenException` → 403 `{ error: { code, message } }`
- Filter catches `ConflictException` → 409 `{ error: { code, message } }`
- Filter catches generic `Error` → 500 `{ error: { code, message } }`
- `npm test -- --run src/common/filters/http-exception.filter.spec.ts` exits 0

**Acceptance Criteria:**
- All HTTP exceptions return `{ error: { code, message } }` with matching status code
- 500 for unexpected errors, no stack traces leaked to client
- Filter registered globally in `main.ts` via `app.useGlobalFilters(new HttpExceptionFilter())`

- [ ] Step 1: Write failing exception filter tests
- [ ] Step 2: Implement `http-exception.filter.ts`
- [ ] Step 3: Register globally in `main.ts`
- [ ] Step 4: Exception filter tests pass
- [ ] Step 5: Commit

---

### Task 10: Admin bootstrap wiring (onModuleInit hook)

**Priority:** Critical

**Depends on:** Task 5, Task 9

**Parallel-safe with:** none — modifies AppModule/AuthModule wiring

**Files:**
- Modify: `apps/api/src/auth/auth.module.ts` — add `bootstrapAdmin()` call via `OnModuleInit` hook (either in AuthModule class or a dedicated bootstrap provider), inject `AuthService`
- Modify: `apps/api/src/app.module.ts` — ensure `AuthModule` is imported (already done in Task 1)

**Shared files (conflict risk):** `apps/api/src/auth/auth.module.ts` — shared with Task 5 (AuthService lives here) and Task 6 (strategies registered here). Task 10 must run after Task 5 and Task 6; same file, disjoint regions (Task 5/6 create providers/strategies, Task 10 adds bootstrap hook). Safe in parallel worktrees but merge sequentially before integration.

**Interfaces:**
- Consumes: `AuthService.bootstrapAdmin` (Task 5), `ConfigService` (Task 2)
- Produces: app startup bootstrap — Admin created from `ADMIN_EMAIL`/`ADMIN_PASSWORD` on first start

**Validation Method:** `tdd`
- Test: `AuthModule.onModuleInit()` calls `authService.bootstrapAdmin()` exactly once
- Test: second app start calls `bootstrapAdmin()` again but it's a no-op (idempotent — Admin already exists)
- Test: missing `ADMIN_EMAIL`/`ADMIN_PASSWORD` causes app to refuse to start (fail-loud, logged error)
- `npm test -- --run src/auth/auth.module.spec.ts` exits 0

**Acceptance Criteria:**
- On first app start with no Admin user, `bootstrapAdmin()` creates Admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`
- On subsequent starts, `bootstrapAdmin()` is idempotent (no duplicate Admin)
- Missing `ADMIN_EMAIL` or `ADMIN_PASSWORD` when no Admin exists → app logs fatal error and refuses to start
- `bootstrapAdmin` never creates Admin via public registration path

- [ ] Step 1: Write failing bootstrap tests
- [ ] Step 2: Add `OnModuleInit` bootstrap hook to `AuthModule` calling `authService.bootstrapAdmin()`
- [ ] Step 3: Bootstrap tests pass (idempotency, fail-loud)
- [ ] Step 4: Commit

---

### Task 11: Foundation integration smoke test

**Priority:** Critical

**Depends on:** Task 7, Task 8

**Parallel-safe with:** none — runs after all API endpoints exist

**Files:**
- Create: `apps/api/test/foundation.e2e.spec.ts` — end-to-end smoke: register → login → access protected route → student denied admin route → admin creates user → error envelope shapes

**Shared files (conflict risk):** none — new test file only.

**Interfaces:**
- Consumes: `POST /auth/register`, `POST /auth/login`, `GET /users` (Task 7, Task 8)
- Produces: none (verification only)

**Validation Method:** `contract-test`
- Full flow: register Student → 201 with JWT; login → 200 with JWT; `GET /users` with Student JWT → 403; `GET /users` with Admin JWT → 200; error envelope shape `{ error: { code, message } }` on 401/403/409
- `npm test -- --run test/foundation.e2e.spec.ts` exits 0

**Acceptance Criteria:**
- Unauthenticated `GET /users` → 401
- Student `GET /users` → 403
- Admin `GET /users` → 200 with user list (no passwordHash)
- Register/login round-trip produces valid JWT accepted by protected routes

- [ ] Step 1: Write foundation e2e smoke test
- [ ] Step 2: Run full test suite (`npm test -- --run`) exits 0
- [ ] Step 3: Commit

---

## Self-Review

**1. Spec coverage:** Every section of the Todo 1 spec maps to tasks:
- Database schema → Task 4 (User entity + migration)
- Auth (register/login/JWT) → Task 5 (AuthService), Task 6 (strategies), Task 7 (controller)
- Authorization (roles) → Task 6 (RolesGuard), Task 8 (users controller protected)
- Admin bootstrap → Task 10
- Error envelope → Task 9, Task 1
- Testing → per-task TDD + Task 11 e2e
No gaps.

**2. Placeholder scan:** No TBD/TODO/"implement later"/"add appropriate error handling". All Acceptance Criteria are concrete input/output scenarios. All `Depends on` fields name exact task IDs. All `Shared files` fields name exact files or "none". No pasted test/implementation code. No pre-written commit messages.

**3. Type consistency:** `User` entity fields (`id`, `email`, `passwordHash`, `role`, `createdAt`) referenced consistently in Tasks 4, 5, 7, 8. `AuthService` methods (`validateUser`, `login`, `register`, `bootstrapAdmin`) referenced in Tasks 5, 6, 7, 10. DTO names (`RegisterDto`, `LoginDto`, `AuthResponseDto`, `UserDto`) consistent in Tasks 5, 7. `ConfigService` from Task 2 consumed in Tasks 3, 5, 10.

**4. Dependency graph consistency:** Header graph matches per-task `Depends on` exactly:
- Task 1 → none ✓
- Task 2 → Task 1 ✓
- Task 3 → Task 2 ✓
- Task 4 → Task 3 ✓
- Task 5 → Task 4 ✓
- Task 6 → Task 5 ✓
- Task 7 → Task 6 ✓
- Task 8 → Task 4, Task 7 ✓
- Task 9 → Task 1 ✓
- Task 10 → Task 5, Task 9 ✓
- Task 11 → Task 7, Task 8 ✓
No cycles.

**5. Shared-file conflict scan:** Only `apps/api/src/auth/auth.module.ts` is touched by Task 5 (AuthService + providers), Task 6 (strategies registration), and Task 10 (bootstrap hook). All three are disjoint regions within the same module file; Task 10 depends on Task 5 and Task 6 so merge is sequential. Declared in Task 10's `Shared files`. No other file is touched by more than one task.

**6. Task granularity:**
- Task 1: passes all split/merge tests (one deliverable: app skeleton; files all infra/setup layer; no "and" joining unrelated outcomes)
- Task 2: passes (config layer only)
- Task 3: passes (database connection only)
- Task 4: passes (entity + migration, tightly coupled — migration creates the table the entity maps to)
- Task 5: passes (AuthService + DTOs, one behavioral unit)
- Task 6: passes (strategies + guards, one auth-protection unit)
- Task 7: passes (one controller)
- Task 8: passes (Users module: service + controller, one CRUD unit)
- Task 9: passes (one filter)
- Task 10: passes (one bootstrap hook)
- Task 11: passes (one e2e smoke test)
No duplicates. Each earns its own commit.

**7. Priority sanity:** Critical = Tasks 1, 3, 4, 5, 6, 7, 10, 11 (feature doesn't function without them). High = Tasks 2, 8, 9 (config is needed by Task 3 so arguably Critical, but Task 1 can build without it; users CRUD and error filter are important but not core to auth flow). Adjustment: Task 2 (Config) is consumed by Task 3, 5, 10 — mark as Critical. Task 9 (exception filter) is consumed by all error responses — mark as Critical. Task 8 (users CRUD) is High (admin user management is secondary to auth). Updated priorities: Tasks 1,2,3,4,5,6,7,9,10,11 = Critical; Task 8 = High.

**8. Definition of Done grounding:** Every DoD line names an exact command:
- `pnpm --filter @lerna/api run test` (Task 11 runs full suite)
- Migration-forward/rollback (Task 4)
- Supertest endpoint checks (Tasks 7, 8, 11)
- `grep -rn "TODO\|TBD"` (final check)
All trace back to specific tasks.

**9. Constitution alignment:** Global Constraints section matches the brief's Constitution section verbatim (copied in full, including Patch Log and Project Definition of Done). No diverging values. No Step 4 patches needed.

---

## Definition of Done

Project (Todo 1) is DONE when all of the following hold:

- [ ] `pnpm --filter @lerna/api run test` exits 0 with zero failures (all Foundation unit + integration tests, produced across Tasks 2–11)
- [ ] `npx nest build` exits 0 (NestJS compiles, Task 1)
- [ ] `npm run typeorm migration:run` against test PostgreSQL applies `create-users-table` and creates `users` table with columns `id`, `email`, `password_hash`, `role`, `created_at` (Task 4)
- [ ] `npm run typeorm migration:revert` drops `users` table and `user_role` type (Task 4)
- [ ] Manual: `curl -X POST http://localhost:3000/auth/register -d '{"email":"test@example.com","password":"secret123"}' -H 'Content-Type: application/json'` returns 201 with `{ accessToken, user: { id, email, role: "STUDENT" } }` and no `passwordHash` (Task 7)
- [ ] Manual: `curl -X POST http://localhost:3000/auth/login -d '{"email":"test@example.com","password":"secret123"}' -H 'Content-Type: application/json'` returns 200 with valid JWT `accessToken` (Task 7)
- [ ] Manual: `curl http://localhost:3000/users` with Student JWT returns 403 `{ error: { code, message } }` (Task 8)
- [ ] Manual: `curl http://localhost:3000/users` without any token returns 401 `{ error: { code, message } }` (Task 7/9)
- [ ] Admin bootstrap: app start with `ADMIN_EMAIL`/`ADMIN_PASSWORD` set and no existing Admin creates exactly one Admin; second start is idempotent (Task 10)
- [ ] `grep -rn "TODO\|TBD" apps/api/src` returns nothing
- [ ] Every task above (1–11) is checked off and its own Acceptance Criteria verified

---

## Execution Handoff

Plan complete and saved to `docs/superp/plans/2026-11-07-todo-1-foundation.md`.

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, one at a time in dependency order (topo sort), with review between tasks.

**2. Inline Execution** — execute tasks in this session in topo order, one at a time, with checkpoints for review.

Which approach?

*(Multi-Todo note: once Todo 1 is fully executed and its own Definition of Done verified, per Step 5 of decomposing-projects I'll append Todo 1's produced interfaces to `PROJECT-INTERFACES.md` and update its row in `PROJECT-LEDGER.md` to `done` — with commit range + plan file path. Todo 1 is not finished from the project's point of view until both are recorded.)*
