import type { HrRisico } from '@schoollaider/shared';

const config: Record<HrRisico, { label: string; bg: string; text: string; dot: string }> = {
  STABIEL: { label: 'Stabiel', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  KWETSBAAR: { label: 'Kwetsbaar', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  HOOG_RISICO: { label: 'Hoog risico', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

interface Props {
  risico: HrRisico;
  size?: 'sm' | 'md';
}

export function HrRisicoBadge({ risico, size = 'sm' }: Props) {
  const c = config[risico];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${c.bg} ${c.text} ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export function hrScoreColor(score: number) {
  if (score >= 70) return { ring: 'text-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' };
  if (score >= 50) return { ring: 'text-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' };
  return { ring: 'text-red-500', bg: 'bg-red-50', text: 'text-red-700' };
}

export function trendIcon(trend: 'STIJGEND' | 'STABIEL' | 'DALEND') {
  switch (trend) {
    case 'STIJGEND': return { label: 'Stijgend', icon: '\u2191', color: 'text-emerald-600' };
    case 'DALEND': return { label: 'Dalend', icon: '\u2193', color: 'text-red-600' };
    default: return { label: 'Stabiel', icon: '\u2192', color: 'text-gray-500' };
  }
}
