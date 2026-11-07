import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { CreateChapterDto, UpdateChapterDto } from './chapter.dto';

describe('Chapter DTOs', () => {
  describe('CreateChapterDto', () => {
    it('accepts valid courseId (flat course)', async () => {
      const dto = new CreateChapterDto();
      dto.courseId = 'course-123';
      dto.title = 'Test Chapter';
      dto.content = '# Hello World';
      dto.position = 1;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts valid sectionId (section-based course)', async () => {
      const dto = new CreateChapterDto();
      dto.sectionId = 'section-456';
      dto.title = 'Test Chapter';
      dto.content = '# Hello World';
      dto.position = 1;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects empty title', async () => {
      const dto = new CreateChapterDto();
      dto.courseId = 'course-123';
      dto.title = '';
      dto.content = '# Hello World';
      dto.position = 1;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'title')).toBe(true);
    });

    it('rejects non-integer position', async () => {
      const dto = new CreateChapterDto();
      dto.courseId = 'course-123';
      dto.title = 'Test Chapter';
      dto.content = '# Hello World';
      dto.position = 1.5 as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'position')).toBe(true);
    });
  });

  describe('UpdateChapterDto', () => {
    it('accepts all optional fields', async () => {
      const dto = new UpdateChapterDto();
      dto.title = 'Updated Chapter';
      dto.content = '# Updated Content';
      dto.position = 2;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts empty object (all optional)', async () => {
      const dto = new UpdateChapterDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});