"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const users_service_1 = require("./users.service");
const user_entity_1 = require("./user.entity");
const mockUserRepository = () => ({
    findOne: vitest_1.vi.fn(),
    create: vitest_1.vi.fn(),
    save: vitest_1.vi.fn(),
    find: vitest_1.vi.fn(),
});
(0, vitest_1.describe)('UsersService', () => {
    let service;
    let userRepository;
    (0, vitest_1.beforeEach)(() => {
        userRepository = mockUserRepository();
        service = new users_service_1.UsersService(userRepository);
    });
    (0, vitest_1.describe)('findByEmail', () => {
        (0, vitest_1.it)('returns user when email exists', async () => {
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                role: user_entity_1.UserRole.STUDENT,
            });
            const result = await service.findByEmail('user@example.com');
            (0, vitest_1.expect)(result).toEqual({
                id: '1',
                email: 'user@example.com',
                role: user_entity_1.UserRole.STUDENT,
            });
            (0, vitest_1.expect)(userRepository.findOne).toHaveBeenCalledWith({
                where: { email: 'user@example.com' },
            });
        });
        (0, vitest_1.it)('returns null when email not found', async () => {
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue(null);
            const result = await service.findByEmail('nope@example.com');
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)('findById', () => {
        (0, vitest_1.it)('returns user when id exists', async () => {
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                role: user_entity_1.UserRole.STUDENT,
            });
            const result = await service.findById('1');
            (0, vitest_1.expect)(result).toEqual({
                id: '1',
                email: 'user@example.com',
                role: user_entity_1.UserRole.STUDENT,
            });
            (0, vitest_1.expect)(userRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
        });
        (0, vitest_1.it)('returns null when id not found', async () => {
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue(null);
            const result = await service.findById('999');
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)('findAll', () => {
        (0, vitest_1.it)('returns all users', async () => {
            userRepository.find = vitest_1.vi.fn().mockResolvedValue([
                { id: '1', email: 'a@example.com', role: user_entity_1.UserRole.ADMIN },
                { id: '2', email: 'b@example.com', role: user_entity_1.UserRole.STUDENT },
            ]);
            const result = await service.findAll();
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0].role).toBe(user_entity_1.UserRole.ADMIN);
        });
    });
    (0, vitest_1.describe)('create', () => {
        (0, vitest_1.it)('hashes password, sets role, returns user', async () => {
            const bcrypt = require('bcryptjs');
            vitest_1.vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password');
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue(null);
            userRepository.create = vitest_1.vi.fn().mockImplementation((dto) => dto);
            userRepository.save = vitest_1.vi.fn().mockResolvedValue({
                id: '1',
                email: 'new@example.com',
                role: user_entity_1.UserRole.STUDENT,
            });
            const result = await service.create('new@example.com', 'secret1234', user_entity_1.UserRole.STUDENT);
            (0, vitest_1.expect)(result).toEqual({
                id: '1',
                email: 'new@example.com',
                role: user_entity_1.UserRole.STUDENT,
            });
            (0, vitest_1.expect)(userRepository.create).toHaveBeenCalledWith({
                email: 'new@example.com',
                passwordHash: 'hashed-password',
                role: user_entity_1.UserRole.STUDENT,
            });
        });
        (0, vitest_1.it)('rejects duplicate email', async () => {
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue({
                id: '1',
                email: 'existing@example.com',
            });
            await (0, vitest_1.expect)(service.create('existing@example.com', 'secret1234')).rejects.toThrow(/already exists/);
        });
    });
    (0, vitest_1.describe)('updateRole', () => {
        (0, vitest_1.it)('updates role and returns user', async () => {
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                role: user_entity_1.UserRole.STUDENT,
            });
            userRepository.save = vitest_1.vi.fn().mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                role: user_entity_1.UserRole.ADMIN,
            });
            const result = await service.updateRole('1', user_entity_1.UserRole.ADMIN);
            (0, vitest_1.expect)(result.role).toBe(user_entity_1.UserRole.ADMIN);
            (0, vitest_1.expect)(userRepository.save).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('throws when user not found', async () => {
            userRepository.findOne = vitest_1.vi.fn().mockResolvedValue(null);
            await (0, vitest_1.expect)(service.updateRole('999', user_entity_1.UserRole.ADMIN)).rejects.toThrow(/not found/);
        });
    });
});
//# sourceMappingURL=users.service.spec.js.map