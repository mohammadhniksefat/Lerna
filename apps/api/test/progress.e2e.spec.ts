import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationPipe, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { ProgressController } from '../src/progress/progress.controller';
import { ProgressService } from '../src/progress/progress.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

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

async function buildApp() {
  const moduleRef = await Test.createTestingModule({
    controllers: [ProgressController],
    providers: [
      { provide: ProgressService, useValue: mockProgressService },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  const controller = moduleRef.get(ProgressController);
  (controller as any).progressService = mockProgressService;

  return app;
}

describe('Progress Tracking E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mark chapter complete', () => {
    it('marks chapter complete and returns progress record', async () => {
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

    it('returns 409 when marking an already-completed chapter (idempotent)', async () => {
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

  describe('Course progress', () => {
    it('returns progress percentage for a course', async () => {
      mockProgressService.getCourseProgress.mockResolvedValue({
        courseId: 'course-1',
        totalChapters: 4,
        completedChapters: 2,
        progressPercentage: 50,
      });

      const app = await buildApp();
      try {
        const res = await request(app.getHttpServer())
          .get('/progress/courses/course-1')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(200);

        expect(res.body.courseId).toBe('course-1');
        expect(res.body.progressPercentage).toBe(50);
        expect(res.body.totalChapters).toBe(4);
        expect(res.body.completedChapters).toBe(2);
      } finally {
        await app.close();
      }
    });

    it('returns 404 for unknown course', async () => {
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

  describe('Resume', () => {
    it('returns resume data per course', async () => {
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
