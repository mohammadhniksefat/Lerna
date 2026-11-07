"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const configuration_1 = require("./configuration");
const env_schema_1 = require("./env.schema");
(0, vitest_1.describe)('configuration', () => {
    const originalEnv = { ...process.env };
    (0, vitest_1.afterAll)(() => {
        process.env = originalEnv;
    });
    (0, vitest_1.it)('returns expected shape from env vars', () => {
        process.env.DATABASE_URL = 'postgres://postgres:lerna@localhost:5432/lerna';
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_EXPIRES_IN = '1h';
        process.env.BCRYPT_SALT_ROUNDS = '10';
        process.env.ADMIN_EMAIL = 'admin@example.com';
        process.env.ADMIN_PASSWORD = 'admin-secret';
        const config = (0, configuration_1.configuration)();
        (0, vitest_1.expect)(config.database.url).toBe('postgres://postgres:lerna@localhost:5432/lerna');
        (0, vitest_1.expect)(config.jwt.secret).toBe('test-secret');
        (0, vitest_1.expect)(config.jwt.expiresIn).toBe('1h');
        (0, vitest_1.expect)(config.bcrypt.saltRounds).toBe(10);
        (0, vitest_1.expect)(config.admin.email).toBe('admin@example.com');
        (0, vitest_1.expect)(config.admin.password).toBe('admin-secret');
    });
    (0, vitest_1.it)('applies defaults when env vars are missing', () => {
        delete process.env.JWT_EXPIRES_IN;
        delete process.env.BCRYPT_SALT_ROUNDS;
        const config = (0, configuration_1.configuration)();
        (0, vitest_1.expect)(config.jwt.expiresIn).toBe('7d');
        (0, vitest_1.expect)(config.bcrypt.saltRounds).toBe(12);
    });
});
(0, vitest_1.describe)('validateEnv', () => {
    const originalEnv = { ...process.env };
    (0, vitest_1.afterEach)(() => {
        process.env = originalEnv;
    });
    (0, vitest_1.it)('validates a complete env config', () => {
        process.env.DATABASE_URL = 'postgres://localhost:5432/lerna';
        process.env.JWT_SECRET = 'secret';
        process.env.JWT_EXPIRES_IN = '7d';
        process.env.BCRYPT_SALT_ROUNDS = '12';
        process.env.ADMIN_EMAIL = 'admin@example.com';
        process.env.ADMIN_PASSWORD = 'secret';
        process.env.NODE_ENV = 'development';
        process.env.PORT = '3000';
        const config = (0, env_schema_1.validateEnv)(process.env);
        (0, vitest_1.expect)(config.DATABASE_URL).toBe('postgres://localhost:5432/lerna');
        (0, vitest_1.expect)(config.JWT_SECRET).toBe('secret');
    });
    (0, vitest_1.it)('rejects missing DATABASE_URL', () => {
        process.env.JWT_SECRET = 'secret';
        delete process.env.DATABASE_URL;
        (0, vitest_1.expect)(() => (0, env_schema_1.validateEnv)(process.env)).toThrow('DATABASE_URL is required');
    });
    (0, vitest_1.it)('rejects missing JWT_SECRET', () => {
        process.env.DATABASE_URL = 'postgres://localhost:5432/lerna';
        delete process.env.JWT_SECRET;
        (0, vitest_1.expect)(() => (0, env_schema_1.validateEnv)(process.env)).toThrow('JWT_SECRET is required');
    });
    (0, vitest_1.it)('defaults JWT_EXPIRES_IN to 7d', () => {
        process.env.DATABASE_URL = 'postgres://localhost:5432/lerna';
        process.env.JWT_SECRET = 'secret';
        delete process.env.JWT_EXPIRES_IN;
        const config = (0, env_schema_1.validateEnv)(process.env);
        (0, vitest_1.expect)(config.JWT_EXPIRES_IN).toBe('7d');
    });
    (0, vitest_1.it)('defaults BCRYPT_SALT_ROUNDS to 12', () => {
        process.env.DATABASE_URL = 'postgres://localhost:5432/lerna';
        process.env.JWT_SECRET = 'secret';
        delete process.env.BCRYPT_SALT_ROUNDS;
        const config = (0, env_schema_1.validateEnv)(process.env);
        (0, vitest_1.expect)(config.BCRYPT_SALT_ROUNDS).toBe(12);
    });
});
//# sourceMappingURL=config.module.spec.js.map