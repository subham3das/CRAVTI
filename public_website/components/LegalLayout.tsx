'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LegalDocument } from '../types';
import { Badge } from './Badge';
import { Button } from './Button';
import {
  Shield,
  Clock,
  Printer,
  ChevronRight,
  ChevronDown,
  FileText,
} from 'lucide-react';

interface LegalLayoutProps {
  document: LegalDocument;
}

export const LEGAL_NAVIGATION = [
  { label: 'Privacy Policy', href: '/privacy-policy', slug: 'privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms-and-conditions', slug: 'terms-and-conditions' },
  { label: 'Refund Policy', href: '/refund-policy', slug: 'refund-policy' },
  { label: 'Cancellation Policy', href: '/cancellation-policy', slug: 'cancellation-policy' },
  { label: 'Shipping & Delivery Policy', href: '/shipping-policy', slug: 'shipping-policy' },
  { label: 'Cookie Policy', href: '/cookie-policy', slug: 'cookie-policy' },
  { label: 'Disclaimer', href: '/disclaimer', slug: 'disclaimer' },
  { label: 'Security Policy', href: '/security-policy', slug: 'security-policy' },
  { label: 'Merchant Agreement', href: '/merchant-agreement', slug: 'merchant-agreement' },
  { label: 'Customer Terms', href: '/customer-terms', slug: 'customer-terms' },
  { label: 'Data Processing (DPA)', href: '/data-processing-agreement', slug: 'data-processing-agreement' },
  { label: 'Acceptable Use Policy', href: '/acceptable-use-policy', slug: 'acceptable-use-policy' },
  { label: 'GDPR Compliance', href: '/gdpr', slug: 'gdpr' },
  { label: 'CCPA Privacy', href: '/ccpa', slug: 'ccpa' },
  { label: 'Contact & Legal', href: '/contact', slug: 'contact' },
];

export const LegalLayout: React.FC<LegalLayoutProps> = ({ document }) => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="pt-28 pb-20 bg-slate-50/50 min-h-screen">
      {/* Breadcrumb Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-[#FF6B35] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-400">Legal Center</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-bold">{document.title}</span>
        </div>
      </div>

      {/* Main Document Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Document Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-soft mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight font-display">
                  {document.title}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official Legal Framework of Craviti Technologies Private Limited
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="neutral" size="sm" icon={<Clock className="w-3 h-3" />}>
                Last Updated: {document.lastUpdated}
              </Badge>
              <button
                type="button"
                onClick={() => window.print()}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Copy</span>
              </button>
            </div>
          </div>

          <div className="pt-6">
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              {document.summary}
            </p>
          </div>
        </div>

        {/* Mobile Legal Center Dropdown (Mobile View) */}
        <div className="lg:hidden mb-6 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Legal Pages</span>
            </span>
            <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {document.title}
            </span>
          </div>

          <div className="relative">
            <select
              value={pathname}
              onChange={(e) => {
                if (e.target.value) {
                  router.push(e.target.value);
                }
              }}
              aria-label="Legal Pages Dropdown"
              className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl py-3 pl-3.5 pr-10 appearance-none focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="" disabled>
                Legal Pages ▼
              </option>
              {LEGAL_NAVIGATION.map((item) => {
                const isActive = pathname === item.href || document.slug === item.slug;
                return (
                  <option key={item.href} value={item.href}>
                    📄 {item.label} {isActive ? '← Active' : ''}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Collapsible On This Page for mobile */}
          {document.sections && document.sections.length > 0 && (
            <details className="pt-2 border-t border-slate-100 group">
              <summary className="text-xs font-bold text-slate-600 cursor-pointer flex items-center justify-between py-1 list-none">
                <span>On This Page ({document.sections.length} sections)</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="pt-2 space-y-1">
                {document.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-xs text-slate-600 hover:text-blue-600 py-1 pl-2 border-l border-slate-200 hover:border-blue-500 truncate"
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Content Grid with Sticky Sidebar Navigation (Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Sidebar Navigation (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-28 space-y-4 max-h-[calc(100vh-8.5rem)] overflow-y-auto pr-1">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
              {/* Legal Center Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    §
                  </div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 font-display">
                    Legal Center
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  {LEGAL_NAVIGATION.length} Docs
                </span>
              </div>

              {/* Legal Documents Links */}
              <nav className="space-y-1">
                {LEGAL_NAVIGATION.map((item) => {
                  const isActive = pathname === item.href || document.slug === item.slug;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-bold border-l-2 border-blue-600 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="text-xs shrink-0">{isActive ? '📘' : '📄'}</span>
                        <span className="truncate">{item.label}</span>
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-extrabold text-blue-600 shrink-0 ml-1.5">
                          ← Active
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Preserved Current Section Table of Contents: ON THIS PAGE */}
              {document.sections && document.sections.length > 0 && (
                <>
                  <div className="border-t border-slate-100 my-4" />
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      On This Page
                    </h4>
                    <nav className="space-y-1">
                      {document.sections.map((section) => (
                        <a
                          key={section.id}
                          href={`#${section.id}`}
                          className="block px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors truncate"
                        >
                          {section.title}
                        </a>
                      ))}
                    </nav>
                  </div>
                </>
              )}

              {/* Compliance Contact */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[11px] text-slate-400 block">
                  Questions regarding our policies?
                </span>
                <Link
                  href="/contact"
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>Contact Legal & Compliance</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Enterprise Security Box */}
            <div className="bg-gradient-to-br from-slate-900 to-[#111827] rounded-2xl p-5 text-white shadow-soft space-y-3">
              <div className="flex items-center gap-2 text-[#FF6B35]">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Enterprise Security</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                All restaurant data is stored in ISO 27001 certified AWS India data vaults with 256-bit AES encryption.
              </p>
              <Button href="/security" size="sm" variant="outline" className="w-full text-xs text-slate-900">
                Explore Security SLA
              </Button>
            </div>
          </aside>

          {/* Main Document Text Body */}
          <main className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-soft space-y-10">
            {document.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-32 space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#111827] tracking-tight pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>{section.title}</span>
                  <a
                    href={`#${section.id}`}
                    className="text-slate-300 hover:text-[#FF6B35] text-xs font-mono font-bold"
                    aria-label={`Link to ${section.title}`}
                  >
                    #
                  </a>
                </h2>
                <div className="text-sm text-slate-700 leading-relaxed font-normal space-y-3 whitespace-pre-line">
                  {section.content.trim()}
                </div>
              </section>
            ))}

            {/* Document Footer Signoff */}
            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
              <div>
                <span>Governing Law: Republic of India • Jurisdiction: Bengaluru, Karnataka</span>
              </div>
              <Button href="/join" size="sm" variant="primary">
                Join Craviti Network
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
