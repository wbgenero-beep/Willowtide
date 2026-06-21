import React from 'react';

export function CandyButton({
  children,
  onClick,
  variant = 'coral',
  className = '',
  disabled,
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'coral' | 'teal' | 'gold';
  className?: string;
  disabled?: boolean;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`candy-btn candy-${variant} ${full ? 'w-full' : ''} ${
        disabled ? 'opacity-50 grayscale' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Modal({
  children,
  onClose,
  dismissable = true,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  dismissable?: boolean;
}) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={() => dismissable && onClose?.()}
    >
      <div
        className="w-full animate-pop rounded-t-3xl bg-sand p-5 pb-7 shadow-cardsoft"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function CenterModal({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-5 backdrop-blur-[2px]">
      <div className="w-full animate-pop rounded-3xl bg-sand p-5 shadow-cardsoft">{children}</div>
    </div>
  );
}

export function ProgressBar({ value, max, className = '' }: { value: number; max: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, max === 0 ? 0 : (value / max) * 100));
  return (
    <div className={`h-3 w-full overflow-hidden rounded-full bg-driftwood-light/40 ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-seaglass-light to-seaglass transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-sm font-bold text-driftwood-dark ${className}`}>
      {children}
    </span>
  );
}

export function ScreenHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 pb-2 pt-3">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-lg font-bold text-driftwood-dark shadow-sm active:translate-y-[2px]"
        >
          ‹
        </button>
      ) : (
        <div className="w-9" />
      )}
      <h1 className="font-display text-xl font-extrabold text-driftwood-dark">{title}</h1>
      <div className="flex w-9 justify-end">{right}</div>
    </div>
  );
}
