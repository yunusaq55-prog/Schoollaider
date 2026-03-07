type Status = 'AANTOONBAAR' | 'ONVOLLEDIG' | 'ONTBREEKT';

const statusConfig: Record<Status, { dot: string; bg: string; text: string; label: string }> = {
  AANTOONBAAR: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Aantoonbaar' },
  ONVOLLEDIG: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Onvolledig' },
  ONTBREEKT: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'Ontbreekt' },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] ?? statusConfig.ONTBREEKT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

const risicConfig: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  LAAG: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Laag' },
  MIDDEN: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Midden' },
  HOOG: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'Hoog' },
};

export function RisicoBadge({ risico }: { risico: string }) {
  const config = risicConfig[risico] ?? risicConfig.HOOG;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

const docStatusConfig: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  ACTUEEL: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Actueel' },
  VERLOPEN: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'Verlopen' },
  CONCEPT: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Concept' },
};

export function DocumentStatusBadge({ status }: { status: string }) {
  const config = docStatusConfig[status] ?? docStatusConfig.CONCEPT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
