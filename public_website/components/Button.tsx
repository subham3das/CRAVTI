'use client';

import React from 'react';
import Link from 'next/link';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      href,
      leftIcon,
      rightIcon,
      isLoading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold transition-all duration-200 select-none cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-[#FF6B35] hover:bg-[#E85A26] text-white shadow-soft hover:shadow-glow focus:ring-[#FF6B35]/40 border border-transparent',
      secondary:
        'bg-[#FFF7F4] hover:bg-[#FFECE4] text-[#FF6B35] border border-[#FFD5C5] focus:ring-[#FF6B35]/30',
      outline:
        'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs hover:border-slate-400 focus:ring-slate-400',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent',
      dark:
        'bg-[#111827] hover:bg-black text-white shadow-soft focus:ring-slate-900 border border-slate-800',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-2 rounded-lg gap-1.5',
      md: 'text-sm px-5 py-2.5 rounded-xl gap-2',
      lg: 'text-base px-6 py-3.5 rounded-xl gap-2.5',
    };

    const content = (
      <>
        {isLoading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          className={cn(baseStyles, variants[variant], sizes[size], className)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

