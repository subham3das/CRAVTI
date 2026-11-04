'use client';

import React from 'react';
import Link from 'next/link';
import { LegalDocument } from '../types';
import { Badge } from './Badge';
import { Button } from './Button';
import {
  Shield,
  Clock,
  Printer,
  ChevronRight,
  ArrowLeft,
  FileText,
} from 'lucide-react';

interface LegalLayoutProps {
  document: LegalDocument;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ document }) => {
  return (
    <div className="pt-28 pb-20 bg-slate-50/50 min-h-screen">
      {/* Breadcrumb Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-[#FF6B35] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-400">Legal</span>
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

        {/* Content Grid with Sticky Table of Contents */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Sidebar Navigation */}
          <aside className="lg:col-span-4 sticky top-28 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Table of Contents
              </h3>
              <nav className="space-y-1">
                {document.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-[#FF6B35] hover:bg-[#FFF7F4] transition-colors truncate"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[11px] text-slate-400 block">
                  Questions regarding our policies?
                </span>
                <Link
                  href="/contact"
                  className="text-xs font-bold text-[#FF6B35] hover:underline flex items-center gap-1"
                >
                  <span>Contact Legal & Compliance</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

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
