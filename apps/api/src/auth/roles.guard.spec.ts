import { describe, it, expect, vi } from 'vitest';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../users/user.entity';

describe('RolesGuard', () => {
  it('allows access when user role matches required role', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.ADMIN]),
    };
    const guard = new RolesGuard(reflector as any);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: '1', role: UserRole.ADMIN } }),
      }),
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access when user role does not match', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.ADMIN]),
    };
    const guard = new RolesGuard(reflector as any);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: '2', role: UserRole.STUDENT } }),
      }),
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows access when no roles are required', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([]),
    };
    const guard = new RolesGuard(reflector as any);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: '2', role: UserRole.STUDENT } }),
      }),
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });
});
