/**
 * Material Icons wrapper component
 * Uses Google Material Symbols (Outlined)
 */

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  filled?: boolean;
}

export function Icon({ name, size = 20, className = '', filled = false }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
      }}
    >
      {name}
    </span>
  );
}

// Common icon names for easy reference
export const Icons = {
  // Navigation
  dashboard: 'dashboard',
  calculator: 'calculate',
  context: 'frame_inspect',
  caching: 'cached',
  conversation: 'chat',
  usage: 'bar_chart',
  pricing: 'payments',
  analysis: 'analytics',
  tips: 'lightbulb',

  // Actions
  search: 'search',
  settings: 'settings',
  menu: 'menu',
  close: 'close',
  expand: 'expand_more',
  collapse: 'expand_less',
  copy: 'content_copy',
  check: 'check',

  // Status
  warning: 'warning',
  error: 'error',
  info: 'info',
  success: 'check_circle',

  // Content
  code: 'code',
  terminal: 'terminal',
  book: 'menu_book',
  article: 'article',

  // Misc
  rocket: 'rocket_launch',
  star: 'star',
  github: 'code',
  external: 'open_in_new',
} as const;
