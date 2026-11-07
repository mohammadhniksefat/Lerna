import { describe, it, expect, afterAll, afterEach } from 'vitest';
import { configuration } from './configuration';
import { validateEnv } from './env.schema';

describe('configuration', () => {
  const originalEnv = { ...process.env };

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns expected shape from env vars', () => {
    process.env.DATABASE_URL = 'postgres://postgres:lerna@localhost:5432/lerna';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.BCRYPT_SALT_ROUNDS = '10';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_PASSWORD = 'admin-secret';

    const config = configuration();

    expect(config.database.url).toBe('postgres://postgres:lerna@localhost:5432/lerna');
    expect(config.jwt.secret).toBe('test-secret');
    expect(config.jwt.expiresIn).toBe('1h');
    expect(config.bcrypt.saltRounds).toBe(10);
    expect(config.admin.email).toBe('admin@example.com');
    expect(config.admin.password).toBe('admin-secret');
  });

  it('applies defaults when env vars are missing', () => {
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.BCRYPT_SALT_ROUNDS;

    const config = configuration();

    expect(config.jwt.expiresIn).toBe('7d');
    expect(config.bcrypt.saltRounds).toBe(12);
  });
});

describe('validateEnv', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = originalEnv;
  });

  it('validates a complete env config', () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/lerna';
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_EXPIRES_IN = '7d';
    process.env.BCRYPT_SALT_ROUNDS = '12';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_PASSWORD = 'secret';
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3000';

    const config = validateEnv(process.env as Record<string, unknown>);

    expect(config.DATABASE_URL).toBe('postgres://localhost:5432/lerna');
    expect(config.JWT_SECRET).toBe('secret');
  });

  it('rejects missing DATABASE_URL', () => {
    process.env.JWT_SECRET = 'secret';
    delete process.env.DATABASE_URL;

    expect(() => validateEnv(process.env as Record<string, unknown>)).toThrow(
      'DATABASE_URL is required',
    );
  });

  it('rejects missing JWT_SECRET', () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/lerna';
    delete process.env.JWT_SECRET;

    expect(() => validateEnv(process.env as Record<string, unknown>)).toThrow(
      'JWT_SECRET is required',
    );
  });

  it('defaults JWT_EXPIRES_IN to 7d', () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/lerna';
    process.env.JWT_SECRET = 'secret';
    delete process.env.JWT_EXPIRES_IN;

    const config = validateEnv(process.env as Record<string, unknown>);

    expect(config.JWT_EXPIRES_IN).toBe('7d');
  });

  it('defaults BCRYPT_SALT_ROUNDS to 12', () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/lerna';
    process.env.JWT_SECRET = 'secret';
    delete process.env.BCRYPT_SALT_ROUNDS;

    const config = validateEnv(process.env as Record<string, unknown>);

    expect(config.BCRYPT_SALT_ROUNDS).toBe(12);
  });
});
