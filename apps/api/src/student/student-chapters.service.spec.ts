import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CourseStatus } from '../courses/course.entity';
import { StudentChaptersService } from './student-chapters.service';

const mockChapterRepository = {
  findOne: vi.fn(),
  find: vi.fn(),
} as any;

const mockCourseRepository = {
  findOne: vi.fn(),
} as any;

function makeChapter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ch-1',
    courseId: 'course-1',
    sectionId: null,
    title: 'Chapter 1',
    content: '# Hello',
    position: 1,
    ...overrides,
  };
}

describe('StudentChaptersService', () => {
  let service: StudentChaptersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StudentChaptersService(mockChapterRepository, mockCourseRepository);
  });

  describe('findChapter', () => {
    it('returns null for unknown chapter', async () => {
      mockChapterRepository.findOne.mockResolvedValue(null);

      const result = await service.findChapter('nope');

      expect(result).toBeNull();
    });

    it('returns null for chapter whose course is DRAFT', async () => {
      mockChapterRepository.findOne.mockResolvedValue(makeChapter());
      mockCourseRepository.findOne.mockResolvedValue(
        makeCourse({ status: CourseStatus.DRAFT }),
      );

      const result = await service.findChapter('ch-1');

      expect(result).toBeNull();
    });

    it('returns null for chapter whose course is unknown', async () => {
      mockChapterRepository.findOne.mockResolvedValue(makeChapter());
      mockCourseRepository.findOne.mockResolvedValue(null);

      const result = await service.findChapter('ch-1');

      expect(result).toBeNull();
    });

    it('returns sanitized HTML and navigation for a published chapter (FLAT course)', async () => {
      mockChapterRepository.findOne.mockResolvedValue(
        makeChapter({ content: '# Title <script>alert(1)</script>' }),
      );
      mockCourseRepository.findOne.mockResolvedValue(makeCourse({ status: CourseStatus.PUBLISHED }));
      mockChapterRepository.find.mockResolvedValue([
        makeChapter({ id: 'ch-0', title: 'Prev', position: 0 }),
        makeChapter({ id: 'ch-1', title: 'Chapter 1', position: 1 }),
        makeChapter({ id: 'ch-2', title: 'Next', position: 2 }),
      ]);

      const result = await service.findChapter('ch-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('ch-1');
      expect(result!.title).toBe('Chapter 1');
      expect(result!.content).toBe('# Title <script>alert(1)</script>');
      expect(result!.contentHtml).not.toContain('<script>');
      expect(result!.contentHtml).toContain('<h1>');
      expect(result!.prevChapterId).toBe('ch-0');
      expect(result!.nextChapterId).toBe('ch-2');
    });

    it('returns null prev/next for boundaries within a section scope', async () => {
      mockChapterRepository.findOne.mockResolvedValue(
        makeChapter({ id: 'ch-1', sectionId: 'sec-1', position: 1 }),
      );
      mockCourseRepository.findOne.mockResolvedValue(makeCourse({ status: CourseStatus.PUBLISHED }));
      mockChapterRepository.find.mockResolvedValue([
        makeChapter({ id: 'ch-1', sectionId: 'sec-1', title: 'Only chapter', position: 1 }),
      ]);

      const result = await service.findChapter('ch-1');

      expect(result!.prevChapterId).toBeNull();
      expect(result!.nextChapterId).toBeNull();
      expect(mockChapterRepository.find).toHaveBeenCalledWith({
        where: { sectionId: 'sec-1' },
        order: { position: 'ASC' },
      });
    });
  });
});

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
