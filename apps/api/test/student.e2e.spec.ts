import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationPipe, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { StudentCoursesController } from '../src/student/student-courses.controller';
import { StudentChaptersController } from '../src/student/student-chapters.controller';
import { StudentCoursesService } from '../src/student/student-courses.service';
import { StudentChaptersService } from '../src/student/student-chapters.service';
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
          return true;
        }
      },
  };
});

const mockStudentCoursesService = {
  findPublished: vi.fn(),
  findCourseWithStructure: vi.fn(),
};

const mockStudentChaptersService = {
  findChapter: vi.fn(),
};

async function buildApp() {
  const moduleRef = await Test.createTestingModule({
    controllers: [StudentCoursesController, StudentChaptersController],
    providers: [
      { provide: StudentCoursesService, useValue: mockStudentCoursesService },
      { provide: StudentChaptersService, useValue: mockStudentChaptersService },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  // vitest/esbuild strips TS decorators, so NestJS DI metadata
  // (design:paramtypes) is lost and constructor injection fails.
  const coursesController = moduleRef.get(StudentCoursesController);
  const chaptersController = moduleRef.get(StudentChaptersController);
  (coursesController as any).studentCoursesService = mockStudentCoursesService;
  (chaptersController as any).studentChaptersService = mockStudentChaptersService;

  return app;
}

describe('Student Learning Experience E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Published-only course listing', () => {
    it('returns only PUBLISHED courses for an authenticated Student', async () => {
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

      const app = await buildApp();
      try {
        const res = await request(app.getHttpServer())
          .get('/student/courses')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(200);

        expect(res.body).toHaveLength(1);
        expect(res.body[0].status).toBe('PUBLISHED');
      } finally {
        await app.close();
      }
    });

    it('returns 401 without a token', async () => {
      const app = await buildApp();
      try {
        await request(app.getHttpServer()).get('/student/courses').expect(401);
      } finally {
        await app.close();
      }
    });
  });

  describe('Course details', () => {
    it('returns details for a published course', async () => {
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

      const app = await buildApp();
      try {
        const res = await request(app.getHttpServer())
          .get('/student/courses/course-1')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(200);

        expect(res.body.id).toBe('course-1');
        expect(res.body.status).toBe('PUBLISHED');
      } finally {
        await app.close();
      }
    });

    it('returns 404 for a draft or unknown course', async () => {
      mockStudentCoursesService.findCourseWithStructure.mockResolvedValue(null);

      const app = await buildApp();
      try {
        await request(app.getHttpServer())
          .get('/student/courses/course-1')
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
          .get('/student/courses/course-1')
          .expect(401);
      } finally {
        await app.close();
      }
    });
  });

  describe('Chapter reader', () => {
    it('returns sanitized HTML and navigation for a published chapter', async () => {
      mockStudentChaptersService.findChapter.mockResolvedValue({
        id: 'ch-1',
        courseId: 'course-1',
        sectionId: null,
        title: 'Chapter 1',
        content: '# Hello',
        contentHtml: '<h1>Hello</h1>',
        position: 1,
        prevChapterId: null,
        nextChapterId: null,
      });

      const app = await buildApp();
      try {
        const res = await request(app.getHttpServer())
          .get('/student/chapters/ch-1')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(200);

        expect(res.body.id).toBe('ch-1');
        expect(res.body.contentHtml).toContain('<h1>');
        expect(res.body.contentHtml).not.toContain('<script>');
      } finally {
        await app.close();
      }
    });

    it('returns 404 for a chapter whose course is not published', async () => {
      mockStudentChaptersService.findChapter.mockResolvedValue(null);

      const app = await buildApp();
      try {
        await request(app.getHttpServer())
          .get('/student/chapters/ch-1')
          .set('Authorization', 'Bearer fake-student-token')
          .expect(404);
      } finally {
        await app.close();
      }
    });

    it('returns 401 without a token', async () => {
      const app = await buildApp();
      try {
        await request(app.getHttpServer()).get('/student/chapters/ch-1').expect(401);
      } finally {
        await app.close();
      }
    });
  });
});
