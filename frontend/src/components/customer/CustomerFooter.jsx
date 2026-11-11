import React from 'react';
import logoSvg from '../../assets/logo.svg';
import env from '../../config/env';

export const CustomerFooter = ({ compact = false, className = '' }) => {
  // Construct website base URL from environment variable with live public website fallback
  const rawBaseUrl =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_WEBSITE_URL) ||
    env?.WEBSITE_URL ||
    env?.PUBLIC_WEBSITE_URL ||
    import.meta.env?.VITE_PUBLIC_WEBSITE_URL ||
    'https://cravti-rsvm.vercel.app';

  const baseUrl = String(rawBaseUrl).replace(/\/+$/, '');

  const legalLinks = [
    { label: 'Privacy Policy', href: `${baseUrl}/privacy-policy` },
    { label: 'Terms', href: `${baseUrl}/terms-and-conditions` },
    { label: 'Payment Policy', href: `${baseUrl}/payment-policy` },
    { label: 'Refund Policy', href: `${baseUrl}/refund-policy` },
    { label: 'Merchant Terms', href: `${baseUrl}/merchant-terms` },
    { label: 'Contact', href: `${baseUrl}/contact` },
    { label: 'Support', href: `${baseUrl}/help` },
  ];

  if (compact) {
    return (
      <footer
        className={`pt-3 pb-2 text-center text-slate-400 text-[10px] space-y-1.5 ${className}`}
        role="contentinfo"
        aria-label="Craviti Customer Ordering Footer"
      >
        <div className="flex items-center justify-center gap-1.5 text-slate-600 font-semibold text-[11px]">
          <img src={logoSvg} alt="Craviti" className="w-3.5 h-3.5 shrink-0" />
          <span>
            Powered by <span className="text-[#16A34A] font-bold">Craviti</span>
          </span>
        </div>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-medium text-[10px]"
          aria-label="Legal Documents"
        >
          {legalLinks.map((link, idx) => (
            <React.Fragment key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-[#16A34A] transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
              {idx < legalLinks.length - 1 && (
                <span className="text-slate-300 select-none">•</span>
              )}
            </React.Fragment>
          ))}
        </nav>
        <p className="text-[9px] text-slate-400">
          &copy; {new Date().getFullYear()} Craviti. All Rights Reserved.
        </p>
      </footer>
    );
  }

  return (
    <footer
      className={`border-t border-slate-200/80 bg-gradient-to-b from-transparent to-slate-100/60 pt-8 pb-10 px-4 text-center transition-colors ${className}`}
      role="contentinfo"
      aria-label="Craviti Customer Ordering Footer"
    >
      <div className="max-w-md mx-auto flex flex-col items-center space-y-3.5">
        {/* Brand Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs">
          <img src={logoSvg} alt="Craviti Logo" className="w-4 h-4 shrink-0" />
          <span className="font-black text-xs text-slate-800 tracking-wider font-display">
            CRAVITI
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-[11px] font-semibold text-slate-500">
            Powered by <span className="text-[#16A34A] font-bold">Craviti</span>
          </span>
        </div>

        {/* Brand Slogan */}
        <p className="text-xs text-slate-500 font-medium">
          Making Restaurant Ordering Simple.
        </p>

        {/* Legal Links with Clean Dot Dividers */}
        <nav
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs font-medium pt-1 px-4 max-w-lg mx-auto"
          aria-label="Legal Documents"
        >
          {legalLinks.map((link, idx) => (
            <React.Fragment key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-[#16A34A] hover:underline underline-offset-2 transition-colors py-0.5 whitespace-nowrap focus:outline-hidden focus:ring-2 focus:ring-[#16A34A]/40 rounded-sm"
              >
                {link.label}
              </a>
              {idx < legalLinks.length - 1 && (
                <span className="text-slate-300 select-none hidden xs:inline sm:inline">•</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Security & Copyright Bar */}
        <div className="pt-3 border-t border-slate-200/70 w-full flex flex-col items-center gap-1 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <svg
              className="w-3 h-3 text-[#16A34A]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>256-bit Encrypted Contactless Session</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Craviti. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default CustomerFooter;


