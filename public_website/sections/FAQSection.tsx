'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SectionHeader } from '../components/SectionHeader';
import { GENERAL_FAQ } from '../constants/faq';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export const FAQSection = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <SectionHeader
          badge="Got Questions?"
          title="Frequently Asked Questions About"
          titleHighlight="Craviti"
          subtitle="Everything you need to know about setting up contactless dining, kitchen displays, bank settlements, and hardware requirements."
        />

        <div className="space-y-3.5">
          {GENERAL_FAQ.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={cn(
                  'rounded-2xl border transition-all duration-200 overflow-hidden',
                  isOpen
                    ? 'bg-slate-50/70 border-slate-300 shadow-soft'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-hidden"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-200 shrink-0',
                      isOpen && 'rotate-180 bg-[#FFF7F4] text-[#FF6B35]'
                    )}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Link to help center */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-500">
            Have a question not covered here? Visit our{' '}
            <Link href="/help" className="text-[#FF6B35] font-bold hover:underline">
              Help Center & Knowledge Base
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-[#FF6B35] font-bold hover:underline">
              chat with our onboarding specialists
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
};

