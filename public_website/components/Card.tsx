import React from 'react';
import { cn } from '../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  bordered = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-6 transition-all duration-300',
        bordered && 'border border-slate-200/80',
        hoverEffect && 'hover:shadow-elevated hover:border-[#FF6B35]/30 hover:-translate-y-1',
        !hoverEffect && 'shadow-soft',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

