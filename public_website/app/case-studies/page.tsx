import Link from 'next/link';
import { constructMetadata } from '../../lib/seo';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CASE_STUDIES } from '../../constants/caseStudies';
import { CTABanner } from '../../sections/CTABanner';
import { ArrowRight, TrendingUp, CheckCircle, Quote, MapPin } from 'lucide-react';

export const metadata = constructMetadata({
  title: 'Case Studies — Restaurant Success Stories',
  description:
    'Discover how high-volume dining establishments, cafes, and multi-branch chains use Craviti to slash ticket turnaround times, eliminate kitchen mistakes, and increase average check sizes.',
  path: '/case-studies',
});

export default function CaseStudiesPage() {
  return (
    <div className="pt-28 pb-16">
      {/* Hero Header */}
      <section className="py-20 bg-gradient-to-b from-[#FFF7F4] to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="primary" size="md">
            Customer Case Studies
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#111827] tracking-tight font-display max-w-4xl mx-auto">
            Real Restaurants, Real Kitchens,{' '}
            <span className="text-[#FF6B35]">Measured Results</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            See how forward-thinking hospitality leaders transformed their dining room operations with Craviti.
          </p>
        </div>
      </section>

      {/* Case Studies List */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {CASE_STUDIES.map((study, idx) => (
            <Card
              key={study.slug}
              className="p-8 sm:p-12 bg-white border border-slate-200/80 shadow-soft hover:shadow-elevated transition-all space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Text */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7F4] text-[#FF6B35] border border-[#FFD5C5]">
                      {study.cuisine}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{study.location} • {study.tables} Tables</span>
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-display leading-tight">
                    {study.restaurantName}: {study.tagline}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {study.summary}
                  </p>

                  {/* Results row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                    {study.results.map((r, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                        <p className="text-lg sm:text-xl font-extrabold text-[#FF6B35] font-display">
                          {r.stat}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 truncate">
                          {r.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Button href={`/case-studies/${study.slug}`} size="sm" variant="primary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Read Full Case Study
                    </Button>
                  </div>
                </div>

                {/* Right Image Container */}
                <div className="lg:col-span-5">
                  <div className="rounded-2xl overflow-hidden shadow-soft border border-slate-200 aspect-video lg:aspect-4/3 relative">
                    <img
                      src={study.heroImage}
                      alt={study.restaurantName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <CTABanner />
    </div>
  );
}

