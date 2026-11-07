import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Repository } from 'typeorm';
import { ChaptersService } from './chapters.service';
import { Chapter } from './chapter.entity';
import { CreateChapterDto, UpdateChapterDto } from './dto/chapter.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockChapterRepository = () => ({
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(),
});

describe('ChaptersService', () => {
  let service: ChaptersService;
  let chapterRepository: ReturnType<typeof mockChapterRepository>;

  beforeEach(() => {
    chapterRepository = mockChapterRepository();
    vi.clearAllMocks();

    service = new ChaptersService(
      chapterRepository as unknown as Repository<Chapter>,
    );
  });

  describe('findAllByCourse', () => {
    it('returns only direct chapters (sectionId null) ordered by position', async () => {
      const chapters = [
        { id: '1', courseId: 'course-1', sectionId: null, title: 'Chapter 1', position: 1 } as Chapter,
        { id: '2', courseId: 'course-1', sectionId: null, title: 'Chapter 2', position: 2 } as Chapter,
      ];
      chapterRepository.find = vi.fn().mockResolvedValue(chapters);

      const result = await service.findAllByCourse('course-1');

      expect(result).toEqual(chapters);
      expect(chapterRepository.find).toHaveBeenCalledWith({
        where: { courseId: 'course-1', sectionId: undefined },
        order: { position: 'ASC' },
      });
    });
  });

  describe('findAllBySection', () => {
    it('returns chapters in section ordered by position', async () => {
      const chapters = [
        { id: '1', sectionId: 'section-1', title: 'Chapter 1', position: 1 } as Chapter,
        { id: '2', sectionId: 'section-1', title: 'Chapter 2', position: 2 } as Chapter,
      ];
      chapterRepository.find = vi.fn().mockResolvedValue(chapters);

      const result = await service.findAllBySection('section-1');

      expect(result).toEqual(chapters);
      expect(chapterRepository.find).toHaveBeenCalledWith({
        where: { sectionId: 'section-1' },
        order: { position: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('returns chapter when found', async () => {
      const chapter = { id: '1', title: 'Test Chapter' } as Chapter;
      chapterRepository.findOne = vi.fn().mockResolvedValue(chapter);

      const result = await service.findOne('1');

      expect(result).toEqual(chapter);
    });

    it('returns null when not found', async () => {
      chapterRepository.findOne = vi.fn().mockResolvedValue(null);

      const result = await service.findOne('999');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates chapter with courseId (flat course)', async () => {
      const dto: CreateChapterDto = {
        courseId: 'course-1',
        title: 'Test Chapter',
        content: '# Hello',
        position: 1,
      };
      const savedChapter = {
        id: 'new-id',
        ...dto,
        sectionId: undefined,
        course: undefined,
        section: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Chapter;

      chapterRepository.create = vi.fn().mockReturnValue(savedChapter);
      chapterRepository.save = vi.fn().mockResolvedValue(savedChapter);

      const result = await service.create(dto);

      expect(result.id).toBe('new-id');
      expect(result.courseId).toBe('course-1');
      expect(result.sectionId).toBeUndefined();
      expect(chapterRepository.create).toHaveBeenCalledWith({
        courseId: 'course-1',
        sectionId: undefined,
        title: 'Test Chapter',
        content: '# Hello',
        position: 1,
      });
    });

    it('creates chapter with sectionId (section-based course)', async () => {
      const dto: CreateChapterDto = {
        sectionId: 'section-1',
        title: 'Test Chapter',
        content: '# Hello',
        position: 1,
      };
      const savedChapter = {
        id: 'new-id',
        ...dto,
        courseId: null,
        course: null,
        section: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Chapter;

      chapterRepository.create = vi.fn().mockReturnValue(savedChapter);
      chapterRepository.save = vi.fn().mockResolvedValue(savedChapter);

      const result = await service.create(dto);

      expect(result.sectionId).toBe('section-1');
      expect(result.courseId).toBeNull();
    });

    it('throws BadRequestException when both courseId and sectionId provided', async () => {
      const dto: CreateChapterDto = {
        courseId: 'course-1',
        sectionId: 'section-1',
        title: 'Test Chapter',
        content: '# Hello',
        position: 1,
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(/Exactly one of courseId or sectionId/);
    });

    it('throws BadRequestException when neither courseId nor sectionId provided', async () => {
      const dto: CreateChapterDto = {
        title: 'Test Chapter',
        content: '# Hello',
        position: 1,
      } as any;

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(/Exactly one of courseId or sectionId/);
    });
  });

  describe('update', () => {
    it('updates chapter fields', async () => {
      const existingChapter = {
        id: '1',
        courseId: 'course-1',
        sectionId: null,
        title: 'Old Title',
        content: 'Old content',
        position: 1,
      } as Chapter;
      const updatedChapter = {
        ...existingChapter,
        title: 'New Title',
        position: 2,
      } as Chapter;

      chapterRepository.findOne = vi.fn().mockResolvedValue(existingChapter);
      chapterRepository.save = vi.fn().mockResolvedValue(updatedChapter);

      const dto: UpdateChapterDto = {
        title: 'New Title',
        position: 2,
      };
      const result = await service.update('1', dto);

      expect(result).toEqual(updatedChapter);
    });

    it('throws NotFoundException when chapter not found', async () => {
      chapterRepository.findOne = vi.fn().mockResolvedValue(null);

      await expect(service.update('999', { title: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes chapter', async () => {
      const chapter = { id: '1', title: 'Test' } as Chapter;
      chapterRepository.findOne = vi.fn().mockResolvedValue(chapter);
      chapterRepository.remove = vi.fn().mockResolvedValue(undefined);

      await service.remove('1');

      expect(chapterRepository.remove).toHaveBeenCalledWith(chapter);
    });

    it('throws NotFoundException when chapter not found', async () => {
      chapterRepository.findOne = vi.fn().mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorder', () => {
    it('reorders chapters within course scope', async () => {
      chapterRepository.update = vi.fn().mockResolvedValue({ affected: 1 });

      await service.reorder('course-1', null, ['ch-3', 'ch-1', 'ch-2']);

      expect(chapterRepository.update).toHaveBeenCalledTimes(3);
      expect(chapterRepository.update).toHaveBeenNthCalledWith(1, { courseId: 'course-1', sectionId: undefined, id: 'ch-3' }, { position: 1 });
      expect(chapterRepository.update).toHaveBeenNthCalledWith(2, { courseId: 'course-1', sectionId: undefined, id: 'ch-1' }, { position: 2 });
      expect(chapterRepository.update).toHaveBeenNthCalledWith(3, { courseId: 'course-1', sectionId: undefined, id: 'ch-2' }, { position: 3 });
    });

    it('reorders chapters within section scope', async () => {
      chapterRepository.update = vi.fn().mockResolvedValue({ affected: 1 });

      await service.reorder(null, 'section-1', ['ch-3', 'ch-1', 'ch-2']);

      expect(chapterRepository.update).toHaveBeenCalledTimes(3);
      expect(chapterRepository.update).toHaveBeenNthCalledWith(1, { sectionId: 'section-1', id: 'ch-3' }, { position: 1 });
      expect(chapterRepository.update).toHaveBeenNthCalledWith(2, { sectionId: 'section-1', id: 'ch-1' }, { position: 2 });
      expect(chapterRepository.update).toHaveBeenNthCalledWith(3, { sectionId: 'section-1', id: 'ch-2' }, { position: 3 });
    });
  });
});