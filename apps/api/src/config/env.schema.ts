export type EnvConfig = Record<string, unknown>;

export const validateEnv = (config: EnvConfig): EnvConfig => {
  const errors: string[] = [];

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
    JWT_EXPIRES_IN: (config.JWT_EXPIRES_IN as string) ?? '7d',
    BCRYPT_SALT_ROUNDS: Number(config.BCRYPT_SALT_ROUNDS) || 12,
    ADMIN_EMAIL: (config.ADMIN_EMAIL as string) ?? '',
    ADMIN_PASSWORD: (config.ADMIN_PASSWORD as string) ?? '',
    NODE_ENV: (config.NODE_ENV as string) ?? 'development',
    PORT: Number(config.PORT) || 3000,
  };
};
