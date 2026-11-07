"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const roles_guard_1 = require("./roles.guard");
const common_1 = require("@nestjs/common");
const user_entity_1 = require("../users/user.entity");
(0, vitest_1.describe)('RolesGuard', () => {
    (0, vitest_1.it)('allows access when user role matches required role', () => {
        const reflector = {
            getAllAndOverride: vitest_1.vi.fn().mockReturnValue([user_entity_1.UserRole.ADMIN]),
        };
        const guard = new roles_guard_1.RolesGuard(reflector);
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({ user: { id: '1', role: user_entity_1.UserRole.ADMIN } }),
            }),
            getHandler: vitest_1.vi.fn(),
            getClass: vitest_1.vi.fn(),
        };
        (0, vitest_1.expect)(guard.canActivate(context)).toBe(true);
    });
    (0, vitest_1.it)('denies access when user role does not match', () => {
        const reflector = {
            getAllAndOverride: vitest_1.vi.fn().mockReturnValue([user_entity_1.UserRole.ADMIN]),
        };
        const guard = new roles_guard_1.RolesGuard(reflector);
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({ user: { id: '2', role: user_entity_1.UserRole.STUDENT } }),
            }),
            getHandler: vitest_1.vi.fn(),
            getClass: vitest_1.vi.fn(),
        };
        (0, vitest_1.expect)(() => guard.canActivate(context)).toThrow(common_1.ForbiddenException);
    });
    (0, vitest_1.it)('allows access when no roles are required', () => {
        const reflector = {
            getAllAndOverride: vitest_1.vi.fn().mockReturnValue([]),
        };
        const guard = new roles_guard_1.RolesGuard(reflector);
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({ user: { id: '2', role: user_entity_1.UserRole.STUDENT } }),
            }),
            getHandler: vitest_1.vi.fn(),
            getClass: vitest_1.vi.fn(),
        };
        (0, vitest_1.expect)(guard.canActivate(context)).toBe(true);
    });
});
//# sourceMappingURL=roles.guard.spec.js.map