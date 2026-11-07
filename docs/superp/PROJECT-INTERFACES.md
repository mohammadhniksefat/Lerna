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
