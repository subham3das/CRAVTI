import React from 'react';
import Link from 'next/link';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { CORE_FEATURES } from '../constants/features';
import {
  QrCode,
  ChefHat,
  CreditCard,
  LayoutGrid,
  TrendingUp,
  ShieldCheck,
  Check,
  ArrowRight,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  QrCode,
  ChefHat,
  CreditCard,
  LayoutGrid,
  TrendingUp,
  ShieldCheck,
};

export const FeatureGrid = () => {
  return (
    <section className="py-24 bg-slate-50/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <SectionHeader
          badge="End-to-End Capabilities"
          title="Everything You Need to Run"
          titleHighlight="A Modern Restaurant"
          subtitle="From table QR scans to kitchen prep timers, automated bank settlements, and multi-branch admin control. Built natively for speed."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CORE_FEATURES.map((feature) => {
            const Icon = ICON_MAP[feature.iconName] || QrCode;
            return (
              <Card
                key={feature.id}
                hoverEffect
                className="flex flex-col justify-between p-8 bg-white"
              >
                <div className="space-y-5">
                  {/* Top Icon & Metric Pill */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center shadow-soft">
                      <Icon className="w-6 h-6" />
                    </div>
                    {feature.metrics && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF7F4] text-[#FF6B35] border border-[#FFD5C5]">
                        {feature.metrics.value} {feature.metrics.label}
                      </span>
                    )}
                  </div>

                  {/* Title & Tagline */}
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-[#111827] tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#FF6B35]">{feature.tagline}</p>
                  </div>

                  {/* Body description */}
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {feature.description}
                  </p>

                  {/* Bullet points */}
                  <ul className="space-y-2 pt-2 border-t border-slate-100">
                    {feature.bulletPoints.map((bp, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom link */}
                <div className="pt-6 mt-6 border-t border-slate-100">
                  <Link
                    href={`/features#${feature.id}`}
                    className="text-xs font-bold text-[#FF6B35] hover:text-[#E85A26] flex items-center gap-1.5 group"
                  >
                    <span>Learn more about {feature.title.split(' ')[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

