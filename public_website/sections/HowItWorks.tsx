import React from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { Button } from '../components/Button';
import {
  UploadCloud,
  QrCode,
  Smartphone,
  Banknote,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Import Menu & Floor Plan',
    subtitle: 'Live in under 2 hours',
    desc: 'Upload your existing menu PDF or spreadsheet. Our automated parser extracts categories, pricing, photos, and allergen tags. Configure tables and dining areas with one click.',
    icon: UploadCloud,
    highlight: 'Concierge Menu Import Free',
  },
  {
    step: '02',
    title: 'Deploy Custom QR Stands',
    subtitle: 'Zero hardware to purchase',
    desc: 'Generate high-resolution printable QR table placards branded with your restaurant logo. Place them across indoor booths, outdoor patio tables, and bar counters.',
    icon: QrCode,
    highlight: 'Dynamic Per-Table QR',
  },
  {
    step: '03',
    title: 'Guests Scan, Order & Pay',
    subtitle: 'Instant browser ordering',
    desc: 'Diners scan with their camera. The digital menu opens in Safari or Chrome. Orders beam instantaneously to kitchen KDS screens accompanied by acoustic chime alerts.',
    icon: Smartphone,
    highlight: 'Zero App Downloads',
  },
  {
    step: '04',
    title: 'Direct T+1 Bank Payouts',
    subtitle: 'Automated reconciliation',
    desc: 'Online guest payments via Razorpay (UPI, GPay, Cards) settle directly into your verified bank account with automated GST invoicing and tamper-proof PDF receipts.',
    icon: Banknote,
    highlight: '100% Direct Payouts',
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <SectionHeader
          badge="Seamless Onboarding"
          title="From Sign-Up to First Order"
          titleHighlight="In Under 2 Hours"
          subtitle="No complex IT installations, proprietary point-of-sale terminals, or multi-week delays. Start serving digital tables today."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative bg-slate-50/70 rounded-3xl p-7 border border-slate-200/80 hover:border-[#FF6B35]/40 hover:bg-white hover:shadow-soft transition-all duration-300 flex flex-col justify-between space-y-6"
              >
                {/* Step Pill & Step Number */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-3xl font-extrabold text-[#FF6B35]/30">
                      {s.step}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7F4] text-[#FF6B35] border border-[#FFD5C5]">
                      {s.highlight}
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center shadow-2xs">
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-[#111827] tracking-tight">{s.title}</h3>
                    <p className="text-xs font-semibold text-[#FF6B35]">{s.subtitle}</p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{s.desc}</p>
                </div>

                <div className="pt-4 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified step in Craviti workflow</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="bg-[#111827] rounded-3xl p-8 sm:p-10 text-white shadow-soft flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xl font-bold font-display">Ready to see Craviti live in action?</h4>
            <p className="text-xs text-slate-400">
              Join 2,400+ restaurants cutting turnaround times and growing profits.
            </p>
          </div>
          <Button href="/join" size="md" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Start Free 14-Day Trial
          </Button>
        </div>
      </div>
    </section>
  );
};

