import React, { forwardRef } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'warning'
  | 'success'
  | 'ghost'
  | 'outline'
  | 'tab';

export type ButtonSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'icon-xs'
  | 'icon-sm'
  | 'icon-md'
  | 'icon-lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isActive?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, (isActive?: boolean) => string> = {
  primary: (isActive) =>
    isActive
      ? 'bg-[var(--rpg-accent-hover,#4F46E5)] text-white font-bold border border-indigo-400 shadow-md shadow-indigo-600/40 ring-1 ring-indigo-400/50'
      : 'bg-[var(--rpg-accent-primary,#6366F1)] hover:bg-[var(--rpg-accent-hover,#4F46E5)] text-white font-bold border border-indigo-500/50 shadow-sm shadow-indigo-600/30',
  secondary: (isActive) =>
    isActive
      ? 'bg-[var(--rpg-bg-card-hover,#20242B)] text-white border border-[var(--rpg-border-hover,#404652)] shadow-sm'
      : 'bg-[var(--rpg-bg-card,#1A1D21)] hover:bg-[var(--rpg-bg-card-hover,#20242B)] text-[var(--rpg-text-primary,#F4F4F5)] hover:text-white border border-[var(--rpg-border,#2D3139)] hover:border-[var(--rpg-border-hover,#404652)] shadow-sm',
  danger: (isActive) =>
    isActive
      ? 'bg-rose-600 text-white border border-rose-500 shadow-md shadow-rose-600/30'
      : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-white border border-rose-500/40 hover:border-rose-500/60',
  warning: (isActive) =>
    isActive
      ? 'bg-amber-600 text-white border border-amber-500 shadow-md shadow-amber-600/30'
      : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 hover:text-white border border-amber-500/40 hover:border-amber-500/60',
  success: (isActive) =>
    isActive
      ? 'bg-emerald-600 text-white border border-emerald-500 shadow-md shadow-emerald-600/30'
      : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/40 hover:border-emerald-500/60',
  ghost: (isActive) =>
    isActive
      ? 'bg-[var(--rpg-bg-surface,#141619)] text-white border border-[var(--rpg-border,#2D3139)]'
      : 'bg-transparent hover:bg-[var(--rpg-bg-surface,#141619)] text-[var(--rpg-text-secondary,#A1A1AA)] hover:text-[var(--rpg-text-primary,#F4F4F5)] border border-transparent',
  outline: (isActive) =>
    isActive
      ? 'bg-[var(--rpg-bg-card-hover,#20242B)] text-white border border-[var(--rpg-border-hover,#404652)]'
      : 'bg-transparent hover:bg-[var(--rpg-bg-card,#1A1D21)] text-[var(--rpg-text-primary,#F4F4F5)] hover:text-white border border-[var(--rpg-border,#2D3139)] hover:border-[var(--rpg-border-hover,#404652)]',
  tab: (isActive) =>
    isActive
      ? 'bg-[var(--rpg-accent-primary,#6366F1)] text-white font-bold shadow-md shadow-indigo-600/30 border border-indigo-400/40'
      : 'text-[var(--rpg-text-secondary,#A1A1AA)] hover:text-[var(--rpg-text-primary,#F4F4F5)] hover:bg-[var(--rpg-bg-surface,#141619)] border border-transparent'
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-[11px] rounded-lg gap-1',
  sm: 'h-7 sm:h-8 px-2.5 sm:px-3 text-xs rounded-xl gap-1.5',
  md: 'h-9 sm:h-10 px-3.5 sm:px-4 text-xs sm:text-sm rounded-xl gap-2',
  lg: 'h-11 px-5 text-sm sm:text-base rounded-2xl gap-2.5',
  'icon-xs': 'w-6 h-6 p-0 rounded-lg shrink-0',
  'icon-sm': 'w-7 h-7 sm:w-8 sm:h-8 p-0 rounded-xl shrink-0',
  'icon-md': 'w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-xl shrink-0',
  'icon-lg': 'w-11 h-11 p-0 rounded-2xl shrink-0'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'sm',
      isActive = false,
      isLoading = false,
      icon,
      endIcon,
      children,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isIconOnly = size.startsWith('icon-');
    const variantClass = variantStyles[variant]?.(isActive) || variantStyles.secondary(isActive);
    const sizeClass = sizeStyles[size] || sizeStyles.sm;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-semibold transition-all cursor-pointer select-none whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${sizeClass} ${variantClass} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          icon && <span className="shrink-0 flex items-center">{icon}</span>
        )}

        {!isIconOnly && children && (
          <span className="truncate flex items-center gap-1.5">{children}</span>
        )}

        {!isLoading && endIcon && (
          <span className="shrink-0 flex items-center ml-auto">{endIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
