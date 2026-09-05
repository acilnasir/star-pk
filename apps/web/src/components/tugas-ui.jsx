import React from 'react';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import { PRIORITAS, STATUS } from '@/lib/units';

export function StatusBadge({ status, className }) {
  const meta = STATUS[status];
  if (!meta) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        meta.badge,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function LokasiBadge({ provinsi, kabupaten_kota, className }) {
  if (!provinsi && !kabupaten_kota) return null;
  const teks = [provinsi, kabupaten_kota].filter(Boolean).join(' / ');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700',
        className,
      )}
    >
      <MapPin className="h-3 w-3 shrink-0 text-slate-500" />
      {teks}
    </span>
  );
}

export function PrioritasBadge({ prioritas, className }) {
  const meta = PRIORITAS[prioritas];
  if (!meta) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.badge,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function ProgresBar({ value, status, className }) {
  const warna =
    status === 'selesai'
      ? 'bg-emerald-600'
      : status === 'terhambat'
        ? 'bg-red-600'
        : 'bg-primary';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 w-full min-w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-500', warna)}
          style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">
        {value || 0}%
      </span>
    </div>
  );
}
