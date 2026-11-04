'use client';

import React, { useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import {
  LayoutDashboard,
  Smartphone,
  ChefHat,
  Grid,
  Receipt,
  Shield,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import { cn } from '../lib/utils';

const PRODUCT_TABS = [
  { id: 'dashboard', label: 'Restaurant Dashboard', icon: LayoutDashboard },
  { id: 'customer-qr', label: 'Customer QR Ordering', icon: Smartphone },
  { id: 'kds', label: 'Kitchen Orders (KDS)', icon: ChefHat },
  { id: 'tables', label: 'Tables & Floor Map', icon: Grid },
  { id: 'receipts', label: 'Receipts & Payments', icon: Receipt },
  { id: 'admin', label: 'Admin Control Center', icon: Shield },
];

export const ProductPreviews = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#FF6B35]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="primary" size="md">
            Product Showcase
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display">
            Designed for Speed, Engineered for{' '}
            <span className="text-[#FF6B35]">Zero Errors</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-normal">
            Take an interactive tour of the unified Craviti interface powering diners, chefs, cashiers, and enterprise owners.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-800/80 max-w-4xl mx-auto border border-slate-700">
          {PRODUCT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
                  isActive
                    ? 'bg-[#FF6B35] text-white shadow-soft'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Mockup Stage */}
        <div className="bg-slate-950 rounded-3xl p-5 sm:p-8 border border-slate-800 shadow-2xl ring-1 ring-white/10 max-w-5xl mx-auto min-h-[460px] flex items-center justify-center">
          {/* TAB 1: Restaurant Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="w-full space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Spice Garden Bistro Overview</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-xs text-slate-400">Live operational metrics aggregated from MongoDB</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    Settlement: Verified & Active
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Today Orders</span>
                  <p className="text-2xl font-bold text-white">128</p>
                  <p className="text-[10px] text-emerald-400">+18% vs yesterday</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Gross Sales</span>
                  <p className="text-2xl font-bold text-[#FF6B35]">₹84,250</p>
                  <p className="text-[10px] text-emerald-400">+24% average check</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Active Kitchen</span>
                  <p className="text-2xl font-bold text-white">8 Orders</p>
                  <p className="text-[10px] text-amber-400">Avg prep time: 11m</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Profile Ready</span>
                  <p className="text-2xl font-bold text-emerald-400">100%</p>
                  <p className="text-[10px] text-slate-400">All 12 checks verified</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[#FF6B35] font-bold">#CRV-901</span>
                  <span>Table 07 • 3 items (Paneer Butter Masala, 2x Garlic Naan)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                  Just Placed • Socket Received
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Customer QR Ordering */}
          {activeTab === 'customer-qr' && (
            <div className="w-full max-w-md mx-auto bg-white text-slate-900 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Spice Garden Bistro</h4>
                  <p className="text-[10px] text-slate-500">Table 04 • Contactless Mobile Dining</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Live QR Active
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Murgh Malai Tikka (Chef Special)</span>
                    <span className="text-[10px] text-slate-500">Mild Spice, Fresh Mint Chutney</span>
                  </div>
                  <span className="font-bold text-[#FF6B35]">₹480</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">2x Butter Garlic Naan</span>
                    <span className="text-[10px] text-slate-500">Clay Oven Roasted</span>
                  </div>
                  <span className="font-bold text-[#FF6B35]">₹180</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Bill Total (Incl. 5% GST):</span>
                <span className="text-base font-extrabold text-[#FF6B35]">₹693</span>
              </div>

              <button
                type="button"
                className="w-full py-3 rounded-xl bg-[#FF6B35] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-soft cursor-pointer"
              >
                <span>Pay Online (Razorpay / UPI / Cards)</span>
              </button>
            </div>
          )}

          {/* TAB 3: Kitchen Display System (KDS) */}
          {activeTab === 'kds' && (
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <ChefHat className="w-5 h-5 text-[#FF6B35]" />
                  <h4 className="text-sm font-bold text-white">Live Kitchen Display System (KDS)</h4>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Synthesized Chime: 80%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900 border-2 border-amber-500/60 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white">Table 04</span>
                    <span className="text-amber-400">Cooking (4m)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li>• 1x Dal Makhani (Less Cream)</li>
                    <li>• 2x Tandoori Roti</li>
                  </ul>
                  <span className="block text-[10px] text-slate-500 font-mono">#CRV-891</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white">Table 11</span>
                    <span className="text-blue-400">Accepted (1m)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li>• 1x Paneer Tikka Platter</li>
                    <li>• 2x Virgin Mojitos</li>
                  </ul>
                  <span className="block text-[10px] text-slate-500 font-mono">#CRV-892</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white">Table 06</span>
                    <span className="text-purple-400">Served (9m)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li>• 1x Biryani Handi</li>
                    <li>• 1x Burani Raita</li>
                  </ul>
                  <span className="block text-[10px] text-slate-500 font-mono">#CRV-893</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Tables & Floor Map */}
          {activeTab === 'tables' && (
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white">Visual Floor & Table Map</h4>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Available (7)
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Occupied (28)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { table: 'T-01', status: 'Occupied', diners: 4, bill: '₹1,450' },
                  { table: 'T-02', status: 'Available', diners: 0, bill: '₹0' },
                  { table: 'T-03', status: 'Occupied', diners: 2, bill: '₹890' },
                  { table: 'T-04', status: 'Occupied', diners: 6, bill: '₹2,340' },
                  { table: 'T-05', status: 'Available', diners: 0, bill: '₹0' },
                  { table: 'T-06', status: 'Occupied', diners: 3, bill: '₹1,220' },
                ].map((t) => (
                  <div
                    key={t.table}
                    className={`p-3 rounded-xl border text-center space-y-1 ${
                      t.status === 'Occupied'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                        : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                    }`}
                  >
                    <span className="text-xs font-bold block">{t.table}</span>
                    <span className="text-[10px] block opacity-80">{t.status}</span>
                    <span className="text-[10px] font-mono font-bold block text-white">{t.bill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Receipts & Payments */}
          {activeTab === 'receipts' && (
            <div className="w-full max-w-md mx-auto bg-white text-slate-900 rounded-2xl p-6 shadow-2xl font-mono text-xs space-y-3">
              <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
                <p className="font-bold text-sm text-slate-900">SPICE GARDEN BISTRO</p>
                <p className="text-[10px] text-slate-500">GSTIN: 27AABCS1429B1Z • FSSAI: 11521018000214</p>
                <p className="text-[10px] text-slate-500">Receipt: CRV-RCP-2026-004291</p>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span>1x Murgh Malai Tikka</span>
                  <span>480.00</span>
                </div>
                <div className="flex justify-between">
                  <span>2x Butter Garlic Naan</span>
                  <span>180.00</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST (2.5%)</span>
                  <span>16.50</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST (2.5%)</span>
                  <span>16.50</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between font-bold text-sm">
                <span>TOTAL PAID (UPI)</span>
                <span className="text-[#FF6B35]">₹693.00</span>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-500">
                Payment Authorized via Razorpay • Verified Settlement T+1
              </div>
            </div>
          )}

          {/* TAB 6: Admin Control Center */}
          {activeTab === 'admin' && (
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white">Platform Central Control System</h4>
                <span className="text-xs font-mono text-purple-400">Super Admin Access</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Platform Volume</span>
                  <p className="text-xl font-bold text-white">₹18.4M</p>
                  <span className="text-[10px] text-emerald-400">Across 2,400+ Outlets</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Bank Verifications</span>
                  <p className="text-xl font-bold text-emerald-400">98.4%</p>
                  <span className="text-[10px] text-slate-400">4-Eye Audit Approved</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">System Uptime</span>
                  <p className="text-xl font-bold text-white">99.99%</p>
                  <span className="text-[10px] text-emerald-400">Zero Degradation SLA</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Link */}
        <div className="text-center">
          <Button href="/join" size="md" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Experience Craviti Live For Your Restaurant
          </Button>
        </div>
      </div>
    </section>
  );
};

