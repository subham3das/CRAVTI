'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { SITE_CONFIG } from '../../constants/site';
import {
  Search,
  BookOpen,
  QrCode,
  ChefHat,
  CreditCard,
  Users,
  AlertTriangle,
  HelpCircle,
  Phone,
  Mail,
  ArrowRight,
} from 'lucide-react';

const HELP_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    desc: 'Setting up your restaurant account, importing your first menu, and configuring operating hours.',
    icon: BookOpen,
    articles: [
      'How to import menu items via bulk spreadsheet',
      'Configuring opening and closing business hours',
      'Uploading high-resolution logo and restaurant banner',
    ],
  },
  {
    id: 'qr-tables',
    title: 'Tables & QR Placards',
    desc: 'Assigning tables, generating printable QR stands, and managing dynamic table states.',
    icon: QrCode,
    articles: [
      'How to print high-resolution acrylic QR stands',
      'Locking tables when bills are settled',
      'Managing indoor booths vs outdoor patio sections',
    ],
  },
  {
    id: 'kds',
    title: 'Kitchen Display & Chimes',
    desc: 'Real-time WebSocket orders, synthesized chime frequencies, and volume configuration.',
    icon: ChefHat,
    articles: [
      'Configuring kitchen acoustic chime volume (0–100%)',
      'Routing drinks to bar and hot dishes to tandoor station',
      'Color-coded prep time timers and cooking stages',
    ],
  },
  {
    id: 'billing',
    title: 'Payments & Bank Settlements',
    desc: 'Razorpay payment gateway setup, test mode connection, and T+1 bank payouts.',
    icon: CreditCard,
    articles: [
      'Submitting canceled cheque for bank payout verification',
      'Testing Razorpay payment gateway in Test Mode',
      'Generating deterministic GST tax invoices and PDF receipts',
    ],
  },
  {
    id: 'staff-rbac',
    title: 'Staff Roles & Security',
    desc: 'Role-based access control, managing waiters, cashiers, and kitchen chefs.',
    icon: Users,
    articles: [
      'Creating waiter and cashier login pins',
      'Restricting refund permissions to General Managers',
      'Reviewing immutable staff audit timeline logs',
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting & Offline',
    desc: 'Network disconnect fallbacks, cash on counter overrides, and audio troubleshooting.',
    icon: AlertTriangle,
    articles: [
      'What to do if Wi-Fi drops during a dinner rush',
      'Diner marked paid but funds pending in gateway',
      'Audio chime not playing in mobile Safari browser',
    ],
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState('');

  const filteredCategories = HELP_CATEGORIES.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.desc.toLowerCase().includes(search.toLowerCase()) ||
      c.articles.some((a) => a.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="pt-28 pb-16 bg-slate-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Search Block */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-8">
          <Badge variant="primary" size="md">
            Craviti Knowledge Base
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111827] tracking-tight font-display">
            How Can We Help You Today?
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-normal">
            Search step-by-step documentation, tutorial guides, and troubleshooting walkthroughs.
          </p>

          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic, e.g., 'QR code', 'KDS chimes', 'Razorpay settlement'..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 shadow-soft focus:outline-hidden focus:border-[#FF6B35]"
            />
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card key={cat.id} className="p-7 bg-white space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{cat.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">{cat.desc}</p>

                  <ul className="space-y-2 pt-2 border-t border-slate-100">
                    {cat.articles.map((art, i) => (
                      <li key={i}>
                        <Link
                          href="/contact"
                          className="text-xs text-slate-700 hover:text-[#FF6B35] transition-colors flex items-center gap-1.5"
                        >
                          <span className="text-[#FF6B35] font-bold">&bull;</span>
                          <span>{art}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link
                    href="/contact"
                    className="text-xs font-bold text-[#FF6B35] hover:underline flex items-center gap-1"
                  >
                    <span>View all {cat.title.toLowerCase()} articles &rarr;</span>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Support Hotline Banner */}
        <div className="bg-[#111827] rounded-3xl p-8 sm:p-12 text-white shadow-soft flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl font-bold font-display">Need Immediate Assistance During Service?</h3>
            <p className="text-xs text-slate-400">
              Our 24/7 Priority Support Hotline is open for all active restaurant partners.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${SITE_CONFIG.phone}`}
              className="px-5 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A26] text-white font-bold text-xs flex items-center gap-2 shadow-soft transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Call Merchant Support</span>
            </a>
            <Button href="/contact" size="sm" variant="outline" className="text-slate-900 border-white">
              Contact Team
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

