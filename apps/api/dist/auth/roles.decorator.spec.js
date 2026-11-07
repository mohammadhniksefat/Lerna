"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const roles_decorator_1 = require("./roles.decorator");
const user_entity_1 = require("../users/user.entity");
(0, vitest_1.describe)('Roles decorator', () => {
    (0, vitest_1.it)('sets roles metadata', () => {
        class TestController {
        }
        (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.STUDENT)(TestController, 'method', undefined);
        const Reflector = require('@nestjs/core').Reflector;
        const reflector = new Reflector();
        const roles = reflector.get('roles', TestController, 'method');
        (0, vitest_1.expect)(roles).toEqual([user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.STUDENT]);
    });
});
//# sourceMappingURL=roles.decorator.spec.js.map