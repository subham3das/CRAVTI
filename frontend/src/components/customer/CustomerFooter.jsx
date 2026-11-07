import React from 'react';
import logoSvg from '../../assets/logo.svg';
import env from '../../config/env';

export const CustomerFooter = ({ compact = false, className = '' }) => {
  // Construct website base URL from environment variable (Never hardcoded)
  const rawBaseUrl =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_WEBSITE_URL) ||
    env?.WEBSITE_URL ||
    env?.PUBLIC_WEBSITE_URL ||
    import.meta.env?.VITE_PUBLIC_WEBSITE_URL ||
    'https://craviti.com';

  const baseUrl = String(rawBaseUrl).replace(/\/+$/, '');

  const legalLinks = [
    { label: 'Privacy Policy', href: `${baseUrl}/privacy-policy` },
    { label: 'Terms & Conditions', href: `${baseUrl}/terms-and-conditions` },
    { label: 'Refund Policy', href: `${baseUrl}/refund-policy` },
    { label: 'Shipping Policy', href: `${baseUrl}/shipping-policy` },
    { label: 'Cookie Policy', href: `${baseUrl}/cookie-policy` },
    { label: 'Disclaimer', href: `${baseUrl}/disclaimer` },
    { label: 'Contact', href: `${baseUrl}/contact` },
  ];

  return (
    <footer
      className={`border-t border-slate-200/80 bg-slate-50/70 text-slate-500 transition-colors ${
        compact ? 'py-4 px-3 mt-4 rounded-2xl' : 'py-8 px-4 sm:px-6 mt-12'
      } ${className}`}
      role="contentinfo"
      aria-label="Craviti Customer Ordering Footer"
    >
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-center md:text-left">
        {/* Brand & Identity Block */}
        <div className="space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <img src={logoSvg} alt="Craviti Logo" className="w-5 h-5 shrink-0" />
            <span className="font-black text-sm text-slate-800 tracking-tight font-display">
              CRAVITI
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-600">
            Powered by <span className="text-[#16A34A] font-bold">Craviti</span>
          </p>

          <p className="text-[11px] text-slate-400 font-medium">
            Making Restaurant Ordering Simple.
          </p>

          <p className="text-[10px] text-slate-400 pt-0.5">
            &copy; {new Date().getFullYear()} Craviti. All Rights Reserved.
          </p>
        </div>

        {/* Legal Links List */}
        <nav
          className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-2 text-xs font-medium"
          aria-label="Legal Documents"
        >
          {legalLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-[#16A34A] transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#16A34A]/40 rounded-sm py-0.5"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
};

export default CustomerFooter;
