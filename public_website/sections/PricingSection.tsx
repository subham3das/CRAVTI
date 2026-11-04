'use client';

import React from 'react';
import Link from 'next/link';
import { SectionHeader } from '../components/SectionHeader';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { PRICING_PLANS, COMPARISON_CATEGORIES } from '../constants/pricing';
import { Check, ArrowRight, Sparkles, Building2, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface PricingSectionProps {
  isFullPage?: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ isFullPage = false }) => {
  const standardPlan = PRICING_PLANS.find((p) => p.id === 'standard') || PRICING_PLANS[0];
  const enterprisePlan = PRICING_PLANS.find((p) => p.id === 'enterprise') || PRICING_PLANS[1];

  return (
    <section className="py-24 bg-slate-50/50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Section Header */}
        <SectionHeader
          badge="Simple, Transparent Pricing"
          title="Predictable Pricing for Modern"
          titleHighlight="Restaurants"
          subtitle="Zero setup fees, zero hardware lock-in, and zero hidden sales commissions. Choose the plan that fits your dining room."
        />

        {/* TWO PRICING CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
          {/* CARD 1: Craviti Standard */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-soft hover:shadow-elevated transition-all duration-300 flex flex-col justify-between relative">
            <div className="space-y-6">
              {/* Top Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="primary" size="sm">
                    Full Feature Platform
                  </Badge>
                  <span className="text-[11px] font-bold text-slate-400">Single & Multi-Table</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-display">
                  {standardPlan.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed font-normal">
                  {standardPlan.tagline}
                </p>
              </div>

              {/* Price Block */}
              <div className="pb-5 border-b border-slate-100 space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-extrabold text-[#111827] font-display tracking-tight">
                    {standardPlan.priceDisplay}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    {standardPlan.pricePeriod}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Flat monthly pricing • Zero sales commissions • 14-day free trial
                </p>
              </div>

              {/* Feature List */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Everything Included:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {standardPlan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="pt-8 mt-8 border-t border-slate-100 space-y-2">
              <Button
                href={standardPlan.ctaHref}
                size="lg"
                variant="primary"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full text-sm font-bold shadow-soft"
              >
                {standardPlan.ctaText}
              </Button>
              <p className="text-center text-[11px] text-slate-400">
                No credit card required • Setup in under 2 hours
              </p>
            </div>
          </div>

          {/* CARD 2: Enterprise (Light Theme) */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-soft hover:shadow-elevated transition-all duration-300 flex flex-col justify-between relative">
            <div className="space-y-6">
              {/* Top Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20 tracking-wide uppercase">
                    Custom Scale & Integrations
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Restaurant Chains</span>
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-display">
                  {enterprisePlan.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed font-normal">
                  {enterprisePlan.tagline}
                </p>
              </div>

              {/* Price Block */}
              <div className="pb-5 border-b border-slate-100 space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-extrabold text-[#111827] font-display tracking-tight">
                    {enterprisePlan.priceDisplay}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {enterprisePlan.pricePeriod} • Dedicated engineering & SLA backing
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-3">
                {/* Everything in Standard Callout */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    Everything in Craviti Standard
                  </span>
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35] block pt-1">
                  PLUS Custom Integrations & Bespoke Development:
                </span>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(enterprisePlan.enterprisePlus || []).map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-[#FF6B35] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="pt-8 mt-8 border-t border-slate-100 space-y-2">
              <Button
                href={enterprisePlan.ctaHref}
                size="lg"
                variant="primary"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full text-sm font-bold shadow-soft"
              >
                {enterprisePlan.ctaText}
              </Button>
              <p className="text-center text-[11px] text-slate-400">
                Custom feature scope & migration consultation within 24 hours
              </p>
            </div>
          </div>
        </div>

        {/* PROFESSIONAL FEATURE COMPARISON TABLE (Standard vs Enterprise) */}
        <div className="space-y-8 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="neutral" size="sm">
              Comprehensive Matrix
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-display">
              Standard vs. Enterprise Comparison
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Clear, transparent comparison showing how Enterprise includes dedicated integrations, custom engineering, and bespoke workflows.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                {/* Table Header */}
                <thead className="bg-[#111827] text-white">
                  <tr>
                    <th className="py-4 px-6 uppercase text-[11px] font-extrabold tracking-wider w-1/2 sm:w-5/12">
                      Capability & Workflow
                    </th>
                    <th className="py-4 px-6 text-center uppercase text-[11px] font-extrabold tracking-wider w-1/4 sm:w-3.5/12">
                      <div className="space-y-0.5">
                        <span className="block text-white">Craviti Standard</span>
                        <span className="block text-[10px] text-slate-400 font-normal">₹1,500 / month</span>
                      </div>
                    </th>
                    <th className="py-4 px-6 text-center uppercase text-[11px] font-extrabold tracking-wider w-1/4 sm:w-3.5/12 bg-slate-900 border-l border-slate-800">
                      <div className="space-y-0.5">
                        <span className="block text-[#FF6B35]">Enterprise</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Custom Pricing</span>
                      </div>
                    </th>
                  </tr>
                </thead>

                {/* Table Body Grouped by Category */}
                <tbody className="divide-y divide-slate-100">
                  {COMPARISON_CATEGORIES.map((cat, catIdx) => (
                    <React.Fragment key={catIdx}>
                      {/* Category Header Row */}
                      <tr className="bg-slate-50/80 border-t border-b border-slate-200/70">
                        <td
                          colSpan={3}
                          className="py-3 px-6 text-xs font-extrabold text-[#111827] uppercase tracking-wider font-display"
                        >
                          {cat.name}
                        </td>
                      </tr>

                      {/* Row Items */}
                      {cat.rows.map((row, rowIdx) => {
                        const isEnterpriseSpecial =
                          row.standard === '—' && row.enterprise.includes('Included');

                        return (
                          <tr
                            key={rowIdx}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-3.5 px-6 font-semibold text-slate-800">
                              {row.feature}
                            </td>
                            <td className="py-3.5 px-6 text-center text-slate-600 font-medium">
                              {row.standard === '—' ? (
                                <span className="text-slate-300 font-bold">—</span>
                              ) : (
                                row.standard
                              )}
                            </td>
                            <td
                              className={cn(
                                'py-3.5 px-6 text-center font-bold border-l border-slate-100',
                                isEnterpriseSpecial
                                  ? 'text-[#FF6B35] bg-[#FFF7F4]/30'
                                  : 'text-slate-900 bg-slate-50/30'
                              )}
                            >
                              {row.enterprise}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Callout Banner */}
            <div className="p-6 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF6B35] shrink-0" />
                <span>
                  Need custom POS hardware integration, multi-brand franchise support, or bespoke ERP webhooks?
                </span>
              </div>
              <Link
                href="/contact"
                className="font-bold text-[#FF6B35] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Speak with an Enterprise Architect &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
