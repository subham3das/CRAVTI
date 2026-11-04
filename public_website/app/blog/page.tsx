import Link from 'next/link';
import { constructMetadata } from '../../lib/seo';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { BLOG_POSTS } from '../../constants/blog';
import { CTABanner } from '../../sections/CTABanner';
import { Clock, Calendar, ArrowRight, User } from 'lucide-react';

export const metadata = constructMetadata({
  title: 'Blog & Restaurant Growth Insights',
  description:
    'Tactical guides, operational playbooks, and menu engineering strategies to help independent restaurants and dining chains grow profits and accelerate table turns.',
  path: '/blog',
});

export default function BlogIndexPage() {
  const featured = BLOG_POSTS[0];
  const others = BLOG_POSTS.slice(1);

  return (
    <div className="pt-28 pb-16">
      {/* Hero Header */}
      <section className="py-20 bg-gradient-to-b from-[#FFF7F4] to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="primary" size="md">
            The Craviti Dispatch
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#111827] tracking-tight font-display max-w-4xl mx-auto">
            Insights on Modern Hospitality &{' '}
            <span className="text-[#FF6B35]">Restaurant Profits</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            Proven playbooks for executive chefs, general managers, and hospitality entrepreneurs.
          </p>
        </div>
      </section>

      {/* Featured Article */}
      {featured && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href={`/blog/${featured.slug}`} className="group block">
              <Card className="p-6 sm:p-10 bg-white border border-slate-200/80 shadow-soft group-hover:shadow-elevated transition-all">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7F4] text-[#FF6B35] border border-[#FFD5C5]">
                        {featured.category}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{featured.readTime}</span>
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 group-hover:text-[#FF6B35] transition-colors font-display leading-tight">
                      {featured.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {featured.summary}
                    </p>

                    <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={featured.author.avatar}
                          alt={featured.author.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{featured.author.name}</p>
                          <p className="text-[10px] text-slate-400">{featured.author.role}</p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-[#FF6B35] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Read Article</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="rounded-2xl overflow-hidden aspect-video border border-slate-200 shadow-2xs">
                      <img
                        src={featured.coverImage}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </section>
      )}

      {/* Grid of Other Articles */}
      <section className="py-12 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h3 className="text-xl font-bold text-slate-900 font-display">Latest Articles</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {others.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                <Card className="h-full flex flex-col justify-between p-6 bg-white border border-slate-200/80 group-hover:shadow-elevated transition-all">
                  <div className="space-y-4">
                    <div className="rounded-xl overflow-hidden aspect-video border border-slate-100">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7F4] text-[#FF6B35]">
                        {post.category}
                      </span>
                      <span className="text-[11px] text-slate-400">{post.readTime}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 group-hover:text-[#FF6B35] transition-colors leading-snug">
                      {post.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {post.summary}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{post.date}</span>
                    <span className="font-bold text-[#FF6B35] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Read</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </div>
  );
}

