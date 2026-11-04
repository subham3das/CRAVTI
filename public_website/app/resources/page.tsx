'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CTABanner } from '../../sections/CTABanner';
import {
  Calculator,
  Download,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { formatNumber } from '../../lib/utils';

export default function ResourcesPage() {
  const [tables, setTables] = useState(25);
  const [dinersPerTable, setDinersPerTable] = useState(3);
  const [avgBill, setAvgBill] = useState(1200);

  // ROI math
  const dailyTurnovers = 2.5; // average seatings
  const speedupFactor = 0.35; // 35% faster turns
  const upsellingFactor = 0.22; // 22% higher check

  const currentMonthlyGross = tables * dailyTurnovers * avgBill * 30;
  const additionalMonthlyGross = currentMonthlyGross * (speedupFactor * 0.4 + upsellingFactor * 0.6);
  const annualGains = additionalMonthlyGross * 12;

  return (
    <div className="pt-28 pb-16 bg-slate-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-8">
          <Badge variant="primary" size="md">
            Resource Hub & Tools
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111827] tracking-tight font-display">
            Hospitality Calculators &{' '}
            <span className="text-[#FF6B35]">Growth Playbooks</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-normal">
            Free tools, financial calculators, and tactical operational guides to maximize your restaurant profitability.
          </p>
        </div>

        {/* Interactive ROI Calculator Card */}
        <div id="roi-calculator" className="scroll-mt-32 max-w-4xl mx-auto">
          <Card className="p-8 sm:p-12 bg-white border border-slate-200/80 shadow-soft space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                  Restaurant ROI & Margin Calculator
                </h2>
                <p className="text-xs text-slate-500">
                  Estimate additional monthly revenue generated with Craviti table ordering
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Slider 1: Tables */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600">Dining Tables</span>
                  <span className="text-[#FF6B35] text-sm font-extrabold">{tables}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={tables}
                  onChange={(e) => setTables(Number(e.target.value))}
                  className="w-full accent-[#FF6B35] cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">5 to 100 tables</span>
              </div>

              {/* Slider 2: Diners */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600">Diners per Table</span>
                  <span className="text-[#FF6B35] text-sm font-extrabold">{dinersPerTable}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={dinersPerTable}
                  onChange={(e) => setDinersPerTable(Number(e.target.value))}
                  className="w-full accent-[#FF6B35] cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">1 to 10 guests</span>
              </div>

              {/* Slider 3: Avg Bill */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600">Average Bill Amount</span>
                  <span className="text-[#FF6B35] text-sm font-extrabold">₹{formatNumber(avgBill)}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="5000"
                  step="100"
                  value={avgBill}
                  onChange={(e) => setAvgBill(Number(e.target.value))}
                  className="w-full accent-[#FF6B35] cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">₹200 to ₹5,000 per bill</span>
              </div>
            </div>

            {/* Calculated Output Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#111827] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-soft">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Estimated Additional Revenue
                </span>
                <p className="text-3xl sm:text-4xl font-extrabold font-display text-white">
                  +₹{formatNumber(Math.round(additionalMonthlyGross))}
                  <span className="text-xs text-slate-400 font-normal ml-1">/ month</span>
                </p>
                <p className="text-xs text-slate-400">
                  Equivalent to{' '}
                  <strong className="text-emerald-400">+₹{formatNumber(Math.round(annualGains))}</strong>{' '}
                  in annual margin expansion.
                </p>
              </div>

              <Button href="/join" size="md" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Unlock This Revenue
              </Button>
            </div>
          </Card>
        </div>

        {/* Free Playbooks Grid */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              Free Operational Playbooks & Guides
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Download tactical manuals written by culinary operations leaders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'The 2026 Contactless Dining Blueprint',
                tagline: 'Menu psychology, QR placements, and guest flow design',
                pages: '24 Pages • PDF',
                category: 'Guest Experience',
              },
              {
                title: 'Kitchen Display System (KDS) Mastery',
                tagline: 'How to eliminate paper ticket printer jams and misheard orders',
                pages: '18 Pages • PDF',
                category: 'Kitchen Flow',
              },
              {
                title: 'Mastering Restaurant Cash Flow & Bank Settlements',
                tagline: 'Navigating Razorpay T+1 payouts, GST invoicing, and chargebacks',
                pages: '22 Pages • PDF',
                category: 'Finance & Tax',
              },
            ].map((book, i) => (
              <Card key={i} className="p-6 bg-white space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7F4] text-[#FF6B35]">
                      {book.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{book.pages}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{book.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{book.tagline}</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => alert(`Downloading "${book.title}"... Free copy sent to your email!`)}
                    className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#FF6B35]" />
                    <span>Download Free Guide</span>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <CTABanner />
      </div>
    </div>
  );
}

