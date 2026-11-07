"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const auth_service_1 = require("./auth.service");
const user_entity_1 = require("../users/user.entity");
const mockUserRepository = () => ({
    findOne: vitest_1.vi.fn(),
    create: vitest_1.vi.fn(),
    save: vitest_1.vi.fn(),
});
const mockConfigService = {
    get: vitest_1.vi.fn((key) => {
        const config = {
            'jwt.secret': 'test-secret',
            'jwt.expiresIn': '1h',
            'bcrypt.saltRounds': 10,
            'admin.email': 'admin@example.com',
            'admin.password': 'admin-secret',
        };
        return config[key];
    }),
};
(0, vitest_1.describe)('AuthService', () => {
    let service;
    let userRepository;
    let configService;
    (0, vitest_1.beforeEach)(() => {
        userRepository = mockUserRepository();
        configService = mockConfigService;
        vitest_1.vi.clearAllMocks();
        service = new auth_service_1.AuthService(userRepository, configService);
    });
    (0, vitest_1.describe)('register', () => {
        (0, vitest_1.it)('hashes password, creates Student role, returns AuthResponseDto without passwordHash', async () => {
            const dto = { email: 'new@example.com', password: 'secret1234' };
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue(null);
            userRepository.create = vitest_1.vi.fn().mockImplementation((dto) => dto);
            userRepository.save = vitest_1.vi.fn().mockResolvedValue({
                id: '123',
                ...dto,
                passwordHash: 'hashed',
                role: user_entity_1.UserRole.STUDENT,
            });
            const result = await service.register(dto);
            (0, vitest_1.expect)(result.accessToken).toBeDefined();
            (0, vitest_1.expect)(typeof result.accessToken).toBe('string');
            (0, vitest_1.expect)(result.user.email).toBe('new@example.com');
            (0, vitest_1.expect)(result.user.role).toBe('STUDENT');
            (0, vitest_1.expect)(result.user.passwordHash).toBeUndefined();
            (0, vitest_1.expect)(userRepository.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                email: 'new@example.com',
                role: user_entity_1.UserRole.STUDENT,
            }));
            const createCall = userRepository.create.mock.calls[0][0];
            (0, vitest_1.expect)(createCall.passwordHash).not.toBe('secret1234');
            (0, vitest_1.expect)(createCall.passwordHash.length).toBeGreaterThan(20);
        });
        (0, vitest_1.it)('rejects duplicate email', async () => {
            const dto = { email: 'existing@example.com', password: 'secret1234' };
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue({
                id: '1',
                email: 'existing@example.com',
            });
            await (0, vitest_1.expect)(service.register(dto)).rejects.toThrow(/already exists/);
        });
    });
    (0, vitest_1.describe)('login', () => {
        (0, vitest_1.it)('returns accessToken and user for correct credentials', async () => {
            const bcrypt = require('bcryptjs');
            const hash = await bcrypt.hash('correctpassword', 10);
            const user = {
                id: '1',
                email: 'user@example.com',
                passwordHash: hash,
                role: user_entity_1.UserRole.STUDENT,
            };
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue(user);
            const result = await service.login(user);
            (0, vitest_1.expect)(result.accessToken).toBeDefined();
            (0, vitest_1.expect)(typeof result.accessToken).toBe('string');
            (0, vitest_1.expect)(result.user.id).toBe('1');
            (0, vitest_1.expect)(result.user.email).toBe('user@example.com');
            (0, vitest_1.expect)(result.user.role).toBe('STUDENT');
            (0, vitest_1.expect)(result.user.passwordHash).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('validateUser', () => {
        (0, vitest_1.it)('returns User for correct email/password', async () => {
            const bcrypt = require('bcryptjs');
            const hash = await bcrypt.hash('correctpassword', 10);
            const user = {
                id: '1',
                email: 'user@example.com',
                passwordHash: hash,
                role: user_entity_1.UserRole.STUDENT,
            };
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue(user);
            const result = await service.validateUser('user@example.com', 'correctpassword');
            (0, vitest_1.expect)(result).not.toBeNull();
            (0, vitest_1.expect)(result?.id).toBe('1');
            (0, vitest_1.expect)(result?.email).toBe('user@example.com');
        });
        (0, vitest_1.it)('returns null for wrong password', async () => {
            const bcrypt = require('bcryptjs');
            const hash = await bcrypt.hash('correctpassword', 10);
            const user = {
                id: '1',
                email: 'user@example.com',
                passwordHash: hash,
                role: user_entity_1.UserRole.STUDENT,
            };
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue(user);
            const result = await service.validateUser('user@example.com', 'wrongpassword');
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('returns null for unknown email', async () => {
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue(null);
            const result = await service.validateUser('nope@example.com', 'anything');
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)('bootstrapAdmin', () => {
        (0, vitest_1.it)('creates Admin from env on first call', async () => {
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue(null);
            userRepository.create = vitest_1.vi.fn().mockImplementation((dto) => dto);
            userRepository.save = vitest_1.vi.fn().mockResolvedValue({
                id: 'admin-1',
                email: 'admin@example.com',
                role: user_entity_1.UserRole.ADMIN,
            });
            await service.bootstrapAdmin();
            (0, vitest_1.expect)(userRepository.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                email: 'admin@example.com',
                role: user_entity_1.UserRole.ADMIN,
            }));
            (0, vitest_1.expect)(userRepository.save).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('is idempotent - no-op when Admin already exists', async () => {
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue({
                id: 'admin-1',
                role: user_entity_1.UserRole.ADMIN,
            });
            await service.bootstrapAdmin();
            (0, vitest_1.expect)(userRepository.create).not.toHaveBeenCalled();
            (0, vitest_1.expect)(userRepository.save).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('throws when ADMIN_EMAIL/ADMIN_PASSWORD missing', async () => {
            const missingConfig = {
                get: vitest_1.vi.fn((key) => {
                    if (key === 'admin.email')
                        return undefined;
                    if (key === 'admin.password')
                        return undefined;
                    if (key === 'bcrypt.saltRounds')
                        return 10;
                    return undefined;
                }),
            };
            const svc = new auth_service_1.AuthService(userRepository, missingConfig);
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue(null);
            await (0, vitest_1.expect)(svc.bootstrapAdmin()).rejects.toThrow(/ADMIN_EMAIL and ADMIN_PASSWORD/);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map