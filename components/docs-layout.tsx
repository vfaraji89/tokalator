'use client';

import { ReactNode } from 'react';
import { Icon } from './icons';

interface DocsLayoutProps {
  title: string;
  description?: string;
  icon?: string;
  children: ReactNode;
}

export function DocsLayout({ title, description, icon, children }: DocsLayoutProps) {
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <header className="mb-8">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
            <Icon name={icon} size={24} className="text-purple-600 dark:text-purple-400" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </header>

      {/* Content */}
      <div className="prose prose-gray dark:prose-invert max-w-none">
        {children}
      </div>
    </div>
  );
}

// Card component for bite-sized content
interface CardProps {
  title: string;
  description?: string;
  icon?: string;
  children?: ReactNode;
  className?: string;
}

export function Card({ title, description, icon, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-start gap-4">
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <Icon name={icon} size={20} className="text-gray-600 dark:text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>
  );
}

// Tip callout component
interface TipProps {
  type?: 'tip' | 'warning' | 'info' | 'success';
  title?: string;
  children: ReactNode;
}

const tipStyles = {
  tip: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'lightbulb',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'warning',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'info',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'check_circle',
    iconColor: 'text-green-600 dark:text-green-400',
  },
};

export function Tip({ type = 'tip', title, children }: TipProps) {
  const style = tipStyles[type];

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4 flex gap-3`}>
      <Icon name={style.icon} size={20} className={`${style.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-medium text-gray-900 dark:text-white mb-1">{title}</p>
        )}
        <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>
      </div>
    </div>
  );
}

// Code block component
interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, language = 'typescript', title }: CodeBlockProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {title && (
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <Icon name="code" size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
        </div>
      )}
      <pre className="bg-gray-900 p-4 overflow-x-auto">
        <code className={`language-${language} text-sm text-gray-100`}>{code}</code>
      </pre>
    </div>
  );
}

// Step component for tutorials
interface StepProps {
  number: number;
  title: string;
  children: ReactNode;
}

export function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
        {number}
      </div>
      <div className="flex-1 pb-8 border-l-2 border-gray-200 dark:border-gray-700 pl-6 -ml-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h4>
        <div className="text-gray-600 dark:text-gray-400">{children}</div>
      </div>
    </div>
  );
}

// Grid component for cards
interface GridProps {
  cols?: 1 | 2 | 3;
  children: ReactNode;
}

export function Grid({ cols = 2, children }: GridProps) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={`grid ${colClass[cols]} gap-4`}>
      {children}
    </div>
  );
}
