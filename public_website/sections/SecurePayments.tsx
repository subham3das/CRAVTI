import React from 'react';
import Link from 'next/link';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import {
  ShieldCheck,
  Building2,
  CreditCard,
  ArrowRight,
  ArrowDown,
  Lock,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Wallet,
  Landmark,
  FileCheck,
  Zap,
} from 'lucide-react';

const SUPPORTED_METHODS = [
  { name: 'UPI (GPay, PhonePe, Paytm, BHIM)', icon: Smartphone },
  { name: 'Credit Cards (Visa, Mastercard, RuPay)', icon: CreditCard },
  { name: 'Debit Cards (All Indian Banks)', icon: CreditCard },
  { name: 'Net Banking (50+ Major Banks)', icon: Landmark },
  { name: 'Digital Wallets & Prepaid Instruments', icon: Wallet },
];

const NEVER_STORED = [
  'Full Card Numbers (PAN)',
  'Card CVV / CVC Details',
  'UPI PIN Numbers',
  'Internet Banking Passwords',
  'One-Time Passwords (OTPs)',
  'Bank Login Credentials',
];

const FLOW_STEPS = [
  { step: '1', title: 'Customer', desc: 'Scans QR & pays on mobile' },
  { step: '2', title: 'Razorpay Payment Gateway', desc: 'Secure authorization' },
  { step: '3', title: 'Payment Verification', desc: 'Cryptographic signature match' },
  { step: '4', title: 'Restaurant Receives Order Instantly', desc: 'KDS & tablet chime live' },
  { step: '5', title: 'Payment Captured', desc: 'Captured via Razorpay gateway' },
  { step: '6', title: 'Settlement Initiated by Razorpay', desc: 'Automated batch settlement' },
  { step: '7', title: 'Merchant Bank Account', desc: 'Direct credit to restaurant' },
];

export const SecurePayments = () => {
  return (
    <section className="py-24 bg-slate-50/70 relative border-t border-b border-slate-200/70" id="payments-settlement">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <SectionHeader
          badge="Payment & Settlement Infrastructure"
          title="Secure Payments &"
          titleHighlight="Merchant Settlements"
          subtitle="Transparent, bank-grade payment processing for dining guests and reliable, automated bank settlements for restaurant owners — powered by Razorpay."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Secure Payments Powered by Razorpay */}
          <Card
            hoverEffect
            className="flex flex-col justify-between p-7 sm:p-9 bg-white border border-slate-200/90 shadow-soft rounded-3xl"
          >
            <div className="space-y-6">
              {/* Header with Icons & Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center shadow-2xs">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF6B35]">
                      Payment Gateway Integration
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight font-display">
                      Secure Payments Powered by Razorpay
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  Bank-Grade Security
                </span>
              </div>

              {/* Main Description */}
              <p className="text-sm text-slate-600 leading-relaxed">
                Craviti securely processes customer payments using <strong className="text-slate-900 font-semibold">Razorpay</strong>, one of India&apos;s trusted payment gateways. Diners enjoy lightning-fast, contactless checkout directly at their dining tables without downloading third-party applications.
              </p>

              {/* Supported Payment Methods */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-[#FF6B35]" />
                  <span>Supported Payment Methods</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUPPORTED_METHODS.map((method) => {
                    const MethodIcon = method.icon;
                    return (
                      <div
                        key={method.name}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700"
                      >
                        <MethodIcon className="w-3.5 h-3.5 text-[#FF6B35] shrink-0" />
                        <span className="truncate">{method.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Zero Credential Storage Guarantee Box */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Zero Sensitive Credential Storage Policy</span>
                </div>
                <p className="text-xs text-amber-950/80 leading-relaxed font-medium">
                  Craviti acts solely as the ordering facilitation layer. <strong>Craviti never stores:</strong>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {NEVER_STORED.map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-xs text-amber-900/90 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed pt-1 border-t border-amber-200/60">
                  All financial transactions and credentials are processed end-to-end by Razorpay using industry-standard security practices and PCI-DSS compliance under RBI regulations.
                </p>
              </div>
            </div>

            {/* Bottom Link to Policy */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Have questions about payment handling?</span>
              <Link
                href="/payment-policy"
                className="font-bold text-[#FF6B35] hover:text-[#e0531f] inline-flex items-center gap-1 transition-colors"
              >
                <span>Read Payment Policy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Card 2: Merchant Settlement Process */}
          <Card
            hoverEffect
            className="flex flex-col justify-between p-7 sm:p-9 bg-white border border-slate-200/90 shadow-soft rounded-3xl"
          >
            <div className="space-y-6">
              {/* Header with Icons & Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
                      Merchant Banking Flow
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight font-display">
                      Merchant Settlement Process
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  <Zap className="w-3 h-3 text-blue-600" />
                  Automated Payouts
                </span>
              </div>

              {/* Step-by-Step Flow Illustration */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  After a successful customer payment:
                </div>

                <div className="space-y-1.5">
                  {FLOW_STEPS.map((s, idx) => (
                    <div key={s.step}>
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/60">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {s.step}
                        </span>
                        <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">{s.title}</span>
                          <span className="text-[11px] text-slate-500 hidden sm:inline truncate">{s.desc}</span>
                        </div>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      </div>
                      {idx < FLOW_STEPS.length - 1 && (
                        <div className="flex justify-center my-0.5">
                          <ArrowDown className="w-3 h-3 text-slate-300" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Settlement Timelines & Compliance Notice */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                  <Landmark className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Settlement Timelines & Banking Guidelines</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Settlement timelines are managed by <strong>Razorpay</strong>. For most domestic merchants, the standard settlement schedule is generally <strong>T+2 working days</strong> after successful payment capture.
                </p>
                <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
                  <p className="font-bold text-slate-800">Actual settlement timing may vary depending on:</p>
                  <ul className="space-y-1 pl-4 list-disc marker:text-[#FF6B35]">
                    <li>Merchant verification & KYC documentation status</li>
                    <li>Banking holidays, weekend clearing cycles, and bank operating hours</li>
                    <li>Reserve Bank of India (RBI) settlement regulations and compliance guidelines</li>
                    <li>Periodic risk checks and compliance reviews</li>
                    <li>Razorpay applicable merchant settlement schedule and policies</li>
                  </ul>
                </div>
                <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/80">
                  * Craviti facilitates order management and payment orchestration. Craviti does not hold merchant funds or promise hardcoded payout hours.
                </p>
              </div>
            </div>

            {/* Bottom Link to Merchant Terms */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Onboarding a new restaurant?</span>
              <Link
                href="/merchant-terms"
                className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
              >
                <span>View Merchant Terms</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

