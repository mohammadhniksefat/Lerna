"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jwt_strategy_1 = require("./jwt.strategy");
const common_1 = require("@nestjs/common");
(0, vitest_1.describe)('JwtStrategy', () => {
    (0, vitest_1.it)('returns user for valid JWT payload', async () => {
        const configService = {
            get: vitest_1.vi.fn(() => 'test-secret'),
        };
        const authService = {
            findByEmail: vitest_1.vi.fn().mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                role: 'STUDENT',
            }),
        };
        const strategy = new jwt_strategy_1.JwtStrategy(configService, authService);
        const result = await strategy.validate({ sub: '1', email: 'user@example.com' });
        (0, vitest_1.expect)(result.email).toBe('user@example.com');
        (0, vitest_1.expect)(authService.findByEmail).toHaveBeenCalledWith('user@example.com');
    });
    (0, vitest_1.it)('throws UnauthorizedException for unknown user', async () => {
        const configService = {
            get: vitest_1.vi.fn(() => 'test-secret'),
        };
        const authService = {
            findByEmail: vitest_1.vi.fn().mockResolvedValue(null),
        };
        const strategy = new jwt_strategy_1.JwtStrategy(configService, authService);
        await (0, vitest_1.expect)(strategy.validate({ sub: '999', email: 'unknown@example.com' })).rejects.toThrow(common_1.UnauthorizedException);
    });
});
//# sourceMappingURL=jwt.strategy.spec.js.map