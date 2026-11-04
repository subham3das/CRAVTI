import { constructMetadata } from '../../lib/seo';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CTABanner } from '../../sections/CTABanner';
import {
  ShieldCheck,
  Lock,
  Server,
  Database,
  CheckCircle,
  FileCheck,
  RefreshCw,
  KeyRound,
  Eye,
  AlertCircle,
} from 'lucide-react';

export const metadata = constructMetadata({
  title: 'Enterprise Security, Compliance & SLA',
  description:
    'Craviti enterprise security architecture: 256-bit encryption, strict tenant isolation, 99.99% uptime SLA, four-eye bank verification, and automated disaster recovery.',
  path: '/security',
});

const SECURITY_PILLARS = [
  {
    title: 'Bank-Grade 256-Bit Encryption',
    desc: 'All network traffic between guest browsers, kitchen screens, and our Express API runs over TLS 1.3 with SHA-256 HMAC authentication. Sensitive credentials at rest utilize AES-256.',
    icon: Lock,
  },
  {
    title: 'Strict Multi-Tenant Isolation',
    desc: 'Every database query enforces tenant scoping to the authenticated restaurantId. Cross-tenant leakage is mathematically impossible at the data layer.',
    icon: Server,
  },
  {
    title: 'Four-Eye Bank Verification Workflow',
    desc: 'Merchant bank account numbers and canceled cheques must undergo administrative compliance verification before online payouts can be triggered.',
    icon: FileCheck,
  },
  {
    title: 'Automated Hourly Disaster Recovery',
    desc: 'Continuous real-time point-in-time recovery (PITR) with automated hourly snapshots across geographically separated availability zones.',
    icon: Database,
  },
  {
    title: 'Immutable Audit Timeline Logs',
    desc: 'Every critical platform event—such as price updates, table locking, or payment refunds—is permanently recorded in a tamper-proof audit trail.',
    icon: Eye,
  },
  {
    title: 'Role-Based Access Control (RBAC)',
    desc: 'Granular permissions isolate executive financials from kitchen chefs and junior servers. Staff members only see what they need to execute their shift.',
    icon: KeyRound,
  },
];

export default function SecurityPage() {
  return (
    <div className="pt-28 pb-16">
      {/* Hero Header */}
      <section className="py-20 bg-gradient-to-b from-[#FFF7F4] to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="primary" size="md">
            Enterprise Trust & Security
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#111827] tracking-tight font-display max-w-4xl mx-auto">
            Bank-Grade Security for Your{' '}
            <span className="text-[#FF6B35]">Restaurant Operations</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            Your dining transactions, customer records, and daily bank payouts are protected by enterprise encryption and 99.99% availability guarantees.
          </p>
        </div>
      </section>

      {/* Security Pillars Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <SectionHeader
            badge="Architecture"
            title="Defense-in-Depth Across Every Layer"
            subtitle="Built from the ground up to prevent data leakage, fraudulent chargebacks, and system downtime."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SECURITY_PILLARS.map((p, i) => {
              const Icon = p.icon;
              return (
                <Card key={i} className="p-8 bg-white border border-slate-200/80 shadow-soft space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center shadow-soft">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{p.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">{p.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SLA & Uptime Guarantee */}
      <section id="uptime" className="scroll-mt-32 py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>99.99% Availability Guarantee</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-white">
                Zero Dinner Rush Downtime
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal max-w-xl">
                We know that 5 minutes of downtime on a Friday night means hundreds of hungry guests and thousands in lost revenue. Craviti operates on redundant multi-zone clusters with zero single points of failure.
              </p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                <p className="text-3xl font-extrabold text-[#FF6B35] font-display">99.99%</p>
                <p className="text-[11px] text-slate-400 uppercase font-bold">Uptime Target</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                <p className="text-3xl font-extrabold text-emerald-400 font-display">&lt; 150ms</p>
                <p className="text-[11px] text-slate-400 uppercase font-bold">API Latency</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTABanner />
    </div>
  );
}

