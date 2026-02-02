import TurndownService from 'turndown';
import Showdown from 'showdown';
import { parseHTML } from 'linkedom';

// HTML to Markdown converter (for saving)
const turndownService = new TurndownService({
  headingStyle: 'atx', // Use # for headings
  codeBlockStyle: 'fenced', // Use ``` for code blocks
  bulletListMarker: '-', // Use - for bullet lists
});

// Configure turndown for better markdown output
turndownService.addRule('strikethrough', {
  filter: ['del', 's', 'strike'] as (keyof HTMLElementTagNameMap)[],
  replacement: (content) => `~~${content}~~`,
});

/**
 * Parse HTML string to a DOM node using linkedom (works in React Native)
 */
function parseHtmlToNode(html: string): Node {
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${html}</body></html>`);
  return document.body;
}

// Markdown to HTML converter (for loading)
const showdownConverter = new Showdown.Converter({
  tables: true,
  tasklists: true,
  strikethrough: true,
  ghCodeBlocks: true,
  emoji: true,
  simpleLineBreaks: true,
});

/**
 * Convert markdown to HTML for display in 10tap-editor
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '<p></p>';
  return showdownConverter.makeHtml(markdown);
}

/**
 * Convert HTML from 10tap-editor to markdown for storage
 */
export function htmlToMarkdown(html: string): string {
  if (!html || html === '<p></p>' || html === '<p><br></p>') return '';
  // Use linkedom to parse HTML since React Native doesn't have document
  const node = parseHtmlToNode(html);
  return turndownService.turndown(node as unknown as HTMLElement);
}

/**
 * Check if content is empty (handles various empty states from editor)
 */
export function isContentEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  const trimmed = html.trim();
  return (
    trimmed === '' ||
    trimmed === '<p></p>' ||
    trimmed === '<p><br></p>' ||
    trimmed === '<p><br/></p>'
  );
}
