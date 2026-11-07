import { describe, it, expect } from 'vitest';
import { sanitizeMarkdown } from './markdown';

describe('sanitizeMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeMarkdown('')).toBe('');
    expect(sanitizeMarkdown('   ')).toBe('');
  });

  it('renders common Markdown elements to HTML', () => {
    const html = sanitizeMarkdown(
      '# Heading\n\n**bold** and *italic*\n\n- item 1\n- item 2\n\n[link](https://example.com)\n\n```\ncode block\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |',
    );

    expect(html).toContain('<h1>Heading</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>item 1</li>');
    expect(html).toContain('<a href="https://example.com">link</a>');
    expect(html).toContain('<pre>');
    expect(html).toContain('<table>');
  });

  it('strips script tags', () => {
    const html = sanitizeMarkdown('text <script>alert(1)</script> more');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('alert(1)');
  });

  it('strips inline event handlers', () => {
    const html = sanitizeMarkdown('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('alert(1)');
  });

  it('strips onload handlers', () => {
    const html = sanitizeMarkdown('<svg onload=alert(1)>');
    expect(html).not.toContain('onload');
    expect(html).not.toContain('alert(1)');
  });

  it('neutralizes javascript: URLs', () => {
    const html = sanitizeMarkdown('<a href="javascript:alert(1)">x</a>');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('alert(1)');
  });

  it('preserves safe https links', () => {
    const html = sanitizeMarkdown('[docs](https://example.com)');
    expect(html).toContain('href="https://example.com"');
  });

  it('does not allow http links', () => {
    const html = sanitizeMarkdown('<a href="http://example.com">x</a>');
    expect(html).not.toContain('href="http://example.com"');
  });
});
