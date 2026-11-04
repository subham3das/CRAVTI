import { constructMetadata } from '../../lib/seo';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { SITE_CONFIG } from '../../constants/site';
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  FileText,
  Building,
  CreditCard,
  ChefHat,
  ShieldCheck,
  Zap,
  LogIn,
  Clock,
} from 'lucide-react';

export const metadata = constructMetadata({
  title: 'Join Craviti — Restaurant Partner Onboarding',
  description:
    'Join 2,400+ restaurants on Craviti. Frictionless contactless QR dining, real-time Kitchen Displays, direct T+1 Razorpay settlements, and zero sales commissions.',
  path: '/join',
});

const BENEFITS = [
  {
    title: '35% Faster Table Turnover',
    desc: 'Guests browse, order, and pay without waiting for busy servers. Speed up dinner rushes effortlessly.',
    icon: Zap,
  },
  {
    title: '0% Food Aggregator Commissions',
    desc: 'Keep 100% of your menu revenue. We charge a flat, predictable software subscription with zero hidden cuts.',
    icon: Sparkles,
  },
  {
    title: 'Direct T+1 Bank Payouts',
    desc: 'Online payments via Razorpay settle directly into your verified commercial bank account every morning.',
    icon: CreditCard,
  },
  {
    title: 'Zero Kitchen Order Mistakes',
    desc: 'Tickets broadcast to kitchen KDS screens via WebSockets with acoustic chime notifications and color timers.',
    icon: ChefHat,
  },
];

const REQUIREMENTS = [
  {
    title: 'Active Restaurant Business',
    desc: 'Registered cafe, quick-service counter, fine dining bistro, pub, food truck, or cloud kitchen.',
    icon: Building,
  },
  {
    title: 'FSSAI License / Registration',
    desc: 'Valid Food Safety and Standards Authority of India 14-digit registration number.',
    icon: ShieldCheck,
  },
  {
    title: 'Commercial Bank Account',
    desc: 'Active business current or savings account with canceled cheque or passbook copy for payout verification.',
    icon: CreditCard,
  },
  {
    title: 'Menu Catalog (PDF / Photos)',
    desc: 'Your current food and beverage menu items with descriptions, prices, and food categories.',
    icon: FileText,
  },
];

export default function JoinPage() {
  return (
    <div className="pt-28 pb-16 bg-slate-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-5 pt-8">
          <Badge variant="primary" size="md">
            Restaurant Partner Registration
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#111827] tracking-tight font-display">
            Start Serving Tables With{' '}
            <span className="text-[#FF6B35]">Craviti Today</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal">
            Take your dining room digital in under two hours. Free 14-day trial, concierge menu import, and zero hardware lock-in.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={`${SITE_CONFIG.appUrl}/signup`}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A26] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-glow transition-all active:scale-[0.98]"
            >
              <span>Start Restaurant Registration</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href={`${SITE_CONFIG.appUrl}/login`}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm flex items-center justify-center gap-2 shadow-2xs transition-all"
            >
              <LogIn className="w-4 h-4 text-slate-500" />
              <span>Already Registered? Sign In</span>
            </a>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> No credit card required
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Free 14-day trial
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Cancel anytime
            </span>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              Why Partner With Craviti?
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Transform front-of-house service and kitchen flow from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <Card key={i} className="p-6 bg-white space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{b.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{b.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Requirements Card Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-soft space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <Badge variant="neutral" size="sm">
              Quick Checklist
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight font-display mt-2">
              Onboarding Requirements
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Prepare these four standard business items to activate instant online payments and verified payouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {REQUIREMENTS.map((r, i) => {
              const Icon = r.icon;
              return (
                <div key={i} className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#FF6B35]" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{r.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{r.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* How Onboarding Works Timeline */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              Simple 4-Step Onboarding Process
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Average restaurant setup duration: 1 hour 45 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: 'Step 1', title: 'Register Account', desc: 'Create your owner credentials and submit restaurant details in 2 minutes.' },
              { step: 'Step 2', title: 'Upload Menu Catalog', desc: 'Our team formats your food items, photos, and allergen tags for free.' },
              { step: 'Step 3', title: 'Connect Bank & Payouts', desc: 'Submit canceled cheque for automated T+1 Razorpay bank settlement verification.' },
              { step: 'Step 4', title: 'Print Table QR Codes', desc: 'Download high-res table stands and welcome guests to contactless dining.' },
            ].map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-extrabold uppercase font-mono text-[#FF6B35]">
                  {s.step}
                </span>
                <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Card */}
        <div className="bg-[#111827] rounded-3xl p-8 sm:p-12 text-white shadow-soft flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <h3 className="text-2xl font-bold font-display">Ready to Join 2,400+ Restaurant Partners?</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Get started with our 14-day free trial. If you have any questions, our onboarding specialists are standing by.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href={`${SITE_CONFIG.appUrl}/signup`}
              className="px-6 py-3 rounded-xl bg-[#FF6B35] hover:bg-[#E85A26] text-white font-bold text-xs flex items-center gap-2 shadow-soft transition-colors"
            >
              <span>Begin Free Registration</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href={`${SITE_CONFIG.appUrl}/login`}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
            >
              <span>Sign In to Existing Store</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

