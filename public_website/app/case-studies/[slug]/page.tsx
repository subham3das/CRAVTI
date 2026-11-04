import { notFound } from 'next/navigation';
import Link from 'next/link';
import { constructMetadata } from '../../../lib/seo';
import { CASE_STUDIES } from '../../../constants/caseStudies';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { CTABanner } from '../../../sections/CTABanner';
import {
  ArrowLeft,
  CheckCircle,
  MapPin,
  Quote,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CASE_STUDIES.map((study) => ({
    slug: study.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const study = CASE_STUDIES.find((s) => s.slug === slug);
  if (!study) return {};

  return constructMetadata({
    title: `${study.restaurantName} Case Study`,
    description: study.tagline,
    path: `/case-studies/${study.slug}`,
  });
}

export default async function CaseStudyDetailPage({ params }: Props) {
  const { slug } = await params;
  const study = CASE_STUDIES.find((s) => s.slug === slug);

  if (!study) {
    notFound();
  }

  return (
    <div className="pt-28 pb-16 bg-slate-50/50 min-h-screen">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-[#FF6B35]">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href="/case-studies" className="hover:text-[#FF6B35]">
            Case Studies
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-bold">{study.restaurantName}</span>
        </div>
      </div>

      {/* Main Container */}
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Block */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-soft space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF7F4] text-[#FF6B35] border border-[#FFD5C5]">
              {study.cuisine}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{study.location} • {study.tables} Tables</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#111827] tracking-tight font-display leading-[1.15]">
            {study.tagline}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {study.summary}
          </p>

          {/* Results Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
            {study.results.map((r, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#FF6B35] font-display">
                  {r.stat}
                </p>
                <p className="text-[11px] text-slate-500 font-bold uppercase">{r.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Photo Container */}
        <div className="rounded-3xl overflow-hidden shadow-soft border border-slate-200 aspect-video relative">
          <img
            src={study.heroImage}
            alt={study.restaurantName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Narrative Deep Dive */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-soft space-y-10">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              The Operational Challenges
            </h2>
            <ul className="space-y-3">
              {study.challenges.map((c, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ✕
                  </span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              The Craviti Solution Implemented
            </h2>
            <ul className="space-y-3">
              {study.solutions.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Testimonial Callout Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#FFF7F4] to-white border border-[#FFD5C5] space-y-4">
            <Quote className="w-8 h-8 text-[#FF6B35]/30" />
            <p className="text-sm sm:text-base text-slate-800 italic leading-relaxed font-medium">
              &ldquo;{study.testimonialQuote}&rdquo;
            </p>
            <div className="pt-2 text-xs font-bold text-slate-900">
              — {study.author}, {study.restaurantName}
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#FF6B35] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Case Studies</span>
          </Link>

          <Button href="/join" size="sm" variant="primary">
            Start Your Free Trial
          </Button>
        </div>
      </article>

      <div className="mt-16">
        <CTABanner />
      </div>
    </div>
  );
}

