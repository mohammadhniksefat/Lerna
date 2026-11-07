import { describe, it, expect } from 'vitest';
import { Section } from './section.entity';

describe('Section entity', () => {
  it('Section class is instantiable', () => {
    const section = new Section();
    expect(section).toBeDefined();
    expect(section).toBeInstanceOf(Section);
  });
});