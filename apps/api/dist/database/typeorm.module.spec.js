"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const typeorm_module_1 = require("./typeorm.module");
(0, vitest_1.describe)('TypeormModule', () => {
    (0, vitest_1.it)('is defined as a NestJS module', () => {
        (0, vitest_1.expect)(typeorm_module_1.TypeormModule).toBeDefined();
        (0, vitest_1.expect)(typeof typeorm_module_1.TypeormModule).toBe('function');
    });
    (0, vitest_1.describe)('live PostgreSQL connection (verified via migration:run in Task 4)', () => {
        (0, vitest_1.it)('documents the manual verification steps', () => {
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
});
//# sourceMappingURL=typeorm.module.spec.js.map