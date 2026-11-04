import React from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  XCircle,
  CheckCircle,
  Clock,
  Printer,
  CreditCard,
  AlertTriangle,
  QrCode,
  ChefHat,
  Receipt,
  TrendingUp,
} from 'lucide-react';

export const ProblemSolution = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <SectionHeader
          badge="Why Restaurants Switch"
          title="The Old Restaurant Nightmare"
          titleHighlight="vs. The Craviti Way"
          subtitle="Legacy paper ordering slows down table turns, creates kitchen chaos, and leaks margins. Here is how modern hospitality transforms operations."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Problem Card (The Old Way) */}
          <div className="bg-gradient-to-b from-rose-50/50 to-white rounded-3xl p-6 sm:p-10 border border-rose-200/80 shadow-soft space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-rose-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">The Legacy Restaurant Way</h3>
                  <p className="text-xs text-rose-600 font-semibold">Slow, Error-Prone & Costly</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                -28% Lost Capacity
              </span>
            </div>

            <div className="space-y-5">
              {[
                {
                  title: '15-Minute Menu & Waiter Waiting Bottleneck',
                  desc: 'Guests sit down and wave their arms fruitlessly trying to get a paper menu and place an initial drink order during busy rushes.',
                  icon: Clock,
                },
                {
                  title: 'Thermal Printers Jamming & Misplaced KOTs',
                  desc: 'Kitchen paper rolls get soaked, smeared with grease, or lost, resulting in forgotten tables and furious 1-star reviews.',
                  icon: Printer,
                },
                {
                  title: 'Custom Dietary & Spice Notes Ignored',
                  desc: 'Servers handwriting notes on small slips leads to misheard spice preferences, allergy mishaps, and expensive comped meals.',
                  icon: AlertTriangle,
                },
                {
                  title: '20-Minute Bill Waiting Game at Table',
                  desc: 'Guests ready to leave must wait for bill printing, card machine hunting, and manual signature slips, clogging valuable table space.',
                  icon: CreditCard,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Solution Card (The Craviti Way) */}
          <div className="bg-gradient-to-b from-[#FFF7F4] to-white rounded-3xl p-6 sm:p-10 border border-[#FFD5C5] shadow-soft space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#FFD5C5]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B35] text-white flex items-center justify-center font-bold shadow-soft">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">The Craviti Operating System</h3>
                  <p className="text-xs text-[#FF6B35] font-semibold">Fast, Synchronized & Profitable</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF6B35]/15 text-[#FF6B35]">
                +38% Table Turns
              </span>
            </div>

            <div className="space-y-5">
              {[
                {
                  title: 'Instant Table QR Scan in 3 Seconds',
                  desc: 'Guests scan the table QR stand with zero app downloads. High-res photo menus with allergen tags load instantaneously.',
                  icon: QrCode,
                },
                {
                  title: 'Real-Time KDS Displays with Chime Alerts',
                  desc: 'Tickets broadcast to kitchen stations via WebSockets in milliseconds. Color-coded timer stages and clear modifier cards.',
                  icon: ChefHat,
                },
                {
                  title: 'Intelligent Modifiers & Automatic Upselling',
                  desc: 'Prompt diners for double toppings, drink pairings, and spice levels, generating ₹140 higher average order values effortlessly.',
                  icon: TrendingUp,
                },
                {
                  title: 'Instant Online Checkout & PDF Invoices',
                  desc: 'Diners pay on their phone via Razorpay (UPI, GPay, Cards) or choose Cash on Counter. Instant digital receipts & automated settlements.',
                  icon: Receipt,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

