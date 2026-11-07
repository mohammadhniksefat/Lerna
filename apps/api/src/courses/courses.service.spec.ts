import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Repository } from 'typeorm';
import { CoursesService } from './courses.service';
import { Course, CourseStructureType, CourseStatus } from './course.entity';
import { Chapter } from './chapter.entity';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockCourseRepository = () => ({
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
});

const mockChapterRepository = () => ({
  count: vi.fn(),
});

describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepository: ReturnType<typeof mockCourseRepository>;
  let chapterRepository: ReturnType<typeof mockChapterRepository>;

  beforeEach(() => {
    courseRepository = mockCourseRepository();
    chapterRepository = mockChapterRepository();
    vi.clearAllMocks();

    service = new CoursesService(
      courseRepository as unknown as Repository<Course>,
      chapterRepository as unknown as Repository<Chapter>,
    );
  });

  describe('findAll', () => {
    it('returns all courses', async () => {
      const courses = [
        { id: '1', title: 'Course 1' } as Course,
        { id: '2', title: 'Course 2' } as Course,
      ];
      courseRepository.find = vi.fn().mockResolvedValue(courses);

      const result = await service.findAll();

      expect(result).toEqual(courses);
      expect(courseRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('returns course when found', async () => {
      const course = { id: '1', title: 'Test Course' } as Course;
      courseRepository.findOne = vi.fn().mockResolvedValue(course);

      const result = await service.findOne('1');

      expect(result).toEqual(course);
      expect(courseRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('returns null when not found', async () => {
      courseRepository.findOne = vi.fn().mockResolvedValue(null);

      const result = await service.findOne('999');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates course with DRAFT status', async () => {
      const dto: CreateCourseDto = {
        title: 'New Course',
        structureType: 'FLAT',
        description: 'A test course',
      };
      const savedCourse = {
        id: 'new-id',
        ...dto,
        status: CourseStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Course;

      courseRepository.create = vi.fn().mockReturnValue(savedCourse);
      courseRepository.save = vi.fn().mockResolvedValue(savedCourse);

      const result = await service.create(dto);

      expect(result.id).toBe('new-id');
      expect(result.title).toBe('New Course');
      expect(result.structureType).toBe(CourseStructureType.FLAT);
      expect(result.status).toBe(CourseStatus.DRAFT);
      expect(courseRepository.create).toHaveBeenCalledWith({
        title: 'New Course',
        description: 'A test course',
        structureType: 'FLAT',
        status: CourseStatus.DRAFT,
      });
      expect(courseRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('updates course fields', async () => {
      const existingCourse = {
        id: '1',
        title: 'Old Title',
        description: 'Old desc',
        structureType: CourseStructureType.FLAT,
        status: CourseStatus.DRAFT,
      } as Course;
      const updatedCourse = {
        ...existingCourse,
        title: 'New Title',
        description: 'New desc',
      } as Course;

      courseRepository.findOne = vi.fn().mockResolvedValue(existingCourse);
      courseRepository.save = vi.fn().mockResolvedValue(updatedCourse);

      const dto: UpdateCourseDto = {
        title: 'New Title',
        description: 'New desc',
      };
      const result = await service.update('1', dto);

      expect(result).toEqual(updatedCourse);
      expect(courseRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Title',
        description: 'New desc',
      }));
    });

    it('throws NotFoundException when course not found', async () => {
      courseRepository.findOne = vi.fn().mockResolvedValue(null);

      await expect(service.update('999', { title: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes course', async () => {
      const course = { id: '1', title: 'Test' } as Course;
      courseRepository.findOne = vi.fn().mockResolvedValue(course);
      courseRepository.remove = vi.fn().mockResolvedValue(undefined);

      await service.remove('1');

      expect(courseRepository.remove).toHaveBeenCalledWith(course);
    });

    it('throws NotFoundException when course not found', async () => {
      courseRepository.findOne = vi.fn().mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('publishes course with at least one chapter', async () => {
      const course = {
        id: '1',
        title: 'Test Course',
        status: CourseStatus.DRAFT,
      } as Course;
      const publishedCourse = {
        ...course,
        status: CourseStatus.PUBLISHED,
      } as Course;

      courseRepository.findOne = vi.fn().mockResolvedValue(course);
      chapterRepository.count = vi.fn().mockResolvedValue(1);
      courseRepository.save = vi.fn().mockResolvedValue(publishedCourse);

      const result = await service.publish('1');

      expect(result.status).toBe(CourseStatus.PUBLISHED);
      expect(chapterRepository.count).toHaveBeenCalledWith({ where: { courseId: '1' } });
    });

    it('throws BadRequestException when course has zero chapters', async () => {
      const course = { id: '1', title: 'Test Course' } as Course;
      courseRepository.findOne = vi.fn().mockResolvedValue(course);
      chapterRepository.count = vi.fn().mockResolvedValue(0);

      await expect(service.publish('1')).rejects.toThrow(BadRequestException);
      await expect(service.publish('1')).rejects.toThrow(/at least one chapter/);
    });

    it('throws NotFoundException when course not found', async () => {
      courseRepository.findOne = vi.fn().mockResolvedValue(null);

      await expect(service.publish('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('unpublish', () => {
    it('unpublishes course, preserves chapters', async () => {
      const course = {
        id: '1',
        title: 'Test Course',
        status: CourseStatus.PUBLISHED,
      } as Course;
      const unpublishedCourse = {
        ...course,
        status: CourseStatus.DRAFT,
      } as Course;

      courseRepository.findOne = vi.fn().mockResolvedValue(course);
      courseRepository.save = vi.fn().mockResolvedValue(unpublishedCourse);

      const result = await service.unpublish('1');

      expect(result.status).toBe(CourseStatus.DRAFT);
      // chapters are not touched - only status changes
    });

    it('throws NotFoundException when course not found', async () => {
      courseRepository.findOne = vi.fn().mockResolvedValue(null);

      await expect(service.unpublish('999')).rejects.toThrow(NotFoundException);
    });
  });
});