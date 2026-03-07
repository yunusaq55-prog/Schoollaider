import { Loader2, CheckCircle2, XCircle, Clock, Sparkles } from 'lucide-react';
import type { AnalysisStatus } from '@schoollaider/shared';

interface AiStatusBadgeProps {
  status: AnalysisStatus;
  progress?: number;
  compact?: boolean;
}

const STATUS_CONFIG: Record<AnalysisStatus, {
  label: string;
  icon: typeof Sparkles;
  className: string;
}> = {
  NONE: {
    label: 'Niet geanalyseerd',
    icon: Sparkles,
    className: 'bg-gray-100 text-gray-500',
  },
  PENDING: {
    label: 'Wachtrij',
    icon: Clock,
    className: 'bg-amber-50 text-amber-600',
  },
  PROCESSING: {
    label: 'Analyseren',
    icon: Loader2,
    className: 'bg-blue-50 text-blue-600',
  },
  COMPLETED: {
    label: 'Geanalyseerd',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-600',
  },
  FAILED: {
    label: 'Mislukt',
    icon: XCircle,
    className: 'bg-red-50 text-red-600',
  },
};

export function AiStatusBadge({ status, progress, compact = false }: AiStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NONE;
  const Icon = config.icon;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full p-1.5 ${config.className}`}
        title={`AI: ${config.label}${progress ? ` (${progress}%)` : ''}`}
      >
        <Icon className={`h-3.5 w-3.5 ${status === 'PROCESSING' ? 'animate-spin' : ''}`} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      <Icon className={`h-3 w-3 ${status === 'PROCESSING' ? 'animate-spin' : ''}`} />
      {config.label}
      {status === 'PROCESSING' && progress != null && (
        <span className="ml-0.5 text-[10px] opacity-70">{progress}%</span>
      )}
    </span>
  );
}
