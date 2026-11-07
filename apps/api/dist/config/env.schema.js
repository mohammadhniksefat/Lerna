"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = void 0;
const validateEnv = (config) => {
    const errors = [];
    if (!config.DATABASE_URL || typeof config.DATABASE_URL !== 'string') {
        errors.push('DATABASE_URL is required');
    }
    if (!config.JWT_SECRET || typeof config.JWT_SECRET !== 'string') {
        errors.push('JWT_SECRET is required');
    }
    if (errors.length > 0) {
        throw new Error(`Environment validation failed: ${errors.join(', ')}`);
    }
    return {
        DATABASE_URL: config.DATABASE_URL,
        JWT_SECRET: config.JWT_SECRET,
        JWT_EXPIRES_IN: config.JWT_EXPIRES_IN ?? '7d',
        BCRYPT_SALT_ROUNDS: Number(config.BCRYPT_SALT_ROUNDS) || 12,
        ADMIN_EMAIL: config.ADMIN_EMAIL ?? '',
        ADMIN_PASSWORD: config.ADMIN_PASSWORD ?? '',
        NODE_ENV: config.NODE_ENV ?? 'development',
        PORT: Number(config.PORT) || 3000,
    };
};
exports.validateEnv = validateEnv;
//# sourceMappingURL=env.schema.js.map