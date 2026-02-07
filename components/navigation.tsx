'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';

const navItems = [
  { href: '/', label: 'Market', icon: '◉' },
  { href: '/compare', label: 'Compare', icon: '⬡' },
  { href: '/calculator', label: 'Calculator', icon: '◇' },
  { href: '/context', label: 'Context', icon: '▣' },
  { href: '/caching', label: 'Caching', icon: '◈' },
  { href: '/usage', label: 'Usage', icon: '▲' },
  { href: '/pricing', label: 'Pricing', icon: '◆' },
  { href: '/analysis', label: 'Analysis', icon: '◎' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-eco-dark border-b-2 border-eco-red sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-eco-red font-serif font-bold text-xl">Tokalator</span>
          </Link>

          <div className="flex items-center">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-[2px] ${
                    isActive
                      ? 'border-eco-red text-eco-white bg-eco-black/50'
                      : 'border-transparent text-eco-gray-400 hover:text-eco-white hover:border-eco-gray-600'
                  }`}
                >
                  <span className="mr-1.5 text-eco-red">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
