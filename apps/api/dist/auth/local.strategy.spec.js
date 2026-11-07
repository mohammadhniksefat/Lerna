"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const local_strategy_1 = require("./local.strategy");
const common_1 = require("@nestjs/common");
(0, vitest_1.describe)('LocalStrategy', () => {
    (0, vitest_1.it)('validates user and returns user object for correct credentials', async () => {
        const authService = {
            validateUser: vitest_1.vi.fn().mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                role: 'STUDENT',
            }),
        };
        const strategy = new local_strategy_1.LocalStrategy(authService);
        const result = await strategy.validate('user@example.com', 'correctpassword');
        (0, vitest_1.expect)(result.email).toBe('user@example.com');
        (0, vitest_1.expect)(result.role).toBe('STUDENT');
        (0, vitest_1.expect)(authService.validateUser).toHaveBeenCalledWith('user@example.com', 'correctpassword');
    });
    (0, vitest_1.it)('throws UnauthorizedException for invalid credentials', async () => {
        const authService = {
            validateUser: vitest_1.vi.fn().mockResolvedValue(null),
        };
        const strategy = new local_strategy_1.LocalStrategy(authService);
        await (0, vitest_1.expect)(strategy.validate('user@example.com', 'wrongpassword')).rejects.toThrow(common_1.UnauthorizedException);
    });
});
//# sourceMappingURL=local.strategy.spec.js.map