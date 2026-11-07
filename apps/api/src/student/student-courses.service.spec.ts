import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CourseStatus } from '../courses/course.entity';
import { StudentCoursesService } from './student-courses.service';

const mockCourseRepository = {
  find: vi.fn().mockImplementation((options: any) => {
    const all = [makeCourse(), makeCourse({ id: 'course-2', status: CourseStatus.DRAFT })];
    const status = options?.where?.status;
    return Promise.resolve(status ? all.filter((c) => c.status === status) : all);
  }),
  findOne: vi.fn(),
} as any;

const mockSectionRepository = {
  find: vi.fn(),
} as any;

const mockChapterRepository = {
  find: vi.fn(),
} as any;

function makeCourse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'course-1',
    title: 'Test Course',
    description: null,
    structureType: 'FLAT',
    status: CourseStatus.PUBLISHED,
    createdAt: new Date('2026-11-07T00:00:00Z'),
    updatedAt: new Date('2026-11-07T00:00:00Z'),
    ...overrides,
  };
}

describe('StudentCoursesService', () => {
  let service: StudentCoursesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StudentCoursesService(
      mockCourseRepository,
      mockSectionRepository,
      mockChapterRepository,
    );
  });

  describe('findPublished', () => {
    it('returns only PUBLISHED courses', async () => {
      mockCourseRepository.find.mockClear();

      const result = await service.findPublished();

      expect(mockCourseRepository.find).toHaveBeenCalledWith({
        where: { status: CourseStatus.PUBLISHED },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('course-1');
      expect(result[0].status).toBe('PUBLISHED');
    });

    it('maps createdAt/updatedAt to ISO strings', async () => {
      mockCourseRepository.find.mockResolvedValue([makeCourse()]);

      const result = await service.findPublished();

      expect(result[0].createdAt).toBe('2026-11-07T00:00:00.000Z');
      expect(result[0].updatedAt).toBe('2026-11-07T00:00:00.000Z');
    });
  });

  describe('findCourseWithStructure', () => {
    it('returns null for unknown course', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);

      const result = await service.findCourseWithStructure('nope');

      expect(result).toBeNull();
    });

    it('returns null for DRAFT course', async () => {
      mockCourseRepository.findOne.mockResolvedValue(
        makeCourse({ status: CourseStatus.DRAFT }),
      );

      const result = await service.findCourseWithStructure('course-1');

      expect(result).toBeNull();
    });

    it('returns FLAT course with direct chapters', async () => {
      mockCourseRepository.findOne.mockResolvedValue(makeCourse());
      mockChapterRepository.find.mockResolvedValue([
        {
          id: 'ch-1',
          courseId: 'course-1',
          sectionId: null,
          title: 'Chapter 1',
          position: 1,
          createdAt: new Date('2026-11-07T00:00:00Z'),
          updatedAt: new Date('2026-11-07T00:00:00Z'),
        },
      ]);

      const result = await service.findCourseWithStructure('course-1');

      expect(result).not.toBeNull();
      expect(result!.structureType).toBe('FLAT');
      expect(result!.chapters).toHaveLength(1);
      expect(result!.chapters![0].title).toBe('Chapter 1');
      expect(mockChapterRepository.find).toHaveBeenCalledWith({
        where: { courseId: 'course-1', sectionId: expect.anything() },
        order: { position: 'ASC' },
      });
      expect(result!.sections).toBeUndefined();
    });

    it('returns SECTION_BASED course with sections and chapters', async () => {
      mockCourseRepository.findOne.mockResolvedValue(
        makeCourse({ structureType: 'SECTION_BASED' }),
      );
      mockSectionRepository.find.mockResolvedValue([
        {
          id: 'sec-1',
          courseId: 'course-1',
          title: 'Section 1',
          position: 1,
        },
      ]);
      mockChapterRepository.find.mockResolvedValue([
        {
          id: 'ch-1',
          courseId: 'course-1',
          sectionId: 'sec-1',
          title: 'Chapter 1',
          position: 1,
          createdAt: new Date('2026-11-07T00:00:00Z'),
          updatedAt: new Date('2026-11-07T00:00:00Z'),
        },
      ]);

      const result = await service.findCourseWithStructure('course-1');

      expect(result).not.toBeNull();
      expect(result!.sections).toHaveLength(1);
      expect(result!.sections![0].title).toBe('Section 1');
      expect(result!.sections![0].chapters).toHaveLength(1);
      expect(result!.sections![0].chapters![0].title).toBe('Chapter 1');
      expect(result!.chapters).toBeUndefined();
    });
  });
});
