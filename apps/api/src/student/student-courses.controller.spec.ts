import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationPipe, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { StudentCoursesController } from './student-courses.controller';
import { StudentCoursesService } from './student-courses.service';
import { UserRole } from '../users/user.entity';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

// Mock @nestjs/passport so JwtAuthGuard is pass-through and injects a fake user
vi.mock('@nestjs/passport', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nestjs/passport')>();
  return {
    ...actual,
    AuthGuard: () =>
      class MockPassportGuard {
        canActivate(context: any): boolean {
          const headers = context.switchToHttp().getRequest().headers;
          if (!headers || !headers.authorization) {
            throw new UnauthorizedException('No token provided');
          }
          return true;
        }
      },
  };
});

const mockStudentCoursesService = {
  findPublished: vi.fn(),
  findCourseWithStructure: vi.fn(),
};

const studentReq = {
  user: { id: 'user-2', email: 'student@example.com', role: UserRole.STUDENT },
};

describe('StudentCoursesController', () => {
  const buildApp = async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [StudentCoursesController],
      providers: [
        {
          provide: StudentCoursesService,
          useValue: mockStudentCoursesService,
        },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // vitest/esbuild strips TS decorators, so NestJS DI metadata
    // (design:paramtypes) is lost and constructor injection fails.
    // Manually wire the mock onto the controller instance Nest created.
    const controller = moduleRef.get(StudentCoursesController);
    (controller as any).studentCoursesService = mockStudentCoursesService;

    return app;
  };

  describe('GET /student/courses', () => {
    it('returns published courses only for an authenticated Student', async () => {
      mockStudentCoursesService.findPublished.mockResolvedValue([
        {
          id: 'course-1',
          title: 'Published Course',
          description: null,
          structureType: 'FLAT',
          status: 'PUBLISHED',
          createdAt: new Date('2026-11-07T00:00:00Z'),
          updatedAt: new Date('2026-11-07T00:00:00Z'),
        },
      ]);

      const testApp = await buildApp();
      try {
        const res = await request(testApp.getHttpServer())
          .get('/student/courses')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(200);

        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toBe('Published Course');
        expect(res.body[0].status).toBe('PUBLISHED');
      } finally {
        await testApp.close();
      }
    });

    it('returns 401 without a token', async () => {
      const testApp = await buildApp();
      try {
        await request(testApp.getHttpServer())
          .get('/student/courses')
          .expect(401);
      } finally {
        await testApp.close();
      }
    });
  });

  describe('GET /student/courses/:id', () => {
    it('returns course details for a published course', async () => {
      mockStudentCoursesService.findCourseWithStructure.mockResolvedValue({
        id: 'course-1',
        title: 'Published Course',
        description: null,
        structureType: 'FLAT',
        status: 'PUBLISHED',
        createdAt: new Date('2026-11-07T00:00:00Z'),
        updatedAt: new Date('2026-11-07T00:00:00Z'),
        chapters: [],
      });

      const testApp = await buildApp();
      try {
        const res = await request(testApp.getHttpServer())
          .get('/student/courses/course-1')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(200);

        expect(res.body.id).toBe('course-1');
        expect(res.body.title).toBe('Published Course');
      } finally {
        await testApp.close();
      }
    });

    it('returns 404 for a draft or unknown course', async () => {
      mockStudentCoursesService.findCourseWithStructure.mockResolvedValue(null);

      const testApp = await buildApp();
      try {
        await request(testApp.getHttpServer())
          .get('/student/courses/course-1')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(404);
      } finally {
        await testApp.close();
      }
    });

    it('returns 401 without a token', async () => {
      mockStudentCoursesService.findCourseWithStructure.mockResolvedValue(null);

      const testApp = await buildApp();
      try {
        await request(testApp.getHttpServer())
          .get('/student/courses/course-1')
          .expect(401);
      } finally {
        await testApp.close();
      }
    });
  });
});
