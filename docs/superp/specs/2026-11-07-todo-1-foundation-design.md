# Todo 1 Design — Foundation

> Scope: Database, Authentication, Authorization, User Roles.
> Depends on: (none) — first Todo in the Lerna dependency graph.
> Project: Lerna — Minimal Learning Management Platform.

## 1. Purpose & scope

Todo 1 establishes the runtime foundation every later Todo builds on:

- PostgreSQL database schema for the `User` entity (id, email, password_hash, role, created_at)
- Authentication: register (public, Student-only), login (email + password), logout (client-side token discard)
- Authorization: role-based access control (ADMIN vs STUDENT) enforced on the backend for every protected route
- Admin provisioning: bootstrap the initial Admin account from environment variables on first app startup

Out of scope for Todo 1: courses, sections, chapters, progress tracking, Markdown handling, student course flows — those are Todo 2–4.

## 2. Architecture

Three NestJS modules inside `apps/api`, plus shared infrastructure:

| Module | Responsibility |
|---|---|
| `AuthModule` | register, login, logout, JWT strategy, local strategy |
| `UsersModule` | user CRUD, role enforcement, admin bootstrap on startup |
| Shared | `ConfigModule` (env), `TypeOrmModule` (PostgreSQL), JWT module |

Data flow:

- **Register (public):** `POST /auth/register` → validate `RegisterDto` → hash password with bcrypt → create `User(role=STUDENT)` → sign JWT → return `AuthResponseDto`
- **Login (public):** `POST /auth/login` → validate `LoginDto` → bcrypt compare → sign JWT → return `AuthResponseDto`
- **Logout:** client discards the token; backend is stateless (no server session)
- **Admin bootstrap (startup):** if no `ADMIN` user exists, create one from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars; idempotent no-op if an admin already exists; fails loudly if env vars missing in production

## 3. Components

### `User` entity (TypeORM)

| Field | Type | Constraint |
|---|---|---|
| id | uuid | primary key, generated |
| email | varchar | unique, indexed |
| password_hash | varchar | not null |
| role | enum (`ADMIN`, `STUDENT`) | not null, default `STUDENT` |
| created_at | timestamp | not null, default now |

### `AuthService`

- `validateUser(email, password): Promise<User | null>` — bcrypt compare
- `login(user): Promise<AuthResponseDto>` — sign JWT, strip `password_hash`
- `register(dto): Promise<AuthResponseDto>` — hash + create Student
- `bootstrapAdmin(): Promise<void>` — idempotent Admin creation from env

### `UsersService`

- `findByEmail(email)`, `findById(id)`, `create(dto)`, role checks

### `JwtStrategy` / `LocalStrategy` / `RolesGuard`

- Bearer-token extraction + signature validation
- Email/password validation for login
- ADMIN-only route protection (backend-enforced on every protected route)

### DTOs (camelCase at the API boundary; `password_hash` never exposed)

- `RegisterDto`: `email: string`, `password: string`
- `LoginDto`: `email: string`, `password: string`
- `AuthResponseDto`: `accessToken: string`, `user: { id: string; email: string; role: string }`
- `UserDto`: `id: string`, `email: string`, `role: string`

## 4. Database

Single migration `CreateUsersTable`:

```sql
CREATE TYPE user_role AS ENUM ('ADMIN', 'STUDENT');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'STUDENT',
  created_at timestamp NOT NULL DEFAULT now()
);
```

No `synchronize` in application environments — migrations only.

## 5. Error handling

Global `HttpExceptionFilter` returns a consistent envelope:

```json
{ "error": { "code": "<code>", "message": "<message>", "details?": "<...>" } }
```

| Status | When |
|---|---|
| 400 | validation failure |
| 401 | invalid credentials / missing or invalid token |
| 403 | Student attempts an admin-only route (IDOR/role escalation blocked) |
| 409 | duplicate email on register |
| 500 | unexpected server error |

## 6. Testing (Vitest + NestJS testing utilities)

- `AuthService`: register hashes password; login rejects wrong password; `bootstrapAdmin` is idempotent (second call is a no-op)
- `AuthController`: register/login return correct status codes and shapes; unauthenticated access returns 401
- `RolesGuard`: admin-only routes reject a Student role with 403
- `UsersModule`: unique email constraint enforced at the database level

## 7. Environment variables

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | yes |
| `JWT_SECRET` | JWT signing secret | yes |
| `JWT_EXPIRES_IN` | access token TTL | yes (default `7d`) |
| `BCRYPT_SALT_ROUNDS` | bcrypt cost factor | yes (default `12`) |
| `ADMIN_EMAIL` | bootstrap Admin email | required for admin bootstrap |
| `ADMIN_PASSWORD` | bootstrap Admin password | required for admin bootstrap |

Admin bootstrap runs on module `onModuleInit`. If `ADMIN_EMAIL`/`ADMIN_PASSWORD` are missing and no Admin exists yet, the app logs a fatal error and refuses to start (fail-safe, never silently allows open registration).

## 8. Definition of Done (Todo 1)

- [ ] `pnpm --filter @lerna/api run test` passes (all Foundation tests green)
- [ ] `pnpm --filter @lerna/api run migration:run` applies `CreateUsersTable` against a test PostgreSQL instance
- [ ] Register as Student → login → protected route returns 200; same flow as unregistered user returns 401
- [ ] Student attempting an admin-only route returns 403
- [ ] Duplicate email register returns 409
- [ ] `bootstrapAdmin` creates Admin from env on first start; idempotent on subsequent starts
- [ ] No `password_hash` leaks in any API response shape
