import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';

const mockUserRepository = () => ({
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  find: vi.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: ReturnType<typeof mockUserRepository>;

  beforeEach(() => {
    userRepository = mockUserRepository();
    service = new UsersService(
      userRepository as unknown as Repository<User>,
    );
  });

  describe('findByEmail', () => {
    it('returns user when email exists', async () => {
      userRepository.findOne = vi.fn().mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        role: UserRole.STUDENT,
      });

      const result = await service.findByEmail('user@example.com');

      expect(result).toEqual({
        id: '1',
        email: 'user@example.com',
        role: UserRole.STUDENT,
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
    });

    it('returns null when email not found', async () => {
      userRepository.findOne = vi.fn().mockResolvedValue(null);

      const result = await service.findByEmail('nope@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns user when id exists', async () => {
      userRepository.findOne = vi.fn().mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        role: UserRole.STUDENT,
      });

      const result = await service.findById('1');

      expect(result).toEqual({
        id: '1',
        email: 'user@example.com',
        role: UserRole.STUDENT,
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('returns null when id not found', async () => {
      userRepository.findOne = vi.fn().mockResolvedValue(null);

      const result = await service.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      userRepository.find = vi.fn().mockResolvedValue([
        { id: '1', email: 'a@example.com', role: UserRole.ADMIN },
        { id: '2', email: 'b@example.com', role: UserRole.STUDENT },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe(UserRole.ADMIN);
    });
  });

  describe('create', () => {
    it('hashes password, sets role, returns user', async () => {
      const bcrypt = require('bcryptjs');
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      userRepository.findOne = vi.fn().mockResolvedValue(null);
      userRepository.create = vi.fn().mockImplementation((dto) => dto);
      userRepository.save = vi.fn().mockResolvedValue({
        id: '1',
        email: 'new@example.com',
        role: UserRole.STUDENT,
      });

      const result = await service.create(
        'new@example.com',
        'secret1234',
        UserRole.STUDENT,
      );

      expect(result).toEqual({
        id: '1',
        email: 'new@example.com',
        role: UserRole.STUDENT,
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        passwordHash: 'hashed-password',
        role: UserRole.STUDENT,
      });
    });

    it('rejects duplicate email', async () => {
      userRepository.findOne = vi.fn().mockResolvedValue({
        id: '1',
        email: 'existing@example.com',
      } as User);

      await expect(
        service.create('existing@example.com', 'secret1234'),
      ).rejects.toThrow(/already exists/);
    });
  });

  describe('updateRole', () => {
    it('updates role and returns user', async () => {
      userRepository.findOne = vi.fn().mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        role: UserRole.STUDENT,
      });
      userRepository.save = vi.fn().mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        role: UserRole.ADMIN,
      });

      const result = await service.updateRole('1', UserRole.ADMIN);

      expect(result.role).toBe(UserRole.ADMIN);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });

    it('throws when user not found', async () => {
      userRepository.findOne = vi.fn().mockResolvedValue(null);

      await expect(
        service.updateRole('999', UserRole.ADMIN),
      ).rejects.toThrow(/not found/);
    });
  });
});
