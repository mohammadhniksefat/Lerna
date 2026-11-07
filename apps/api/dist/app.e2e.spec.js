"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const common_1 = require("@nestjs/common");
const auth_controller_1 = require("./auth/auth.controller");
const users_controller_1 = require("./users/users.controller");
const user_entity_1 = require("./users/user.entity");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
vitest_1.vi.mock('@nestjs/passport', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        AuthGuard: () => class MockPassportGuard {
            canActivate = () => true;
        },
    };
});
const mockAuthService = {
    register: vitest_1.vi.fn(),
    login: vitest_1.vi.fn(),
    validateUser: vitest_1.vi.fn(),
};
const mockUsersService = {
    findAll: vitest_1.vi.fn(),
    findById: vitest_1.vi.fn(),
    create: vitest_1.vi.fn(),
    updateRole: vitest_1.vi.fn(),
};
(0, vitest_1.describe)('Foundation E2E Smoke Test', () => {
    let authController;
    let usersController;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        authController = new auth_controller_1.AuthController(mockAuthService);
        usersController = new users_controller_1.UsersController(mockUsersService);
    });
    (0, vitest_1.describe)('Complete foundation flow', () => {
        (0, vitest_1.it)('registers a user via POST /auth/register', async () => {
            mockAuthService.register.mockResolvedValue({
                accessToken: 'token-123',
                user: { id: 'user-1', email: 'student@example.com', role: user_entity_1.UserRole.STUDENT },
            });
            const result = await authController.register({
                email: 'student@example.com',
                password: 'secret1234',
            });
            (0, vitest_1.expect)(result.accessToken).toBe('token-123');
            (0, vitest_1.expect)(result.user).toEqual({
                id: 'user-1',
                email: 'student@example.com',
                role: user_entity_1.UserRole.STUDENT,
            });
            (0, vitest_1.expect)(mockAuthService.register).toHaveBeenCalledWith({
                email: 'student@example.com',
                password: 'secret1234',
            });
        });
        (0, vitest_1.it)('logs in via POST /auth/login', async () => {
            mockAuthService.login.mockResolvedValue({
                accessToken: 'token-456',
                user: { id: 'user-1', email: 'student@example.com', role: user_entity_1.UserRole.STUDENT },
            });
            const result = await authController.login({
                user: { id: 'user-1', email: 'student@example.com', role: user_entity_1.UserRole.STUDENT },
            });
            (0, vitest_1.expect)(result.accessToken).toBe('token-456');
            (0, vitest_1.expect)(result.user.role).toBe(user_entity_1.UserRole.STUDENT);
        });
        (0, vitest_1.it)('accesses protected route GET /auth/me', async () => {
            const meResult = {
                id: 'user-1',
                email: 'student@example.com',
                role: user_entity_1.UserRole.STUDENT,
            };
            const result = await authController.me({ user: { id: 'user-1', email: 'student@example.com', role: user_entity_1.UserRole.STUDENT } });
            (0, vitest_1.expect)(result).toEqual(meResult);
            (0, vitest_1.expect)(result).not.toHaveProperty('passwordHash');
        });
        (0, vitest_1.it)('lists all users via GET /users', async () => {
            mockUsersService.findAll.mockResolvedValue([
                { id: '1', email: 'admin@example.com', role: user_entity_1.UserRole.ADMIN },
                { id: '2', email: 'student@example.com', role: user_entity_1.UserRole.STUDENT },
            ]);
            const result = await usersController.findAll();
            (0, vitest_1.expect)(result).toHaveLength(2);
            result.forEach((u) => {
                (0, vitest_1.expect)(u).not.toHaveProperty('passwordHash');
                (0, vitest_1.expect)(u).toMatchObject({ id: vitest_1.expect.any(String), email: vitest_1.expect.any(String), role: vitest_1.expect.any(String) });
            });
        });
        (0, vitest_1.it)('creates a user via POST /users', async () => {
            mockUsersService.create.mockResolvedValue({
                id: 'user-2',
                email: 'new@example.com',
                role: user_entity_1.UserRole.STUDENT,
            });
            const result = await usersController.create({
                email: 'new@example.com',
                password: 'secret1234',
                role: user_entity_1.UserRole.STUDENT,
            });
            (0, vitest_1.expect)(result).toEqual({
                id: 'user-2',
                email: 'new@example.com',
                role: user_entity_1.UserRole.STUDENT,
            });
            (0, vitest_1.expect)(mockUsersService.create).toHaveBeenCalledWith('new@example.com', 'secret1234', user_entity_1.UserRole.STUDENT);
        });
        (0, vitest_1.it)('updates user role via PATCH /users/:id/role', async () => {
            mockUsersService.updateRole.mockResolvedValue({
                id: 'user-2',
                email: 'new@example.com',
                role: user_entity_1.UserRole.ADMIN,
            });
            const result = await usersController.updateRole('user-2', {
                role: user_entity_1.UserRole.ADMIN,
            });
            (0, vitest_1.expect)(result).toEqual({
                id: 'user-2',
                email: 'new@example.com',
                role: user_entity_1.UserRole.ADMIN,
            });
            (0, vitest_1.expect)(mockUsersService.updateRole).toHaveBeenCalledWith('user-2', user_entity_1.UserRole.ADMIN);
        });
        (0, vitest_1.it)('returns consistent error envelope for not found', async () => {
            mockUsersService.findById.mockResolvedValue(null);
            await (0, vitest_1.expect)(usersController.findOne('nonexistent')).rejects.toThrow(/not found/i);
        });
    });
    (0, vitest_1.describe)('Error envelope format', () => {
        (0, vitest_1.it)('produces { error: { code, message, details? } } shape', () => {
            const filter = new http_exception_filter_1.HttpExceptionFilter();
            const mockResponse = {
                status: vitest_1.vi.fn().mockReturnThis(),
                json: vitest_1.vi.fn().mockReturnThis(),
            };
            const mockHost = {
                switchToHttp: () => ({
                    getResponse: () => mockResponse,
                }),
            };
            filter.catch(new common_1.NotFoundException('User not found'), mockHost);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(404);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                error: {
                    code: 404,
                    message: 'User not found',
                },
            }));
        });
    });
});
//# sourceMappingURL=app.e2e.spec.js.map