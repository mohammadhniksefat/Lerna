import { describe, it, expect } from 'vitest';
import { Roles } from './roles.decorator';
import { UserRole } from '../users/user.entity';

describe('Roles decorator', () => {
  it('sets roles metadata', () => {
    class TestController {}
    Roles(UserRole.ADMIN, UserRole.STUDENT)(TestController, 'method', undefined as any);

    const Reflector = require('@nestjs/core').Reflector;
    const reflector = new Reflector();
    const roles = reflector.get('roles', TestController, 'method');
    expect(roles).toEqual([UserRole.ADMIN, UserRole.STUDENT]);
  });
});
