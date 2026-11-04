'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { SITE_CONFIG } from '../constants/site';
import {
  Sparkles,
  ArrowRight,
  QrCode,
  ChefHat,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  Play,
  Flame,
} from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-b from-[#FFF7F4] via-white to-white">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#FF6B35]/15 to-[#FF8A60]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-amber-400/10 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Top Pill Kicker */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center"
          >
            <Badge variant="primary" size="md" icon={<Flame className="w-3.5 h-3.5 text-[#FF6B35]" />}>
              The Next-Generation Restaurant OS • Phase 5 Live
            </Badge>
          </motion.div>

          {/* Hero Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#111827] tracking-tight leading-[1.08] font-display"
          >
            Turn Every Table Into a Fast,{' '}
            <span className="text-[#FF6B35] relative inline-block">
              High-Margin
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-[#FF6B35]/25 -z-10"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
              >
                <path d="M0,15 Q50,0 100,15" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>{' '}
            Revenue Engine.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-[#6B7280] leading-relaxed max-w-2xl mx-auto font-normal"
          >
            Frictionless table QR code dining, direct-to-chef Kitchen Display Systems, instantaneous Razorpay settlements, and enterprise restaurant intelligence. Built for high-volume hospitality.
          </motion.p>

          {/* CTA Group */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
          >
            <Button
              href="/join"
              size="lg"
              variant="primary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto text-base shadow-glow"
            >
              Join Craviti as Restaurant
            </Button>
            <Button
              href="/contact"
              size="lg"
              variant="outline"
              leftIcon={<Play className="w-4 h-4 fill-slate-700" />}
              className="w-full sm:w-auto text-base"
            >
              Book 15-Min Live Demo
            </Button>
          </motion.div>

          {/* Trust Guarantees */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>14-day free trial</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Zero setup fees</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>No proprietary hardware</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Direct T+1 bank payouts</span>
            </span>
          </motion.div>
        </div>

        {/* Hero Interactive Product Showcase Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-14 lg:mt-20 relative max-w-6xl mx-auto"
        >
          {/* Laptop / Browser Container */}
          <div className="bg-slate-900 rounded-3xl p-3 sm:p-5 shadow-2xl border border-slate-800 ring-1 ring-white/10">
            {/* Browser Window Bar */}
            <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex items-center gap-2 px-4 py-1 rounded-lg bg-slate-800/80 text-[11px] font-mono text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>app.craviti.com/dashboard • Spice Garden Bistro Live</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
                Socket: Connected
              </div>
            </div>

            {/* Dashboard Mockup Grid Inside */}
            <div className="bg-slate-950 rounded-2xl p-4 sm:p-6 mt-3 grid grid-cols-1 md:grid-cols-12 gap-5 text-white">
              {/* Left Column: KPI metrics */}
              <div className="md:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Live Restaurant Overview</h3>
                    <p className="text-xs text-slate-400">Real-time synchronized order stream</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active Dinner Rush
                  </span>
                </div>

                {/* 4 KPI cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Today&apos;s Orders</span>
                    <p className="text-xl font-extrabold text-white">128</p>
                    <span className="text-[10px] text-emerald-400 font-semibold">+34% vs yesterday</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Today Revenue</span>
                    <p className="text-xl font-extrabold text-[#FF6B35]">₹84,250</p>
                    <span className="text-[10px] text-emerald-400 font-semibold">+22% online volume</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Avg Prep Time</span>
                    <p className="text-xl font-extrabold text-white">11 min</p>
                    <span className="text-[10px] text-emerald-400 font-semibold">-4 min turnaround</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Occupied Tables</span>
                    <p className="text-xl font-extrabold text-white">28 / 35</p>
                    <span className="text-[10px] text-amber-400 font-semibold">80% table capacity</span>
                  </div>
                </div>

                {/* Live orders table snippet */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Live Kitchen Stream</span>
                    <span className="text-[#FF6B35]">KDS Chime: 80% Vol</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { id: '#CRV-894', table: 'Table 04', items: '2x Truffle Naan, 1x Paneer Tikka, 1x Mango Lassi', total: '₹1,240', status: 'Cooking', badge: 'bg-amber-500/20 text-amber-300' },
                      { id: '#CRV-895', table: 'Table 12', items: '1x Dal Makhani, 2x Butter Roti, 1x Garlic Prawns', total: '₹1,850', status: 'Served', badge: 'bg-purple-500/20 text-purple-300' },
                      { id: '#CRV-896', table: 'Table 07', items: '1x Biryani Platter, 2x Mojitos', total: '₹1,490', status: 'Paid Online', badge: 'bg-emerald-500/20 text-emerald-300' },
                    ].map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-[#FF6B35]">{order.id}</span>
                          <span className="font-bold text-slate-200">{order.table}</span>
                          <span className="text-slate-400 truncate max-w-[200px] hidden sm:inline">{order.items}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">{order.total}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.badge}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Customer Mobile Screen Mockup Card */}
              <div className="md:col-span-4 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white">Diner QR Interface</span>
                    <span className="text-[10px] text-emerald-400 font-mono">No App Required</span>
                  </div>

                  {/* Simulated Mobile Card */}
                  <div className="bg-white text-slate-900 rounded-xl p-3 shadow-lg space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-slate-900">Spice Garden Bistro</p>
                        <p className="text-[9px] text-slate-500">Table 04 • Indoor Patio</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FFF7F4] text-[#FF6B35] border border-[#FFD5C5]">
                        QR Scanned
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[10px] space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>1x Murgh Malai Tikka</span>
                        <span>₹480</span>
                      </div>
                      <p className="text-[9px] text-slate-500">Modifier: Mild Spice, Extra Mint Chutney</p>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs font-bold">
                      <span>Total (Incl. GST):</span>
                      <span className="text-[#FF6B35]">₹1,240</span>
                    </div>

                    <button
                      type="button"
                      className="w-full py-2 rounded-lg bg-[#FF6B35] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Pay Online with Razorpay / UPI</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 text-center">
                  <span className="text-[10px] text-slate-400">
                    Instant settlement via UPI, GPay & Cards
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

