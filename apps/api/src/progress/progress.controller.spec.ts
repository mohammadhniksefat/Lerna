import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationPipe, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

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
          context.switchToHttp().getRequest().user = { id: 'user-1' };
          return true;
        }
      },
  };
});

const mockProgressService = {
  markComplete: vi.fn(),
  getCourseProgress: vi.fn(),
  getResume: vi.fn(),
};

describe('ProgressController', () => {
  const buildApp = async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [
        {
          provide: ProgressService,
          useValue: mockProgressService,
        },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // vitest/esbuild strips TS decorators, so NestJS DI metadata
    // (design:paramtypes) is lost and constructor injection fails.
    const controller = moduleRef.get(ProgressController);
    (controller as any).progressService = mockProgressService;

    return app;
  };

  describe('POST /progress/chapters/:id/complete', () => {
    it('marks a chapter complete for an authenticated user', async () => {
      mockProgressService.markComplete.mockResolvedValue({
        id: 'pg-1',
        userId: 'user-1',
        chapterId: 'ch-1',
        isCompleted: true,
        completedAt: '2026-11-07T10:00:00.000Z',
        createdAt: '2026-11-07T10:00:00.000Z',
        updatedAt: '2026-11-07T10:00:00.000Z',
      });

      const app = await buildApp();
      try {
        const res = await request(app.getHttpServer())
          .post('/progress/chapters/ch-1/complete')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(201);

        expect(res.body.id).toBe('pg-1');
        expect(res.body.chapterId).toBe('ch-1');
        expect(res.body.isCompleted).toBe(true);
      } finally {
        await app.close();
      }
    });

    it('returns 409 if chapter already completed', async () => {
      mockProgressService.markComplete.mockRejectedValue(
        new ConflictException('Chapter already completed'),
      );

      const app = await buildApp();
      try {
        await request(app.getHttpServer())
          .post('/progress/chapters/ch-1/complete')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(409);
      } finally {
        await app.close();
      }
    });

    it('returns 404 if chapter not found', async () => {
      mockProgressService.markComplete.mockRejectedValue(
        new NotFoundException('Chapter not found'),
      );

      const app = await buildApp();
      try {
        await request(app.getHttpServer())
          .post('/progress/chapters/ch-1/complete')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(404);
      } finally {
        await app.close();
      }
    });

    it('returns 401 without a token', async () => {
      const app = await buildApp();
      try {
        await request(app.getHttpServer())
          .post('/progress/chapters/ch-1/complete')
          .expect(401);
      } finally {
        await app.close();
      }
    });
  });

  describe('GET /progress/courses/:id', () => {
    it('returns course progress for an authenticated user', async () => {
      mockProgressService.getCourseProgress.mockResolvedValue({
        courseId: 'course-1',
        totalChapters: 3,
        completedChapters: 2,
        progressPercentage: 67,
      });

      const app = await buildApp();
      try {
        const res = await request(app.getHttpServer())
          .get('/progress/courses/course-1')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(200);

        expect(res.body.courseId).toBe('course-1');
        expect(res.body.progressPercentage).toBe(67);
      } finally {
        await app.close();
      }
    });

    it('returns 404 if course not found', async () => {
      mockProgressService.getCourseProgress.mockRejectedValue(
        new NotFoundException('Course not found'),
      );

      const app = await buildApp();
      try {
        await request(app.getHttpServer())
          .get('/progress/courses/course-1')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(404);
      } finally {
        await app.close();
      }
    });

    it('returns 401 without a token', async () => {
      const app = await buildApp();
      try {
        await request(app.getHttpServer())
          .get('/progress/courses/course-1')
          .expect(401);
      } finally {
        await app.close();
      }
    });
  });

  describe('GET /progress/resume', () => {
    it('returns resume data for an authenticated user', async () => {
      mockProgressService.getResume.mockResolvedValue([
        {
          courseId: 'course-1',
          courseTitle: 'Test Course',
          progressPercentage: 33,
          nextChapter: {
            id: 'ch-2',
            courseId: 'course-1',
            sectionId: null,
            title: 'Chapter 2',
            position: 2,
            isCompleted: false,
          },
          lastCompletedChapter: {
            id: 'ch-1',
            courseId: 'course-1',
            sectionId: null,
            title: 'Chapter 1',
            position: 1,
            isCompleted: true,
          },
        },
      ]);

      const app = await buildApp();
      try {
        const res = await request(app.getHttpServer())
          .get('/progress/resume')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(200);

        expect(res.body).toHaveLength(1);
        expect(res.body[0].courseId).toBe('course-1');
        expect(res.body[0].progressPercentage).toBe(33);
        expect(res.body[0].nextChapter.id).toBe('ch-2');
      } finally {
        await app.close();
      }
    });

    it('returns 401 without a token', async () => {
      const app = await buildApp();
      try {
        await request(app.getHttpServer()).get('/progress/resume').expect(401);
      } finally {
        await app.close();
      }
    });
  });
});
