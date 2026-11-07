import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationPipe, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { StudentChaptersController } from './student-chapters.controller';
import { StudentChaptersService } from './student-chapters.service';
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
          return true;
        }
      },
  };
});

const mockStudentChaptersService = {
  findChapter: vi.fn(),
};

describe('StudentChaptersController', () => {
  const buildApp = async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [StudentChaptersController],
      providers: [
        {
          provide: StudentChaptersService,
          useValue: mockStudentChaptersService,
        },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // vitest/esbuild strips TS decorators, so NestJS DI metadata
    // (design:paramtypes) is lost and constructor injection fails.
    const controller = moduleRef.get(StudentChaptersController);
    (controller as any).studentChaptersService = mockStudentChaptersService;

    return app;
  };

  describe('GET /student/chapters/:id', () => {
    it('returns chapter with sanitized HTML and navigation for an authenticated Student', async () => {
      mockStudentChaptersService.findChapter.mockResolvedValue({
        id: 'ch-1',
        courseId: 'course-1',
        sectionId: null,
        title: 'Chapter 1',
        content: '# Hello',
        contentHtml: '<h1>Hello</h1>',
        position: 1,
        prevChapterId: null,
        nextChapterId: 'ch-2',
      });

      const testApp = await buildApp();
      try {
        const res = await request(testApp.getHttpServer())
          .get('/student/chapters/ch-1')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(200);

        expect(res.body.id).toBe('ch-1');
        expect(res.body.contentHtml).toBe('<h1>Hello</h1>');
        expect(res.body.nextChapterId).toBe('ch-2');
      } finally {
        await testApp.close();
      }
    });

    it('returns 404 for a chapter whose course is not published', async () => {
      mockStudentChaptersService.findChapter.mockResolvedValue(null);

      const testApp = await buildApp();
      try {
        await request(testApp.getHttpServer())
          .get('/student/chapters/ch-1')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(404);
      } finally {
        await testApp.close();
      }
    });

    it('returns 401 without a token', async () => {
      mockStudentChaptersService.findChapter.mockResolvedValue(null);

      const testApp = await buildApp();
      try {
        await request(testApp.getHttpServer()).get('/student/chapters/ch-1').expect(401);
      } finally {
        await testApp.close();
      }
    });
  });
});
