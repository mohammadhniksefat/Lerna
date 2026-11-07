import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { CreateSectionDto, UpdateSectionDto } from './section.dto';

describe('Section DTOs', () => {
  describe('CreateSectionDto', () => {
    it('accepts valid input', async () => {
      const dto = new CreateSectionDto();
      dto.courseId = 'course-123';
      dto.title = 'Test Section';
      dto.position = 1;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects empty title', async () => {
      const dto = new CreateSectionDto();
      dto.courseId = 'course-123';
      dto.title = '';
      dto.position = 1;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'title')).toBe(true);
    });

    it('rejects non-integer position', async () => {
      const dto = new CreateSectionDto();
      dto.courseId = 'course-123';
      dto.title = 'Test Section';
      dto.position = 1.5 as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'position')).toBe(true);
    });
  });

  describe('UpdateSectionDto', () => {
    it('accepts all optional fields', async () => {
      const dto = new UpdateSectionDto();
      dto.title = 'Updated Section';
      dto.position = 2;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts empty object (all optional)', async () => {
      const dto = new UpdateSectionDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});