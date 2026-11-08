import { describe, it, expect } from 'vitest';
import { getMetadataArgsStorage } from 'typeorm';
import { ChapterProgress } from './chapter-progress.entity';

describe('ChapterProgress entity', () => {
  it('ChapterProgress class is instantiable', () => {
    const progress = new ChapterProgress();
    expect(progress).toBeDefined();
    expect(progress).toBeInstanceOf(ChapterProgress);
  });

  it('has user_id column', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === ChapterProgress && c.propertyName === 'userId',
    );
    expect(columns).toHaveLength(1);
    expect(columns[0].options?.type).toBe('uuid');
  });

  it('has chapter_id column', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === ChapterProgress && c.propertyName === 'chapterId',
    );
    expect(columns).toHaveLength(1);
    expect(columns[0].options?.type).toBe('uuid');
  });

  it('has is_completed column', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === ChapterProgress && c.propertyName === 'isCompleted',
    );
    expect(columns).toHaveLength(1);
    expect(columns[0].options?.type).toBe('boolean');
    expect(columns[0].options?.default).toBe(false);
  });

  it('has completed_at column (nullable)', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === ChapterProgress && c.propertyName === 'completedAt',
    );
    expect(columns).toHaveLength(1);
    expect(columns[0].options?.nullable).toBe(true);
  });

  it('has ManyToOne relation to User', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      (r) => r.target === ChapterProgress && r.propertyName === 'user',
    );
    expect(relations).toHaveLength(1);
    expect(relations[0].relationType).toBe('many-to-one');
  });

  it('has ManyToOne relation to Chapter', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      (r) => r.target === ChapterProgress && r.propertyName === 'chapter',
    );
    expect(relations).toHaveLength(1);
    expect(relations[0].relationType).toBe('many-to-one');
  });
});
