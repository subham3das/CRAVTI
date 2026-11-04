import { notFound } from 'next/navigation';
import Link from 'next/link';
import { constructMetadata } from '../../../lib/seo';
import { BLOG_POSTS } from '../../../constants/blog';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { CTABanner } from '../../../sections/CTABanner';
import { ArrowLeft, Clock, Calendar, ChevronRight, User } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};

  return constructMetadata({
    title: post.title,
    description: post.summary,
    path: `/blog/${post.slug}`,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="pt-28 pb-16 bg-slate-50/50 min-h-screen">
      {/* Breadcrumb Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium truncate">
          <Link href="/" className="hover:text-[#FF6B35]">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <Link href="/blog" className="hover:text-[#FF6B35]">
            Blog
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-bold truncate">{post.title}</span>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Article Header Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-soft space-y-6">
          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-full font-bold bg-[#FFF7F4] text-[#FF6B35] border border-[#FFD5C5]">
              {post.category}
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{post.readTime}</span>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">{post.date}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#111827] tracking-tight font-display leading-[1.15]">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {post.summary}
          </p>

          <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-11 h-11 rounded-full object-cover border border-slate-200"
            />
            <div>
              <p className="text-sm font-bold text-slate-900">{post.author.name}</p>
              <p className="text-xs text-slate-500">{post.author.role}</p>
            </div>
          </div>
        </div>

        {/* Cover Photo */}
        <div className="rounded-3xl overflow-hidden shadow-soft border border-slate-200 aspect-video relative">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-soft space-y-6 text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
          {post.content.trim()}
        </div>

        {/* Navigation & Join */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#FF6B35] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Articles</span>
          </Link>

          <Button href="/join" size="sm" variant="primary">
            Try Craviti Free for 14 Days
          </Button>
        </div>
      </article>

      <div className="mt-16">
        <CTABanner />
      </div>
    </div>
  );
}

