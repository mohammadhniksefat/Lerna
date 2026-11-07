import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

/**
 * Converts raw Markdown to XSS-safe HTML.
 *
 * Parses Markdown with `marked`, then sanitizes the resulting HTML with
 * `sanitize-html` so the output is safe to render in a student-facing
 * reading interface (PRD §3.3 / NFR-05).
 *
 * Runs entirely server-side — no DOM/browser required.
 *
 * @param markdown - raw Markdown string
 * @returns sanitized HTML string (empty string for empty input)
 */
export function sanitizeMarkdown(markdownInput: string): string {
  if (!markdownInput || markdownInput.trim().length === 0) {
    return '';
  }

  const html = marked.parse(markdownInput) as string;

  return sanitizeHtml(html, {
    allowedTags: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'b',
      'strong',
      'i',
      'em',
      'u',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
      'a',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'hr',
    ],
    allowedAttributes: {
      a: ['href'],
    },
    allowedSchemes: ['https'],
    allowProtocolRelative: false,
  });
}
