import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudentModule } from './student.module';
import { StudentCoursesController } from './student-courses.controller';
import { StudentChaptersController } from './student-chapters.controller';
import { StudentCoursesService } from './student-courses.service';
import { StudentChaptersService } from './student-chapters.service';

vi.mock('@nestjs/passport', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nestjs/passport')>();
  return {
    ...actual,
    AuthGuard: () =>
      class MockPassportGuard {
        canActivate = () => true;
      },
  };
});

describe('StudentModule', () => {
  it('declares StudentModule with controllers and providers', () => {
    expect(StudentModule).toBeDefined();
  });

  it('instantiates controllers directly with mocked services', () => {
    const coursesService = new StudentCoursesService(
      {} as any,
      {} as any,
      {} as any,
    );
    const chaptersService = new StudentChaptersService(
      {} as any,
      {} as any,
    );

    const coursesController = new StudentCoursesController(coursesService);
    const chaptersController = new StudentChaptersController(chaptersService);

    expect(coursesController).toBeInstanceOf(StudentCoursesController);
    expect(chaptersController).toBeInstanceOf(StudentChaptersController);
    expect(coursesService).toBeInstanceOf(StudentCoursesService);
    expect(chaptersService).toBeInstanceOf(StudentChaptersService);
  });
});
