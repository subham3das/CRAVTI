import { constructMetadata } from '../../lib/seo';
import { PricingSection } from '../../sections/PricingSection';
import { SectionHeader } from '../../components/SectionHeader';
import { PRICING_FAQ } from '../../constants/pricing';
import { CTABanner } from '../../sections/CTABanner';
import { HelpCircle } from 'lucide-react';

export const metadata = constructMetadata({
  title: 'Pricing & Plans',
  description:
    'Simple, transparent restaurant software pricing. Craviti Standard (Launch offer: ₹699/mo, regular ₹1,500/mo) and Enterprise custom plans with zero setup fees and zero hidden commissions.',
  path: '/pricing',
});

export default function PricingPage() {
  return (
    <div className="pt-28 pb-12">
      {/* Pricing Cards & Professional Feature Comparison Matrix */}
      <PricingSection isFullPage />

      {/* Pricing FAQ */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <SectionHeader
            badge="Common Questions"
            title="Pricing FAQ"
            subtitle="Straight answers on billing, trials, custom integrations, and contracts."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRICING_FAQ.map((faq, idx) => (
              <div key={idx} className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-[#FF6B35] shrink-0 mt-0.5" />
                  <span>{faq.question}</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </div>
  );
}
