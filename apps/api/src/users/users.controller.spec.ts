import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { UserDto } from '../auth/dto/user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  const mockUsersService = {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateRole: vi.fn(),
  };

  beforeEach(() => {
    controller = new UsersController(mockUsersService as unknown as UsersService);
  });

  describe('GET /users (findAll)', () => {
    it('returns list of users without passwordHash', async () => {
      mockUsersService.findAll.mockResolvedValue([
        { id: '1', email: 'admin@example.com', role: UserRole.ADMIN, passwordHash: 'secret' },
        { id: '2', email: 'student@example.com', role: UserRole.STUDENT, passwordHash: 'secret' },
      ]);

      const result: UserDto[] = await controller.findAll();

      expect(result).toEqual([
        { id: '1', email: 'admin@example.com', role: UserRole.ADMIN },
        { id: '2', email: 'student@example.com', role: UserRole.STUDENT },
      ]);
      expect(mockUsersService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /users/:id (findOne)', () => {
    it('returns a single user without passwordHash', async () => {
      mockUsersService.findById.mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        role: UserRole.STUDENT,
        passwordHash: 'secret',
      });

      const result: UserDto = await controller.findOne('1');

      expect(result).toEqual({
        id: '1',
        email: 'user@example.com',
        role: UserRole.STUDENT,
      });
      expect(mockUsersService.findById).toHaveBeenCalledWith('1');
    });

    it('throws NotFoundException when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(controller.findOne('999')).rejects.toThrow(/not found/i);
    });
  });

  describe('POST /users (create)', () => {
    it('creates a new user with specified role', async () => {
      mockUsersService.create.mockResolvedValue({
        id: '3',
        email: 'new@example.com',
        role: UserRole.STUDENT,
        passwordHash: 'hashed',
      });

      const result: UserDto = await controller.create({
        email: 'new@example.com',
        password: 'secret1234',
        role: UserRole.STUDENT,
      });

      expect(result).toEqual({
        id: '3',
        email: 'new@example.com',
        role: UserRole.STUDENT,
      });
      expect(mockUsersService.create).toHaveBeenCalledWith(
        'new@example.com',
        'secret1234',
        UserRole.STUDENT,
      );
    });

    it('defaults role to STUDENT when not provided', async () => {
      mockUsersService.create.mockResolvedValue({
        id: '3',
        email: 'new@example.com',
        role: UserRole.STUDENT,
        passwordHash: 'hashed',
      });

      const result: UserDto = await controller.create({
        email: 'new@example.com',
        password: 'secret1234',
      });

      expect(mockUsersService.create).toHaveBeenCalledWith(
        'new@example.com',
        'secret1234',
        UserRole.STUDENT,
      );
      expect(result.role).toBe(UserRole.STUDENT);
    });
  });

  describe('PATCH /users/:id/role (updateRole)', () => {
    it('updates user role and returns user without passwordHash', async () => {
      mockUsersService.updateRole.mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        role: UserRole.ADMIN,
        passwordHash: 'secret',
      });

      const result: UserDto = await controller.updateRole('1', { role: UserRole.ADMIN });

      expect(result).toEqual({
        id: '1',
        email: 'user@example.com',
        role: UserRole.ADMIN,
      });
      expect(mockUsersService.updateRole).toHaveBeenCalledWith('1', UserRole.ADMIN);
    });
  });
});
