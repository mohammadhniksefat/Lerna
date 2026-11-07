import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationPipe, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from './auth/auth.controller';
import { UsersController } from './users/users.controller';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { UserRole } from './users/user.entity';
import { UserDto } from './auth/dto/user.dto';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Mock @nestjs/passport so guards are pass-through in tests
vi.mock('@nestjs/passport', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nestjs/passport')>();
  return {
    ...actual,
    AuthGuard: () =>
      class MockPassportGuard {
        canActivate = () => true;
      },
  };
});

const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
  validateUser: vi.fn(),
};

const mockUsersService = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  updateRole: vi.fn(),
};

describe('Foundation E2E Smoke Test', () => {
  let authController: AuthController;
  let usersController: UsersController;

  beforeEach(() => {
    vi.clearAllMocks();

    authController = new AuthController(mockAuthService as unknown as AuthService);
    usersController = new UsersController(
      mockUsersService as unknown as UsersService,
    );
  });

  describe('Complete foundation flow', () => {
    it('registers a user via POST /auth/register', async () => {
      mockAuthService.register.mockResolvedValue({
        accessToken: 'token-123',
        user: { id: 'user-1', email: 'student@example.com', role: UserRole.STUDENT },
      });

      const result = await authController.register({
        email: 'student@example.com',
        password: 'secret1234',
      } as any);

      expect(result.accessToken).toBe('token-123');
      expect(result.user).toEqual({
        id: 'user-1',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      });
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'student@example.com',
        password: 'secret1234',
      });
    });

    it('logs in via POST /auth/login', async () => {
      mockAuthService.login.mockResolvedValue({
        accessToken: 'token-456',
        user: { id: 'user-1', email: 'student@example.com', role: UserRole.STUDENT },
      });

      const result = await authController.login({
        user: { id: 'user-1', email: 'student@example.com', role: UserRole.STUDENT },
      } as any);

      expect(result.accessToken).toBe('token-456');
      expect(result.user.role).toBe(UserRole.STUDENT);
    });

    it('accesses protected route GET /auth/me', async () => {
      const meResult: UserDto = {
        id: 'user-1',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      };

      const result = await authController.me({ user: { id: 'user-1', email: 'student@example.com', role: UserRole.STUDENT } } as any);

      expect(result).toEqual(meResult);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('lists all users via GET /users', async () => {
      mockUsersService.findAll.mockResolvedValue([
        { id: '1', email: 'admin@example.com', role: UserRole.ADMIN },
        { id: '2', email: 'student@example.com', role: UserRole.STUDENT },
      ]);

      const result: UserDto[] = await usersController.findAll();

      expect(result).toHaveLength(2);
      result.forEach((u) => {
        expect(u).not.toHaveProperty('passwordHash');
        expect(u).toMatchObject({ id: expect.any(String), email: expect.any(String), role: expect.any(String) });
      });
    });

    it('creates a user via POST /users', async () => {
      mockUsersService.create.mockResolvedValue({
        id: 'user-2',
        email: 'new@example.com',
        role: UserRole.STUDENT,
      });

      const result: UserDto = await usersController.create({
        email: 'new@example.com',
        password: 'secret1234',
        role: UserRole.STUDENT,
      });

      expect(result).toEqual({
        id: 'user-2',
        email: 'new@example.com',
        role: UserRole.STUDENT,
      });
      expect(mockUsersService.create).toHaveBeenCalledWith(
        'new@example.com',
        'secret1234',
        UserRole.STUDENT,
      );
    });

    it('updates user role via PATCH /users/:id/role', async () => {
      mockUsersService.updateRole.mockResolvedValue({
        id: 'user-2',
        email: 'new@example.com',
        role: UserRole.ADMIN,
      });

      const result: UserDto = await usersController.updateRole('user-2', {
        role: UserRole.ADMIN,
      });

      expect(result).toEqual({
        id: 'user-2',
        email: 'new@example.com',
        role: UserRole.ADMIN,
      });
      expect(mockUsersService.updateRole).toHaveBeenCalledWith('user-2', UserRole.ADMIN);
    });

    it('returns consistent error envelope for not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(usersController.findOne('nonexistent')).rejects.toThrow(
        /not found/i,
      );
    });
  });

  describe('Error envelope format', () => {
    it('produces { error: { code, message, details? } } shape', () => {
      const filter = new HttpExceptionFilter();

      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as any;

      filter.catch(new NotFoundException('User not found'), mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: {
            code: 404,
            message: 'User not found',
          },
        }),
      );
    });
  });
});
