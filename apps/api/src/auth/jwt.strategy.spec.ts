import { describe, it, expect, vi } from 'vitest';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  it('returns user for valid JWT payload', async () => {
    const configService = {
      get: vi.fn(() => 'test-secret'),
    };
    const authService = {
      findByEmail: vi.fn().mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        role: 'STUDENT',
      }),
    };
    const strategy = new JwtStrategy(
      configService as any,
      authService as any,
    );

    const result = await strategy.validate({ sub: '1', email: 'user@example.com' });

    expect(result.email).toBe('user@example.com');
    expect(authService.findByEmail).toHaveBeenCalledWith('user@example.com');
  });

  it('throws UnauthorizedException for unknown user', async () => {
    const configService = {
      get: vi.fn(() => 'test-secret'),
    };
    const authService = {
      findByEmail: vi.fn().mockResolvedValue(null),
    };
    const strategy = new JwtStrategy(
      configService as any,
      authService as any,
    );

    await expect(
      strategy.validate({ sub: '999', email: 'unknown@example.com' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
