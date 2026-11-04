import { constructMetadata } from '../../lib/seo';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CORE_FEATURES } from '../../constants/features';
import { CTABanner } from '../../sections/CTABanner';
import {
  QrCode,
  ChefHat,
  CreditCard,
  LayoutGrid,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

export const metadata = constructMetadata({
  title: 'Features & Capabilities',
  description:
    'Deep dive into Craviti features: contactless QR code ordering, real-time Kitchen Display System (KDS), Razorpay settlements, visual floor maps, and multi-branch admin control.',
  path: '/features',
});

const ICON_MAP: Record<string, React.ElementType> = {
  QrCode,
  ChefHat,
  CreditCard,
  LayoutGrid,
  TrendingUp,
  ShieldCheck,
};

export default function FeaturesPage() {
  return (
    <div className="pt-28 pb-12">
      {/* Hero Header */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-[#FFF7F4] to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="primary" size="md">
            Product Deep Dive
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#111827] tracking-tight font-display max-w-4xl mx-auto">
            The Complete Platform Built for{' '}
            <span className="text-[#FF6B35]">Restaurant Speed</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            Eliminate operational chaos between front-of-house servers, kitchen chefs, billing cashiers, and restaurant owners.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button href="/join" size="md" variant="primary">
              Start Free 14-Day Trial
            </Button>
            <Button href="/pricing" size="md" variant="outline">
              View Pricing & Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Deep Dive Sections */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {CORE_FEATURES.map((feature, idx) => {
            const Icon = ICON_MAP[feature.iconName] || QrCode;
            const isEven = idx % 2 === 0;

            return (
              <div
                key={feature.id}
                id={feature.id}
                className={`scroll-mt-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ${
                  !isEven ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Left Description Column */}
                <div className={`space-y-6 ${isEven ? 'lg:col-span-6' : 'lg:col-span-6 lg:order-2'}`}>
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center shadow-soft">
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight font-display">
                      {feature.title}
                    </h2>
                    <p className="text-sm font-semibold text-[#FF6B35]">{feature.tagline}</p>
                  </div>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                    {feature.description}
                  </p>

                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Key Highlights:
                    </span>
                    <ul className="space-y-2.5">
                      {feature.bulletPoints.map((bp, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {feature.metrics && (
                    <div className="inline-flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                      <span className="font-extrabold text-base text-[#FF6B35]">
                        {feature.metrics.value}
                      </span>
                      <span>{feature.metrics.label}</span>
                    </div>
                  )}
                </div>

                {/* Right Mockup Card Column */}
                <div className={`lg:col-span-6 ${isEven ? '' : 'lg:order-1'}`}>
                  <Card className="bg-gradient-to-br from-slate-900 to-[#111827] text-white p-8 border-slate-800 shadow-elevated space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Live Preview • {feature.title}
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white">Feature Performance Score</span>
                          <span className="text-emerald-400 font-bold">Optimal (99.9%)</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#FF6B35] h-full w-[94%]" />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                        <p>
                          Production-grade architecture strictly tenant-isolated with parallel aggregation queries. Zero manual data entry and zero duplicated business states.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button href="/join" size="sm" variant="primary" className="w-full">
                        Try This Feature In Free Trial
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <CTABanner />
    </div>
  );
}

