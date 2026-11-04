import { constructMetadata } from '../../lib/seo';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CTABanner } from '../../sections/CTABanner';
import {
  HeartHandshake,
  Flame,
  ShieldCheck,
  Zap,
  TrendingUp,
  Users,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react';

export const metadata = constructMetadata({
  title: 'About Us — The Story Behind Craviti',
  description:
    'Craviti is on a mission to empower independent restaurants with enterprise-grade operating technology, frictionless QR dining, and fair transparent economics.',
  path: '/about',
});

const VALUES = [
  {
    title: 'Hospitality-First Engineering',
    desc: 'Technology should enhance personal dining hospitality, never replace it. Our interfaces are intentionally unobtrusive and lightning-fast.',
    icon: HeartHandshake,
  },
  {
    title: 'Extreme Operational Reliability',
    desc: 'Restaurants cannot tolerate software crashes during an 8:30 PM Saturday dinner rush. We build with redundant clusters and guaranteed 99.99% uptime.',
    icon: ShieldCheck,
  },
  {
    title: 'Anti-Aggregator Economics',
    desc: 'Third-party delivery apps extract 25-35% of restaurant margins. Craviti provides direct table ordering with zero sales commissions.',
    icon: Flame,
  },
  {
    title: 'Zero Proprietary Hardware Lock-In',
    desc: 'Run your entire dining room on iPads, laptops, or mobile phones you already own. We never force restaurants into expensive proprietary hardware contracts.',
    icon: Zap,
  },
];

const LEADERSHIP = [
  {
    name: 'Aaditya Vikram',
    role: 'Co-Founder & Chief Executive Officer',
    bio: 'Former hospitality restaurateur and software engineer passionate about modernizing culinary operations.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Siddharth Nair',
    role: 'Co-Founder & Chief Technology Officer',
    bio: 'Distributed systems architect specialized in real-time WebSockets, low-latency financial settlement rails, and high-concurrency cloud clusters.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Ananya Deshmukh',
    role: 'Head of Restaurant Success',
    bio: 'Dedicated culinary consultant who has onboarded and optimized over 1,200 fine dining and casual hospitality establishments.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
];

export default function AboutPage() {
  return (
    <div className="pt-28 pb-12">
      {/* Hero Header */}
      <section className="py-20 bg-gradient-to-b from-[#FFF7F4] to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="primary" size="md">
            Our Mission & Story
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#111827] tracking-tight font-display max-w-4xl mx-auto">
            Building the Operating System for the{' '}
            <span className="text-[#FF6B35]">Next Golden Era</span> of Dining
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            We believe independent restaurants are the cultural beating heart of every city. Craviti exists to make them wildly profitable, technologically advanced, and operationally effortless.
          </p>
        </div>
      </section>

      {/* Story & Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-display">
              Why We Started Craviti
            </h2>
            <p>
              In 2024, our founders sat in a bustling restaurant on a Saturday evening. The food was spectacular, but the experience was fraught with operational friction: a 20-minute wait just to receive physical menus, waiters frantically handwriting tickets, orders being misheard in the noisy kitchen, and another 25-minute ordeal simply trying to pay the bill.
            </p>
            <p>
              When talking to the restaurant owner later that evening, the reality was even starker: third-party delivery apps were eating up to 30% of their gross revenue, thermal kitchen printers were jamming constantly, and their staff spent over half their shift on mundane administrative tasks rather than delighting diners.
            </p>
            <p className="font-semibold text-slate-900">
              We realized the problem was not the hospitality team — it was the obsolete software they were forced to use.
            </p>
            <p>
              Craviti was founded to solve this single challenge: create an all-in-one cloud operating system where diners can scan, order, and pay in seconds, chefs receive crystal-clear tickets on live KDS screens with acoustic sound alerts, and restaurant owners keep 100% of their hard-earned margins with direct daily bank payouts.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-slate-100">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <p className="text-3xl font-extrabold text-[#FF6B35] font-display">2,400+</p>
              <p className="text-xs text-slate-500 font-bold uppercase">Active Restaurants</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <p className="text-3xl font-extrabold text-slate-900 font-display">18M+</p>
              <p className="text-xs text-slate-500 font-bold uppercase">Orders Processed</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <p className="text-3xl font-extrabold text-[#FF6B35] font-display">35%</p>
              <p className="text-xs text-slate-500 font-bold uppercase">Turnaround Speedup</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <p className="text-3xl font-extrabold text-slate-900 font-display">99.99%</p>
              <p className="text-xs text-slate-500 font-bold uppercase">Uptime Reliability</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-slate-50/70 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <SectionHeader
            badge="Guiding Principles"
            title="The Values That Power"
            titleHighlight="Every Line of Code"
            subtitle="How we make engineering, design, and partnership decisions at Craviti."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {VALUES.map((val, i) => {
              const Icon = val.icon;
              return (
                <Card key={i} className="p-8 bg-white space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF7F4] border border-[#FFD5C5] text-[#FF6B35] flex items-center justify-center shadow-soft">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{val.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {val.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <SectionHeader
            badge="Leadership"
            title="The Team Behind the Platform"
            subtitle="Hospitality veterans and software architects dedicated to your growth."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {LEADERSHIP.map((lead, i) => (
              <Card key={i} className="p-6 bg-slate-50/50 space-y-4 text-center">
                <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border-2 border-[#FFD5C5] shadow-soft">
                  <img
                    src={lead.avatar}
                    alt={lead.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{lead.name}</h4>
                  <p className="text-xs text-[#FF6B35] font-semibold">{lead.role}</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{lead.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </div>
  );
}

