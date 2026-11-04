import React from 'react';
import Link from 'next/link';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { TESTIMONIALS } from '../constants/testimonials';
import { Star, Quote, ArrowRight, CheckCircle } from 'lucide-react';

export const Testimonials = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <SectionHeader
          badge="Verified Merchant Stories"
          title="Loved by Executive Chefs,"
          titleHighlight="Trusted by Owners"
          subtitle="Real results from high-volume dining rooms across India running on Craviti."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <Card
              key={t.id}
              hoverEffect
              className="flex flex-col justify-between p-8 bg-slate-50/50 border border-slate-200/80"
            >
              <div className="space-y-4">
                {/* Rating stars & Quote Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-[#FF6B35]/20" />
                </div>

                {/* Highlight Metric Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF7F4] text-[#FF6B35] border border-[#FFD5C5] text-xs font-bold">
                  <span>{t.metrics.stat}</span>
                  <span className="text-slate-500 font-medium">• {t.metrics.label}</span>
                </div>

                {/* Quote body */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Author footer */}
              <div className="pt-6 mt-6 border-t border-slate-200/70 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.author}</h4>
                  <p className="text-xs text-[#FF6B35] font-semibold">{t.restaurant}</p>
                  <p className="text-[11px] text-slate-400">{t.location}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* View all case studies link */}
        <div className="text-center">
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#FF6B35] hover:text-[#E85A26] transition-colors group"
          >
            <span>Read full in-depth restaurant case studies</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

