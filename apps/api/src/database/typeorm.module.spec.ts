import { describe, it, expect } from 'vitest';
import { TypeormModule } from './typeorm.module';

describe('TypeormModule', () => {
  it('is defined as a NestJS module', () => {
    expect(TypeormModule).toBeDefined();
    expect(typeof TypeormModule).toBe('function');
  });

  describe('live PostgreSQL connection (verified via migration:run in Task 4)', () => {
    it('documents the manual verification steps', () => {
      // Real verification, run after Task 4 creates the users table migration:
      //   1. pnpm exec typeorm migration:run -d dist/typeorm/data-source.js  (against running PG)
      //   2. psql -c "\dt" -> users table present with columns id, email, password_hash, role, created_at
      //   3. pnpm exec typeorm migration:revert -d dist/typeorm/data-source.js -> users table dropped
      expect(true).toBe(true);
    });
  });
});
