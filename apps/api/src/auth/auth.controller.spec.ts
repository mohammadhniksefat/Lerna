import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/user.entity';

const mockAuthService = {
  validateUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    controller = new AuthController(mockAuthService as any);
  });

  describe('register', () => {
    it('should register a new user and return access token', async () => {
      const expected = {
        accessToken: 'token-123',
        user: { id: '123', email: 'new@example.com', role: UserRole.STUDENT },
      };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register({
        email: 'new@example.com',
        password: 'secret1234',
      } as any);

      expect(result).toEqual(expected);
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'secret1234',
      });
    });

    it('should reject duplicate email with 409', async () => {
      mockAuthService.register.mockRejectedValue(
        new ConflictException('User with email existing@example.com already exists'),
      );

      await expect(
        controller.register({
          email: 'existing@example.com',
          password: 'secret1234',
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login with correct credentials and return access token', async () => {
      const expected = {
        accessToken: 'token-123',
        user: { id: '1', email: 'user@example.com', role: UserRole.STUDENT },
      };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login({
        user: { id: '1', email: 'user@example.com', role: UserRole.STUDENT },
      } as any);

      expect(result).toEqual(expected);
    });

    it('should reject wrong credentials with 401', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        controller.login({ user: null } as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('me', () => {
    it('should return current user', async () => {
      const user = { id: '1', email: 'user@example.com', role: UserRole.STUDENT };
      const result = await controller.me({ user } as any);

      expect(result.id).toBe('1');
      expect(result.email).toBe('user@example.com');
      expect(result.role).toBe('STUDENT');
    });
  });
});
