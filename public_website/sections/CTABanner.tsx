import React from 'react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  PhoneCall,
} from 'lucide-react';

export const CTABanner = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-[#FFF7F4] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#111827] via-slate-900 to-[#1F2937] p-8 sm:p-14 lg:p-16 text-white shadow-2xl border border-slate-800 overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6B35]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex">
              <Badge variant="primary" size="md">
                Fast & Frictionless Setup
              </Badge>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display leading-[1.15]">
              Ready to Accelerate Table Turns and{' '}
              <span className="text-[#FF6B35]">Multiply Restaurant Margins</span>?
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl">
              Launch your digital contactless QR dining, real-time Kitchen Display screens, and automated T+1 Razorpay bank settlements in under two hours.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Button
                href="/join"
                size="lg"
                variant="primary"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="text-base shadow-glow"
              >
                Join Craviti as Restaurant
              </Button>
              <Button
                href="/contact"
                size="lg"
                variant="outline"
                className="text-base text-slate-900 border-white hover:bg-slate-100"
              >
                Schedule Live Demo
              </Button>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>14-day full feature trial</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>No credit card required</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Free menu concierge import</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

