'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CatalogItem } from '@/lib/types/catalog';
import { MarkdownRenderer } from './markdown-renderer';
import { parseFrontmatter } from '@/lib/catalog/frontmatter';

interface CatalogDetailProps {
  item: CatalogItem;
}

const ecosystemColors: Record<string, string> = {
  copilot: 'bg-[#1f6feb] text-white',
  'claude-code': 'bg-[#d97706] text-white',
  universal: 'bg-eco-gray-700 text-eco-gray-200',
};

const ecosystemLabels: Record<string, string> = {
  copilot: 'Copilot',
  'claude-code': 'Claude Code',
  universal: 'Universal',
};

const sourceLabels: Record<string, string> = {
  builtin: 'Built-in',
  'awesome-copilot': 'Community',
  community: 'Community',
  user: 'Your Content',
};

const kindRoutes: Record<string, string> = {
  agent: '/agents',
  prompt: '/prompts',
  instruction: '/instructions',
  collection: '/collections',
};

export function CatalogDetail({ item }: CatalogDetailProps) {
  const [copied, setCopied] = useState(false);
  const { body } = parseFrontmatter(item.rawContent);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-xs text-eco-gray-500">
        <Link href="/" className="hover:text-eco-gray-300">Home</Link>
        <span>/</span>
        <Link href={kindRoutes[item.kind] || '/agents'} className="hover:text-eco-gray-300 capitalize">
          {item.kind}s
        </Link>
        <span>/</span>
        <span className="text-eco-gray-300">{item.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Header */}
          <div className="mb-8">
            <div className="eco-divider-thick w-16" style={{ margin: 0, marginBottom: '1rem' }} />
            <h1 className="headline text-eco-gray-100 mb-3">{item.name}</h1>
            <p className="subheadline">{item.description}</p>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <span className={`eco-badge ${ecosystemColors[item.ecosystem]}`}>
                {ecosystemLabels[item.ecosystem]}
              </span>
              <span className="eco-badge eco-badge-outline text-eco-gray-400 capitalize">
                {item.kind}
              </span>
              <span className="text-xs text-eco-gray-500">
                {sourceLabels[item.source]}
              </span>
              {item.featured && (
                <span className="eco-badge eco-badge-red">Featured</span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="eco-card-flat">
            <MarkdownRenderer content={body} />
          </div>

          {/* Copy button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-eco-gray-900 text-eco-gray-400 hover:text-eco-gray-100 hover:bg-eco-gray-800 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Raw Content'}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Metadata */}
          <div className="eco-card-flat space-y-4">
            <h3 className="data-label">Details</h3>

            {item.model && (
              <div>
                <span className="text-[10px] text-eco-gray-600 uppercase tracking-wider block">Model</span>
                <span className="text-sm text-eco-gray-200">{item.model}</span>
              </div>
            )}

            {item.tools && item.tools.length > 0 && (
              <div>
                <span className="text-[10px] text-eco-gray-600 uppercase tracking-wider block mb-1">Tools</span>
                <div className="flex flex-wrap gap-1">
                  {item.tools.map((tool) => (
                    <span key={tool} className="text-xs bg-eco-gray-900 text-eco-gray-400 px-2 py-0.5">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.tags.length > 0 && (
              <div>
                <span className="text-[10px] text-eco-gray-600 uppercase tracking-wider block mb-1">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-eco-gray-900 text-eco-gray-400 px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-[10px] text-eco-gray-600 uppercase tracking-wider block">File</span>
              <span className="text-xs text-eco-gray-500 break-all">{item.filePath}</span>
            </div>
          </div>

          {/* Usage */}
          <div className="eco-card-flat space-y-3">
            <h3 className="data-label">How to Use</h3>

            {item.ecosystem === 'copilot' && (
              <div>
                <span className="text-[10px] text-[#1f6feb] uppercase tracking-wider block mb-1">In Copilot</span>
                <p className="text-xs text-eco-gray-400">
                  {item.kind === 'agent' && 'Add this .agent.md file to your .github/ directory or reference it via @agent in Copilot Chat.'}
                  {item.kind === 'prompt' && 'Add this .prompt.md file to your .github/prompts/ directory and invoke it from Copilot Chat.'}
                  {item.kind === 'instruction' && 'Add to .github/copilot-instructions.md to apply globally.'}
                  {item.kind === 'collection' && 'This collection bundles related agents, prompts, and instructions.'}
                </p>
              </div>
            )}

            {item.ecosystem === 'claude-code' && (
              <div>
                <span className="text-[10px] text-[#d97706] uppercase tracking-wider block mb-1">In Claude Code</span>
                <p className="text-xs text-eco-gray-400">
                  Add to your CLAUDE.md file or .claude/ directory for project-level configuration.
                </p>
              </div>
            )}

            {item.ecosystem === 'universal' && (
              <div>
                <p className="text-xs text-eco-gray-400">
                  Works with both Copilot and Claude Code. See the content for specific setup instructions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
