'use client';

import React from 'react';
import Link from 'next/link';
import { FOOTER_NAV } from '../constants/navigation';
import { SITE_CONFIG } from '../constants/site';
import {
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Github,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#111827] text-white border-t border-slate-800">
      {/* Top Newsletter & Hook Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 border-b border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
              Join 2,400+ restaurants growing with Craviti
            </h3>
            <p className="text-sm text-slate-400 max-w-xl">
              Receive actionable restaurant margin optimization strategies, kitchen operational guides, and quarterly menu engineering playbooks directly in your inbox.
            </p>
          </div>

          <div className="lg:col-span-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Thank you for subscribing to the Craviti Hospitality Insider!');
              }}
              className="flex flex-col sm:flex-row gap-2.5"
            >
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="Enter your restaurant email..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#FF6B35] transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-[#FF6B35] hover:bg-[#E85A26] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-soft"
              >
                <span>Subscribe</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
            <span className="text-[11px] text-slate-500 mt-2 block">
              No spam ever. Unsubscribe at any time with one click.
            </span>
          </div>
        </div>
      </div>

      {/* Main 5-Column Navigation Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FF8A60] flex items-center justify-center text-white shadow-soft">
                <span className="font-extrabold text-xl font-display">C</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold text-white tracking-tight font-display">
                  CRAVITI
                </span>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold -mt-1">
                  Restaurant OS
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The complete cloud operating system for modern hospitality. Contactless QR dining, real-time Kitchen Display Systems, unified Razorpay settlements, and enterprise restaurant analytics.
            </p>

            <div className="text-xs text-slate-400 space-y-1 pt-1">
              <p><span className="text-slate-300 font-semibold">Email:</span> <a href="mailto:contactcraviti@gmail.com" className="hover:text-white transition-colors">contactcraviti@gmail.com</a></p>
              <p><span className="text-slate-300 font-semibold">Phone:</span> <a href="tel:9954060000" className="hover:text-white transition-colors">9954060000</a></p>
              <p><span className="text-slate-300 font-semibold">Location:</span> Dibrugarh, Assam</p>
            </div>

            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <a
                href={SITE_CONFIG.socials.twitter}
                target="_blank"
                rel="noreferrer"
                aria-label="Craviti Twitter"
                className="p-2 rounded-lg bg-slate-800 hover:bg-[#FF6B35] hover:text-white transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={SITE_CONFIG.socials.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="Craviti LinkedIn"
                className="p-2 rounded-lg bg-slate-800 hover:bg-[#FF6B35] hover:text-white transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={SITE_CONFIG.socials.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Craviti Instagram"
                className="p-2 rounded-lg bg-slate-800 hover:bg-[#FF6B35] hover:text-white transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={SITE_CONFIG.socials.youtube}
                target="_blank"
                rel="noreferrer"
                aria-label="Craviti YouTube"
                className="p-2 rounded-lg bg-slate-800 hover:bg-[#FF6B35] hover:text-white transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href={SITE_CONFIG.socials.github}
                target="_blank"
                rel="noreferrer"
                aria-label="Craviti GitHub"
                className="p-2 rounded-lg bg-slate-800 hover:bg-[#FF6B35] hover:text-white transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational (99.99%)</span>
            </div>
          </div>

          {/* Product Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Product</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {FOOTER_NAV.product.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-[#FF6B35] transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded-md bg-[#FF6B35]/20 text-[#FF6B35] text-[9px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Company</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {FOOTER_NAV.company.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-[#FF6B35] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Resources</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {FOOTER_NAV.resources.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-[#FF6B35] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Legal & Terms</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {FOOTER_NAV.legal.slice(0, 7).map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-[#FF6B35] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/privacy-policy" className="text-[#FF6B35] hover:underline font-bold">
                  View All Legal Docs &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          &copy; {new Date().getFullYear()} {SITE_CONFIG.legalName}. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <span>Version 2.4.0 (Production Core)</span>
          <span>ISO 27001 & SOC-2 Ready</span>
          <Link href="/privacy-policy" className="hover:text-slate-400">
            Privacy
          </Link>
          <Link href="/terms-and-conditions" className="hover:text-slate-400">
            Terms
          </Link>
          <Link href="/security" className="hover:text-slate-400">
            Security
          </Link>
        </div>
      </div>
    </footer>
  );
};
