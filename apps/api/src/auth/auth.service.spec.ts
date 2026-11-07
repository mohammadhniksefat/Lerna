import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/user.entity';

const mockUserRepository = () => ({
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
});

const mockConfigService = {
  get: vi.fn((key: string) => {
    const config: Record<string, string | number> = {
      'jwt.secret': 'test-secret',
      'jwt.expiresIn': '1h',
      'bcrypt.saltRounds': 10,
      'admin.email': 'admin@example.com',
      'admin.password': 'admin-secret',
    };
    return config[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let configService: typeof mockConfigService;

  beforeEach(() => {
    userRepository = mockUserRepository();
    configService = mockConfigService;
    vi.clearAllMocks();

    service = new AuthService(
      userRepository as unknown as Repository<User>,
      configService as any,
    );
  });

  describe('register', () => {
    it('hashes password, creates Student role, returns AuthResponseDto without passwordHash', async () => {
      const dto = { email: 'new@example.com', password: 'secret1234' };
      userRepository.findOne = vi.fn().mockResolvedValue(null);
      userRepository.create = vi.fn().mockImplementation((dto) => dto);
      userRepository.save = vi.fn().mockResolvedValue({
        id: '123',
        ...dto,
        passwordHash: 'hashed',
        role: UserRole.STUDENT,
      });

      const result = await service.register(dto as any);

      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
      expect(result.user.email).toBe('new@example.com');
      expect(result.user.role).toBe('STUDENT');
      expect((result as any).user.passwordHash).toBeUndefined();
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          role: UserRole.STUDENT,
        }),
      );
      // passwordHash should not be plaintext
      const createCall = (userRepository.create as any).mock.calls[0][0];
      expect(createCall.passwordHash).not.toBe('secret1234');
      expect(createCall.passwordHash.length).toBeGreaterThan(20);
    });

    it('rejects duplicate email', async () => {
      const dto = { email: 'existing@example.com', password: 'secret1234' };
      userRepository.findOne = vi.fn().mockResolvedValue({
        id: '1',
        email: 'existing@example.com',
      } as User);

      await expect(service.register(dto as any)).rejects.toThrow(
        /already exists/,
      );
    });
  });

  describe('login', () => {
    it('returns accessToken and user for correct credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('correctpassword', 10);
      const user = {
        id: '1',
        email: 'user@example.com',
        passwordHash: hash,
        role: UserRole.STUDENT,
      } as User;
      userRepository.findOne = vi.fn().mockResolvedValue(user);

      const result = await service.login(user);

      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
      expect(result.user.id).toBe('1');
      expect(result.user.email).toBe('user@example.com');
      expect(result.user.role).toBe('STUDENT');
      expect((result.user as any).passwordHash).toBeUndefined();
    });
  });

  describe('validateUser', () => {
    it('returns User for correct email/password', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('correctpassword', 10);
      const user = {
        id: '1',
        email: 'user@example.com',
        passwordHash: hash,
        role: UserRole.STUDENT,
      } as User;
      userRepository.findOne = vi.fn().mockResolvedValue(user);

      const result = await service.validateUser(
        'user@example.com',
        'correctpassword',
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
      expect(result?.email).toBe('user@example.com');
    });

    it('returns null for wrong password', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('correctpassword', 10);
      const user = {
        id: '1',
        email: 'user@example.com',
        passwordHash: hash,
        role: UserRole.STUDENT,
      } as User;
      userRepository.findOne = vi.fn().mockResolvedValue(user);

      const result = await service.validateUser(
        'user@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });

    it('returns null for unknown email', async () => {
      userRepository.findOne = vi.fn().mockResolvedValue(null);

      const result = await service.validateUser('nope@example.com', 'anything');

      expect(result).toBeNull();
    });
  });

  describe('bootstrapAdmin', () => {
    it('creates Admin from env on first call', async () => {
      userRepository.findOne = vi.fn().mockResolvedValue(null);
      userRepository.create = vi.fn().mockImplementation((dto) => dto);
      userRepository.save = vi.fn().mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      });

      await service.bootstrapAdmin();

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        }),
      );
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });

    it('is idempotent - no-op when Admin already exists', async () => {
      userRepository.findOne = vi.fn().mockResolvedValue({
        id: 'admin-1',
        role: UserRole.ADMIN,
      } as User);

      await service.bootstrapAdmin();

      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('throws when ADMIN_EMAIL/ADMIN_PASSWORD missing', async () => {
      const missingConfig = {
        get: vi.fn((key: string) => {
          if (key === 'admin.email') return undefined;
          if (key === 'admin.password') return undefined;
          if (key === 'bcrypt.saltRounds') return 10;
          return undefined;
        }),
      };

      const svc = new AuthService(
        userRepository as unknown as Repository<User>,
        missingConfig as any,
      );
      userRepository.findOne = vi.fn().mockResolvedValue(null);

      await expect(svc.bootstrapAdmin()).rejects.toThrow(
        /ADMIN_EMAIL and ADMIN_PASSWORD/,
      );
    });
  });
});
