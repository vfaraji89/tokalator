'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, Icons } from './icons';
import { Logo } from './logo';

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: string;
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: Icons.dashboard },
    ],
  },
  {
    title: 'Calculators',
    items: [
      { href: '/calculator', label: 'Cost Calculator', icon: Icons.calculator },
      { href: '/context', label: 'Context Optimizer', icon: Icons.context },
      { href: '/caching', label: 'Caching ROI', icon: Icons.caching },
      { href: '/conversation', label: 'Conversation Cost', icon: Icons.conversation },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { href: '/usage', label: 'Usage Tracker', icon: Icons.usage },
      { href: '/pricing', label: 'Pricing Reference', icon: Icons.pricing },
      { href: '/analysis', label: 'Economic Analysis', icon: Icons.analysis },
    ],
  },
  {
    title: 'Guides',
    items: [
      { href: '/tips', label: 'Context Window Tips', icon: Icons.tips, badge: 'New' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Link href="/">
          <Logo />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon
                        name={item.icon}
                        size={20}
                        className={isActive ? 'text-purple-600 dark:text-purple-400' : ''}
                        filled={isActive}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-400 space-y-1">
          <p>Based on Bergemann, Bonatti,</p>
          <p>Smolin (2025)</p>
        </div>
      </div>
    </aside>
  );
}
