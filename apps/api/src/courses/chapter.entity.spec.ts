import { describe, it, expect } from 'vitest';
import { Chapter } from './chapter.entity';

describe('Chapter entity', () => {
  it('Chapter class is instantiable', () => {
    const chapter = new Chapter();
    expect(chapter).toBeDefined();
    expect(chapter).toBeInstanceOf(Chapter);
  });
});