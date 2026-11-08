import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CourseStatus } from '../courses/course.entity';
import { ProgressService } from './progress.service';

const mockProgressRepository = {
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  count: vi.fn(),
  find: vi.fn(),
} as any;

const mockChapterRepository = {
  findOne: vi.fn(),
  find: vi.fn(),
} as any;

const mockCourseRepository = {
  findOne: vi.fn(),
  find: vi.fn(),
} as any;

function makeChapter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ch-1',
    courseId: 'course-1',
    sectionId: null,
    title: 'Chapter 1',
    position: 1,
    ...overrides,
  };
}

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

describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProgressService(
      mockProgressRepository,
      mockChapterRepository,
      mockCourseRepository,
    );
  });

  describe('markComplete', () => {
    it('creates a progress record with isCompleted=true and completedAt set', async () => {
      mockChapterRepository.findOne.mockResolvedValue(makeChapter());
      mockProgressRepository.findOne.mockResolvedValue(null);
      mockProgressRepository.create.mockReturnValue({
        id: 'pg-1',
        userId: 'user-1',
        chapterId: 'ch-1',
        isCompleted: true,
        completedAt: new Date('2026-11-07T10:00:00Z'),
        createdAt: new Date('2026-11-07T10:00:00Z'),
        updatedAt: new Date('2026-11-07T10:00:00Z'),
      });
      mockProgressRepository.save.mockResolvedValue({
        id: 'pg-1',
        userId: 'user-1',
        chapterId: 'ch-1',
        isCompleted: true,
        completedAt: new Date('2026-11-07T10:00:00Z'),
        createdAt: new Date('2026-11-07T10:00:00Z'),
        updatedAt: new Date('2026-11-07T10:00:00Z'),
      });

      const result = await service.markComplete('user-1', 'ch-1');

      expect(result.id).toBe('pg-1');
      expect(result.isCompleted).toBe(true);
      expect(result.completedAt).toBe('2026-11-07T10:00:00.000Z');
      expect(mockChapterRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'ch-1' },
      });
    });

    it('returns 404 if chapter not found', async () => {
      mockChapterRepository.findOne.mockResolvedValue(null);

      await expect(service.markComplete('user-1', 'ch-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns 409 if chapter already completed (idempotent)', async () => {
      mockChapterRepository.findOne.mockResolvedValue(makeChapter());
      mockProgressRepository.findOne.mockResolvedValue({
        id: 'pg-1',
        userId: 'user-1',
        chapterId: 'ch-1',
        isCompleted: true,
        completedAt: new Date(),
      } as any);

      await expect(service.markComplete('user-1', 'ch-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getCourseProgress', () => {
    it('returns 0 for a course with no chapters', async () => {
      mockCourseRepository.findOne.mockResolvedValue(makeCourse());
      mockChapterRepository.find.mockResolvedValue([]);

      const result = await service.getCourseProgress('user-1', 'course-1');

      expect(result.totalChapters).toBe(0);
      expect(result.completedChapters).toBe(0);
      expect(result.progressPercentage).toBe(0);
    });

    it('returns completed/total × 100', async () => {
      mockCourseRepository.findOne.mockResolvedValue(makeCourse());
      mockChapterRepository.find.mockResolvedValue([
        makeChapter({ id: 'ch-1' }),
        makeChapter({ id: 'ch-2' }),
        makeChapter({ id: 'ch-3' }),
      ]);
      mockProgressRepository.count.mockResolvedValue(2);

      const result = await service.getCourseProgress('user-1', 'course-1');

      expect(result.totalChapters).toBe(3);
      expect(result.completedChapters).toBe(2);
      expect(result.progressPercentage).toBe(67);
      expect(mockProgressRepository.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          chapterId: ['ch-1', 'ch-2', 'ch-3'],
          isCompleted: true,
        },
      });
    });

    it('returns 404 if course not found', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getCourseProgress('user-1', 'course-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getResume', () => {
    it('returns next chapter to read and last completed chapter', async () => {
      mockCourseRepository.find.mockResolvedValue([makeCourse()]);
      mockChapterRepository.find.mockResolvedValue([
        makeChapter({ id: 'ch-1', position: 1 }),
        makeChapter({ id: 'ch-2', position: 2 }),
        makeChapter({ id: 'ch-3', position: 3 }),
      ]);
      mockProgressRepository.find.mockResolvedValue([
        {
          id: 'pg-1',
          userId: 'user-1',
          chapterId: 'ch-1',
          isCompleted: true,
          completedAt: new Date(),
        },
      ] as any);

      const result = await service.getResume('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].courseId).toBe('course-1');
      expect(result[0].progressPercentage).toBe(33);
      expect(result[0].lastCompletedChapter!.id).toBe('ch-1');
      expect(result[0].nextChapter!.id).toBe('ch-2');
    });

    it('returns null nextChapter when all chapters completed', async () => {
      mockCourseRepository.find.mockResolvedValue([makeCourse()]);
      mockChapterRepository.find.mockResolvedValue([
        makeChapter({ id: 'ch-1', position: 1 }),
      ]);
      mockProgressRepository.find.mockResolvedValue([
        {
          id: 'pg-1',
          userId: 'user-1',
          chapterId: 'ch-1',
          isCompleted: true,
          completedAt: new Date(),
        },
      ] as any);

      const result = await service.getResume('user-1');

      expect(result[0].progressPercentage).toBe(100);
      expect(result[0].nextChapter).toBeNull();
      expect(result[0].lastCompletedChapter!.id).toBe('ch-1');
    });
  });
});
