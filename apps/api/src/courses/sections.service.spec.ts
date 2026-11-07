import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Repository } from 'typeorm';
import { SectionsService } from './sections.service';
import { Section } from './section.entity';
import { CreateSectionDto, UpdateSectionDto } from './dto/section.dto';
import { NotFoundException } from '@nestjs/common';

const mockSectionRepository = () => ({
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(),
});

describe('SectionsService', () => {
  let service: SectionsService;
  let sectionRepository: ReturnType<typeof mockSectionRepository>;

  beforeEach(() => {
    sectionRepository = mockSectionRepository();
    vi.clearAllMocks();

    service = new SectionsService(
      sectionRepository as unknown as Repository<Section>,
    );
  });

  describe('findAllByCourse', () => {
    it('returns sections ordered by position', async () => {
      const sections = [
        { id: '1', courseId: 'course-1', title: 'Section 1', position: 1 } as Section,
        { id: '2', courseId: 'course-1', title: 'Section 2', position: 2 } as Section,
      ];
      sectionRepository.find = vi.fn().mockResolvedValue(sections);

      const result = await service.findAllByCourse('course-1');

      expect(result).toEqual(sections);
      expect(sectionRepository.find).toHaveBeenCalledWith({
        where: { courseId: 'course-1' },
        order: { position: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('returns section when found', async () => {
      const section = { id: '1', title: 'Test Section' } as Section;
      sectionRepository.findOne = vi.fn().mockResolvedValue(section);

      const result = await service.findOne('1');

      expect(result).toEqual(section);
      expect(sectionRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('returns null when not found', async () => {
      sectionRepository.findOne = vi.fn().mockResolvedValue(null);

      const result = await service.findOne('999');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates section with courseId', async () => {
      const dto: CreateSectionDto = {
        courseId: 'course-1',
        title: 'New Section',
        position: 1,
      };
      const savedSection = {
        id: 'new-id',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Section;

      sectionRepository.create = vi.fn().mockReturnValue(savedSection);
      sectionRepository.save = vi.fn().mockResolvedValue(savedSection);

      const result = await service.create('course-1', dto);

      expect(result.id).toBe('new-id');
      expect(result.title).toBe('New Section');
      expect(result.courseId).toBe('course-1');
      expect(result.position).toBe(1);
      expect(sectionRepository.create).toHaveBeenCalledWith({
        courseId: 'course-1',
        title: 'New Section',
        position: 1,
      });
    });
  });

  describe('update', () => {
    it('updates section fields', async () => {
      const existingSection = {
        id: '1',
        courseId: 'course-1',
        title: 'Old Title',
        position: 1,
      } as Section;
      const updatedSection = {
        ...existingSection,
        title: 'New Title',
        position: 2,
      } as Section;

      sectionRepository.findOne = vi.fn().mockResolvedValue(existingSection);
      sectionRepository.save = vi.fn().mockResolvedValue(updatedSection);

      const dto: UpdateSectionDto = {
        title: 'New Title',
        position: 2,
      };
      const result = await service.update('1', dto);

      expect(result).toEqual(updatedSection);
      expect(sectionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Title',
        position: 2,
      }));
    });

    it('throws NotFoundException when section not found', async () => {
      sectionRepository.findOne = vi.fn().mockResolvedValue(null);

      await expect(service.update('999', { title: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes section', async () => {
      const section = { id: '1', title: 'Test' } as Section;
      sectionRepository.findOne = vi.fn().mockResolvedValue(section);
      sectionRepository.remove = vi.fn().mockResolvedValue(undefined);

      await service.remove('1');

      expect(sectionRepository.remove).toHaveBeenCalledWith(section);
    });

    it('throws NotFoundException when section not found', async () => {
      sectionRepository.findOne = vi.fn().mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorder', () => {
    it('sets positions in order', async () => {
      sectionRepository.update = vi.fn().mockResolvedValue({ affected: 1 });

      await service.reorder('course-1', ['sec-3', 'sec-1', 'sec-2']);

      expect(sectionRepository.update).toHaveBeenCalledTimes(3);
      expect(sectionRepository.update).toHaveBeenNthCalledWith(1, { id: 'sec-3', courseId: 'course-1' }, { position: 1 });
      expect(sectionRepository.update).toHaveBeenNthCalledWith(2, { id: 'sec-1', courseId: 'course-1' }, { position: 2 });
      expect(sectionRepository.update).toHaveBeenNthCalledWith(3, { id: 'sec-2', courseId: 'course-1' }, { position: 3 });
    });
  });
});