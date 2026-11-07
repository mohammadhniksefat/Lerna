import { describe, it, expect, vi } from 'vitest';
import { LocalStrategy } from './local.strategy';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalStrategy', () => {
  it('validates user and returns user object for correct credentials', async () => {
    const authService = {
      validateUser: vi.fn().mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        role: 'STUDENT',
      }),
    };
    const strategy = new LocalStrategy(authService as any);

    const result = await strategy.validate('user@example.com', 'correctpassword');

    expect(result.email).toBe('user@example.com');
    expect(result.role).toBe('STUDENT');
    expect(authService.validateUser).toHaveBeenCalledWith(
      'user@example.com',
      'correctpassword',
    );
  });

  it('throws UnauthorizedException for invalid credentials', async () => {
    const authService = {
      validateUser: vi.fn().mockResolvedValue(null),
    };
    const strategy = new LocalStrategy(authService as any);

    await expect(
      strategy.validate('user@example.com', 'wrongpassword'),
    ).rejects.toThrow(UnauthorizedException);
  });
});

