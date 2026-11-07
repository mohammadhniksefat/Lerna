"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const users_controller_1 = require("./users.controller");
const user_entity_1 = require("./user.entity");
(0, vitest_1.describe)('UsersController', () => {
    let controller;
    const mockUsersService = {
        findAll: vitest_1.vi.fn(),
        findById: vitest_1.vi.fn(),
        create: vitest_1.vi.fn(),
        updateRole: vitest_1.vi.fn(),
    };
    (0, vitest_1.beforeEach)(() => {
        controller = new users_controller_1.UsersController(mockUsersService);
    });
    (0, vitest_1.describe)('GET /users (findAll)', () => {
        (0, vitest_1.it)('returns list of users without passwordHash', async () => {
            mockUsersService.findAll.mockResolvedValue([
                { id: '1', email: 'admin@example.com', role: user_entity_1.UserRole.ADMIN, passwordHash: 'secret' },
                { id: '2', email: 'student@example.com', role: user_entity_1.UserRole.STUDENT, passwordHash: 'secret' },
            ]);
            const result = await controller.findAll();
            (0, vitest_1.expect)(result).toEqual([
                { id: '1', email: 'admin@example.com', role: user_entity_1.UserRole.ADMIN },
                { id: '2', email: 'student@example.com', role: user_entity_1.UserRole.STUDENT },
            ]);
            (0, vitest_1.expect)(mockUsersService.findAll).toHaveBeenCalledTimes(1);
        });
    });
    (0, vitest_1.describe)('GET /users/:id (findOne)', () => {
        (0, vitest_1.it)('returns a single user without passwordHash', async () => {
            mockUsersService.findById.mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                role: user_entity_1.UserRole.STUDENT,
                passwordHash: 'secret',
            });
            const result = await controller.findOne('1');
            (0, vitest_1.expect)(result).toEqual({
                id: '1',
                email: 'user@example.com',
                role: user_entity_1.UserRole.STUDENT,
            });
            (0, vitest_1.expect)(mockUsersService.findById).toHaveBeenCalledWith('1');
        });
        (0, vitest_1.it)('throws NotFoundException when user not found', async () => {
            mockUsersService.findById.mockResolvedValue(null);
            await (0, vitest_1.expect)(controller.findOne('999')).rejects.toThrow(/not found/i);
        });
    });
    (0, vitest_1.describe)('POST /users (create)', () => {
        (0, vitest_1.it)('creates a new user with specified role', async () => {
            mockUsersService.create.mockResolvedValue({
                id: '3',
                email: 'new@example.com',
                role: user_entity_1.UserRole.STUDENT,
                passwordHash: 'hashed',
            });
            const result = await controller.create({
                email: 'new@example.com',
                password: 'secret1234',
                role: user_entity_1.UserRole.STUDENT,
            });
            (0, vitest_1.expect)(result).toEqual({
                id: '3',
                email: 'new@example.com',
                role: user_entity_1.UserRole.STUDENT,
            });
            (0, vitest_1.expect)(mockUsersService.create).toHaveBeenCalledWith('new@example.com', 'secret1234', user_entity_1.UserRole.STUDENT);
        });
        (0, vitest_1.it)('defaults role to STUDENT when not provided', async () => {
            mockUsersService.create.mockResolvedValue({
                id: '3',
                email: 'new@example.com',
                role: user_entity_1.UserRole.STUDENT,
                passwordHash: 'hashed',
            });
            const result = await controller.create({
                email: 'new@example.com',
                password: 'secret1234',
            });
            (0, vitest_1.expect)(mockUsersService.create).toHaveBeenCalledWith('new@example.com', 'secret1234', user_entity_1.UserRole.STUDENT);
            (0, vitest_1.expect)(result.role).toBe(user_entity_1.UserRole.STUDENT);
        });
    });
    (0, vitest_1.describe)('PATCH /users/:id/role (updateRole)', () => {
        (0, vitest_1.it)('updates user role and returns user without passwordHash', async () => {
            mockUsersService.updateRole.mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                role: user_entity_1.UserRole.ADMIN,
                passwordHash: 'secret',
            });
            const result = await controller.updateRole('1', { role: user_entity_1.UserRole.ADMIN });
            (0, vitest_1.expect)(result).toEqual({
                id: '1',
                email: 'user@example.com',
                role: user_entity_1.UserRole.ADMIN,
            });
            (0, vitest_1.expect)(mockUsersService.updateRole).toHaveBeenCalledWith('1', user_entity_1.UserRole.ADMIN);
        });
    });
});
//# sourceMappingURL=users.controller.spec.js.map