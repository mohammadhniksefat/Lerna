"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const common_1 = require("@nestjs/common");
const auth_controller_1 = require("./auth.controller");
const user_entity_1 = require("../users/user.entity");
const mockAuthService = {
    validateUser: vitest_1.vi.fn(),
    login: vitest_1.vi.fn(),
    register: vitest_1.vi.fn(),
};
(0, vitest_1.describe)('AuthController', () => {
    let controller;
    (0, vitest_1.beforeEach)(() => {
        controller = new auth_controller_1.AuthController(mockAuthService);
    });
    (0, vitest_1.describe)('register', () => {
        (0, vitest_1.it)('should register a new user and return access token', async () => {
            const expected = {
                accessToken: 'token-123',
                user: { id: '123', email: 'new@example.com', role: user_entity_1.UserRole.STUDENT },
            };
            mockAuthService.register.mockResolvedValue(expected);
            const result = await controller.register({
                email: 'new@example.com',
                password: 'secret1234',
            });
            (0, vitest_1.expect)(result).toEqual(expected);
            (0, vitest_1.expect)(mockAuthService.register).toHaveBeenCalledWith({
                email: 'new@example.com',
                password: 'secret1234',
            });
        });
        (0, vitest_1.it)('should reject duplicate email with 409', async () => {
            mockAuthService.register.mockRejectedValue(new common_1.ConflictException('User with email existing@example.com already exists'));
            await (0, vitest_1.expect)(controller.register({
                email: 'existing@example.com',
                password: 'secret1234',
            })).rejects.toThrow(common_1.ConflictException);
        });
    });
    (0, vitest_1.describe)('login', () => {
        (0, vitest_1.it)('should login with correct credentials and return access token', async () => {
            const expected = {
                accessToken: 'token-123',
                user: { id: '1', email: 'user@example.com', role: user_entity_1.UserRole.STUDENT },
            };
            mockAuthService.login.mockResolvedValue(expected);
            const result = await controller.login({
                user: { id: '1', email: 'user@example.com', role: user_entity_1.UserRole.STUDENT },
            });
            (0, vitest_1.expect)(result).toEqual(expected);
        });
        (0, vitest_1.it)('should reject wrong credentials with 401', async () => {
            mockAuthService.login.mockRejectedValue(new common_1.UnauthorizedException('Invalid credentials'));
            await (0, vitest_1.expect)(controller.login({ user: null })).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
    (0, vitest_1.describe)('me', () => {
        (0, vitest_1.it)('should return current user', async () => {
            const user = { id: '1', email: 'user@example.com', role: user_entity_1.UserRole.STUDENT };
            const result = await controller.me({ user });
            (0, vitest_1.expect)(result.id).toBe('1');
            (0, vitest_1.expect)(result.email).toBe('user@example.com');
            (0, vitest_1.expect)(result.role).toBe('STUDENT');
        });
    });
});
//# sourceMappingURL=auth.controller.spec.js.map