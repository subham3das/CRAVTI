import React from 'react';
import { cn } from '../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'neutral' | 'dark';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  icon,
}) => {
  const variants = {
    primary: 'bg-[#FFF7F4] text-[#FF6B35] border-[#FFD5C5]',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    dark: 'bg-slate-900 text-white border-slate-800',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 rounded-full font-bold',
    md: 'text-xs px-3.5 py-1 rounded-full font-bold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border tracking-wide uppercase',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

