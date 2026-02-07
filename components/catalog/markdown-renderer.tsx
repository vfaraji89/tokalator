'use client';

import { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
}

/**
 * Lightweight markdown renderer that handles common patterns.
 * Renders headings, code blocks, lists, bold, italic, and links.
 */
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div
      className="prose prose-invert max-w-none
        [&_h1]:font-serif [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-eco-gray-100 [&_h1]:mt-8 [&_h1]:mb-4
        [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-eco-gray-100 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-eco-gray-800 [&_h2]:pb-2
        [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-eco-gray-200 [&_h3]:mt-4 [&_h3]:mb-2
        [&_p]:text-sm [&_p]:text-eco-gray-300 [&_p]:leading-relaxed [&_p]:mb-4
        [&_ul]:text-sm [&_ul]:text-eco-gray-300 [&_ul]:mb-4 [&_ul]:pl-4 [&_ul]:list-disc
        [&_ol]:text-sm [&_ol]:text-eco-gray-300 [&_ol]:mb-4 [&_ol]:pl-4 [&_ol]:list-decimal
        [&_li]:mb-1
        [&_code]:text-eco-red [&_code]:text-xs [&_code]:bg-eco-gray-900 [&_code]:px-1.5 [&_code]:py-0.5
        [&_pre]:bg-eco-gray-900 [&_pre]:border [&_pre]:border-eco-gray-800 [&_pre]:p-4 [&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:text-xs
        [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-eco-gray-300
        [&_a]:text-eco-red [&_a]:underline [&_a]:hover:text-eco-red-light
        [&_blockquote]:border-l-4 [&_blockquote]:border-eco-red [&_blockquote]:pl-4 [&_blockquote]:text-eco-gray-400 [&_blockquote]:italic
        [&_table]:eco-table [&_table]:mb-4
        [&_strong]:text-eco-gray-100
        [&_em]:text-eco-gray-200
        [&_hr]:border-eco-gray-800 [&_hr]:my-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderMarkdown(md: string): string {
  let html = md;

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Paragraphs - wrap remaining text lines
  html = html.replace(/^(?!<[hupblo]|<\/|<li|<hr|<pre|<code|<blockquote)(.+)$/gm, '<p>$1</p>');

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
