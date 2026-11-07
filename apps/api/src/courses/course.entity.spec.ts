import { describe, it, expect } from 'vitest';
import { Course, CourseStructureType, CourseStatus } from './course.entity';

describe('Course entity', () => {
  it('has CourseStructureType enum with FLAT and SECTION_BASED', () => {
    expect(CourseStructureType.FLAT).toBe('FLAT');
    expect(CourseStructureType.SECTION_BASED).toBe('SECTION_BASED');
  });

  it('has CourseStatus enum with DRAFT and PUBLISHED', () => {
    expect(CourseStatus.DRAFT).toBe('DRAFT');
    expect(CourseStatus.PUBLISHED).toBe('PUBLISHED');
  });

  it('Course class is instantiable', () => {
    const course = new Course();
    expect(course).toBeDefined();
    expect(course).toBeInstanceOf(Course);
  });

  it('enums have correct values for database', () => {
    expect(Object.values(CourseStructureType)).toEqual(['FLAT', 'SECTION_BASED']);
    expect(Object.values(CourseStatus)).toEqual(['DRAFT', 'PUBLISHED']);
  });
});