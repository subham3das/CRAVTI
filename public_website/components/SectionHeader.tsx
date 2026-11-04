import React from 'react';
import { Badge } from './Badge';
import { cn } from '../lib/utils';

interface SectionHeaderProps {
  badge?: string;
  badgeIcon?: React.ReactNode;
  title: string;
  titleHighlight?: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  badge,
  badgeIcon,
  title,
  titleHighlight,
  subtitle,
  align = 'center',
  className,
}) => {
  return (
    <div
      className={cn(
        'max-w-3xl space-y-3.5',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className
      )}
    >
      {badge && (
        <div className={align === 'center' ? 'flex justify-center' : 'flex justify-start'}>
          <Badge icon={badgeIcon} size="md">
            {badge}
          </Badge>
        </div>
      )}

      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] tracking-tight leading-[1.15]">
        {title}{' '}
        {titleHighlight && (
          <span className="text-[#FF6B35] relative inline-block">
            {titleHighlight}
            <svg
              className="absolute -bottom-2 left-0 w-full h-2 text-[#FF6B35]/20 -z-10"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
            >
              <path d="M0,15 Q50,0 100,15" stroke="currentColor" strokeWidth="8" fill="none" />
            </svg>
          </span>
        )}
      </h2>

      {subtitle && (
        <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
};

