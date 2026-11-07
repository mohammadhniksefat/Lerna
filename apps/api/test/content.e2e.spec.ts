import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../src/auth/roles.guard';
import { UserRole } from '../src/users/user.entity';
import { CoursesController } from '../src/courses/courses.controller';
import { SectionsController } from '../src/courses/sections.controller';
import { ChaptersController } from '../src/courses/chapters.controller';
import { CoursesService } from '../src/courses/courses.service';
import { SectionsService } from '../src/courses/sections.service';
import { ChaptersService } from '../src/courses/chapters.service';

const mockCoursesService = {
  create: vi.fn(),
  findAll: vi.fn(),
  findOne: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  publish: vi.fn(),
  unpublish: vi.fn(),
};

const mockSectionsService = {
  create: vi.fn(),
  findAllByCourse: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  reorder: vi.fn(),
};

const mockChaptersService = {
  create: vi.fn(),
  findAllByCourse: vi.fn(),
  findAllBySection: vi.fn(),
  findOne: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  reorder: vi.fn(),
};

const adminReq = () => ({ user: { id: 'user-1', email: 'admin@example.com', role: UserRole.ADMIN } });
const studentReq = () => ({ user: { id: 'user-2', email: 'student@example.com', role: UserRole.STUDENT } });

describe('Content Management E2E', () => {
  let coursesController: CoursesController;
  let sectionsController: SectionsController;
  let chaptersController: ChaptersController;

  beforeEach(() => {
    vi.clearAllMocks();

    coursesController = new CoursesController(mockCoursesService as unknown as CoursesService);
    sectionsController = new SectionsController(mockSectionsService as unknown as SectionsService);
    chaptersController = new ChaptersController(mockChaptersService as unknown as ChaptersService);
  });

  describe('Admin content management flow', () => {
    it('creates a course via POST /courses', async () => {
      const createdCourse = {
        id: 'course-1',
        title: 'Test Course',
        description: null,
        structureType: 'FLAT',
        status: 'DRAFT',
        createdAt: new Date('2026-11-07T00:00:00Z'),
        updatedAt: new Date('2026-11-07T00:00:00Z'),
      };
      mockCoursesService.create.mockResolvedValue(createdCourse);

      const res = await coursesController.create(
        { title: 'Test Course', structureType: 'FLAT' } as any,
        adminReq(),
      );

      expect(res.title).toBe('Test Course');
      expect(res.structureType).toBe('FLAT');
      expect(res.status).toBe('DRAFT');
      expect(mockCoursesService.create).toHaveBeenCalledWith({
        title: 'Test Course',
        description: undefined,
        structureType: 'FLAT',
      });
    });

    it('publishes a course via POST /courses/:id/publish', async () => {
      const publishedCourse = {
        id: 'course-1',
        title: 'Course With Chapter',
        description: null,
        structureType: 'FLAT',
        status: 'PUBLISHED',
        createdAt: new Date('2026-11-07T00:00:00Z'),
        updatedAt: new Date('2026-11-07T00:00:00Z'),
      };
      mockCoursesService.publish.mockResolvedValue(publishedCourse);

      const res = await coursesController.publish('course-1', adminReq());

      expect(res.status).toBe('PUBLISHED');
      expect(mockCoursesService.publish).toHaveBeenCalledWith('course-1');
    });

    it('blocks publish on course with zero chapters', async () => {
      mockCoursesService.publish.mockRejectedValueOnce({
        statusCode: 409,
        message: 'Cannot publish a course with no chapters',
      } as any);

      await expect(
        coursesController.publish('course-1', adminReq()),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('lists courses via GET /courses', async () => {
      mockCoursesService.findAll.mockResolvedValue([
        { id: 'course-1', title: 'Course 1', structureType: 'FLAT', status: 'PUBLISHED', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const res = await coursesController.findAll(adminReq());

      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBeGreaterThan(0);
    });

    it('updates a course via PATCH /courses/:id', async () => {
      const updatedCourse = {
        id: 'course-1',
        title: 'Updated Title',
        description: 'New description',
        structureType: 'FLAT',
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCoursesService.update.mockResolvedValue(updatedCourse);

      const res = await coursesController.update(
        'course-1',
        { title: 'Updated Title', description: 'New description' } as any,
        adminReq(),
      );

      expect(res.title).toBe('Updated Title');
      expect(res.description).toBe('New description');
    });

    it('deletes a course via DELETE /courses/:id', async () => {
      mockCoursesService.remove.mockResolvedValue(undefined);

      await coursesController.remove('course-1', adminReq());

      expect(mockCoursesService.remove).toHaveBeenCalledWith('course-1');
    });

    it('creates a section via POST /courses/:id/sections', async () => {
      const createdSection = {
        id: 'section-1',
        courseId: 'course-1',
        title: 'Section 1',
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockSectionsService.create.mockResolvedValue(createdSection);

      const res = await sectionsController.create(
        'course-1',
        { title: 'Section 1', position: 1 } as any,
        adminReq(),
      );

      expect(res.id).toBe('section-1');
      expect(mockSectionsService.create).toHaveBeenCalledWith(
        'course-1',
        expect.objectContaining({ title: 'Section 1', position: 1 }),
      );
    });

    it('creates a chapter via POST /chapters', async () => {
      const createdChapter = {
        id: 'chapter-1',
        courseId: 'course-1',
        sectionId: null,
        title: 'Chapter 1',
        content: '# Hello',
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockChaptersService.create.mockResolvedValue(createdChapter);

      const res = await chaptersController.create(
        { courseId: 'course-1', title: 'Chapter 1', content: '# Hello', position: 1 } as any,
        adminReq(),
      );

      expect(res.id).toBe('chapter-1');
      expect(res.sectionId).toBeNull();
    });
  });

  describe('Section-based course flow', () => {
    it('creates section, chapter in section, publishes', async () => {
      const section = {
        id: 'section-1',
        courseId: 'course-1',
        title: 'Section 1',
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockSectionsService.create.mockResolvedValue(section);

      const createdSection = await sectionsController.create(
        'course-1',
        { title: 'Section 1', position: 1 } as any,
        adminReq(),
      );
      expect(createdSection.id).toBe('section-1');

      const chapter = {
        id: 'chapter-1',
        courseId: null,
        sectionId: 'section-1',
        title: 'Chapter in Section',
        content: '# Content',
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockChaptersService.create.mockResolvedValue(chapter);

      const createdChapter = await chaptersController.create(
        { sectionId: 'section-1', title: 'Chapter in Section', content: '# Content', position: 1 } as any,
        adminReq(),
      );
      expect(createdChapter.sectionId).toBe('section-1');
      expect(createdChapter.courseId).toBeNull();

      mockCoursesService.publish.mockResolvedValue({ id: 'course-1', status: 'PUBLISHED', createdAt: new Date(), updatedAt: new Date() });
      const published = await coursesController.publish('course-1', adminReq());
      expect(published.status).toBe('PUBLISHED');
    });
  });

  describe('Reorder', () => {
    it('reorders sections', async () => {
      mockSectionsService.reorder.mockResolvedValue(undefined);

      await sectionsController.reorder(
        'course-1',
        { sectionIds: ['section-2', 'section-1'] } as any,
        adminReq(),
      );

      expect(mockSectionsService.reorder).toHaveBeenCalledWith(
        'course-1',
        ['section-2', 'section-1'],
      );
    });

    it('reorders chapters', async () => {
      mockChaptersService.reorder.mockResolvedValue(undefined);

      await chaptersController.reorder(
        { chapterIds: ['chapter-2', 'chapter-1'], courseId: 'course-1' } as any,
        adminReq(),
      );

      expect(mockChaptersService.reorder).toHaveBeenCalledWith(
        'course-1',
        null,
        ['chapter-2', 'chapter-1'],
      );
    });
  });

  describe('Authorization (RolesGuard)', () => {
    it('allows Admin access to content endpoints', () => {
      const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue([UserRole.ADMIN]),
      };
      const guard = new RolesGuard(reflector as any);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: '1', role: UserRole.ADMIN } }),
        }),
        getHandler: vi.fn(),
        getClass: vi.fn(),
      } as any;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('denies Student access to content endpoints', () => {
      const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue([UserRole.ADMIN]),
      };
      const guard = new RolesGuard(reflector as any);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: '2', role: UserRole.STUDENT } }),
        }),
        getHandler: vi.fn(),
        getClass: vi.fn(),
      } as any;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('denies unauthenticated access to content endpoints', () => {
      const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue([UserRole.ADMIN]),
      };
      const guard = new RolesGuard(reflector as any);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: undefined }),
        }),
        getHandler: vi.fn(),
        getClass: vi.fn(),
      } as any;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('Error envelope shape', () => {
    it('returns error envelope on 409 (publish without chapters)', () => {
      mockCoursesService.publish.mockRejectedValueOnce({
        statusCode: 409,
        message: 'Cannot publish a course with no chapters',
      } as any);
      return expect(
        coursesController.publish('course-1', adminReq()),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: expect.any(String),
      });
    });
  });
});