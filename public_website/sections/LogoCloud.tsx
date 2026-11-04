import React from 'react';
import { RESTAURANT_LOGOS } from '../constants/testimonials';
import { UtensilsCrossed, ShieldCheck } from 'lucide-react';

export const LogoCloud = () => {
  return (
    <div className="py-12 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-1 mb-8">
          <p className="text-xs uppercase tracking-widest font-extrabold text-slate-400">
            Trusted by 2,400+ Premier Hospitality Establishments Nationwide
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center">
          {RESTAURANT_LOGOS.map((rest) => (
            <div
              key={rest.name}
              className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:border-[#FF6B35]/30 hover:bg-white hover:shadow-2xs transition-all text-center space-y-1 group"
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 group-hover:text-[#FF6B35] group-hover:border-[#FFD5C5] mx-auto flex items-center justify-center transition-colors">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 truncate" title={rest.name}>
                {rest.name}
              </h4>
              <p className="text-[10px] text-slate-400">
                {rest.city} • {rest.tables}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

