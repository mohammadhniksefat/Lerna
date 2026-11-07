import { describe, it, expect } from 'vitest';
import { validate, ValidationError } from 'class-validator';
import { CreateCourseDto, UpdateCourseDto } from './course.dto';

describe('Course DTOs', () => {
  describe('CreateCourseDto', () => {
    it('accepts valid input', async () => {
      const dto = new CreateCourseDto();
      dto.title = 'Test Course';
      dto.structureType = 'FLAT';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts SECTION_BASED structureType', async () => {
      const dto = new CreateCourseDto();
      dto.title = 'Test Course';
      dto.structureType = 'SECTION_BASED';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects empty title', async () => {
      const dto = new CreateCourseDto();
      dto.title = '';
      dto.structureType = 'FLAT';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'title')).toBe(true);
    });

    it('rejects invalid structureType', async () => {
      const dto = new CreateCourseDto();
      dto.title = 'Test Course';
      dto.structureType = 'INVALID' as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'structureType')).toBe(true);
    });

    it('accepts optional description', async () => {
      const dto = new CreateCourseDto();
      dto.title = 'Test Course';
      dto.structureType = 'FLAT';
      dto.description = 'A test course description';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects description too long', async () => {
      const dto = new CreateCourseDto();
      dto.title = 'Test Course';
      dto.structureType = 'FLAT';
      dto.description = 'x'.repeat(1001);

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'description')).toBe(true);
    });
  });

  describe('UpdateCourseDto', () => {
    it('accepts all optional fields', async () => {
      const dto = new UpdateCourseDto();
      dto.title = 'Updated';
      dto.description = 'Updated desc';
      dto.structureType = 'SECTION_BASED';
      dto.status = 'PUBLISHED';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts empty object (all optional)', async () => {
      const dto = new UpdateCourseDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects invalid status', async () => {
      const dto = new UpdateCourseDto();
      dto.status = 'INVALID' as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'status')).toBe(true);
    });
  });
});