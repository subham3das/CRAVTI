'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MAIN_NAV } from '../constants/navigation';
import { SITE_CONFIG } from '../constants/site';
import { Button } from './Button';
import {
  Menu as MenuIcon,
  X as CloseIcon,
  ChevronRight,
  Sparkles,
  ArrowRight,
  LogIn,
} from 'lucide-react';
import { cn } from '../lib/utils';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'glass-nav border-b border-slate-200/80 shadow-xs py-3.5'
          : 'bg-white/80 backdrop-blur-xs py-5'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FF8A60] flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform duration-200">
              <span className="font-extrabold text-xl font-display tracking-tight">C</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-[#111827] tracking-tight group-hover:text-[#FF6B35] transition-colors font-display">
                CRAVITI
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#6B7280] font-bold -mt-1">
                Restaurant OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {MAIN_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors duration-150',
                    isActive
                      ? 'text-[#FF6B35] bg-[#FFF7F4]'
                      : 'text-[#1F2937] hover:text-[#FF6B35] hover:bg-slate-50'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href={`${SITE_CONFIG.appUrl}/login`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-500" />
              <span>Restaurant Login</span>
            </a>

            <Button href="/join" size="sm" variant="primary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Join Craviti
            </Button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center sm:hidden gap-2">
            <Button href="/join" size="sm" variant="primary">
              Join
            </Button>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="lg:hidden fixed inset-x-0 top-full bg-white border-b border-slate-200 shadow-xl px-4 py-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <nav className="space-y-1">
            {MAIN_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors',
                    isActive
                      ? 'bg-[#FFF7F4] text-[#FF6B35]'
                      : 'text-[#1F2937] hover:bg-slate-50'
                  )}
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <a
              href={`${SITE_CONFIG.appUrl}/login`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50"
            >
              <LogIn className="w-4 h-4 text-slate-500" />
              <span>Sign in to Restaurant Panel</span>
            </a>

            <Button href="/join" size="md" variant="primary" className="w-full">
              Join as a Restaurant Partner
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

