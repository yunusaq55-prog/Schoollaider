import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import api from '../../api/client';

interface PredictiveInzicht {
  schoolNaam: string;
  schoolId: string;
  type: string;
  beschrijving: string;
  aanbeveling: string;
  waarschijnlijkheid: number;
  tijdshorizonWeken: number;
}

interface PredictiveResult {
  inzichten: PredictiveInzicht[];
}

const TYPE_COLORS: Record<string, string> = {
  STIJGEND_VERZUIM: 'border-red-300 bg-red-50',
  UITSTROOM_RISICO: 'border-orange-300 bg-orange-50',
  KAPACITEITS_TEKORT: 'border-yellow-300 bg-yellow-50',
  STABIEL: 'border-green-300 bg-green-50',
};

const TYPE_LABELS: Record<string, string> = {
  STIJGEND_VERZUIM: 'Stijgend Verzuim',
  UITSTROOM_RISICO: 'Uitstroom Risico',
  KAPACITEITS_TEKORT: 'Capaciteitstekort',
  STABIEL: 'Stabiel',
};

function WaarschijnlijkheidMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? 'bg-red-500' : pct >= 50 ? 'bg-orange-400' : 'bg-yellow-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700">{pct}%</span>
    </div>
  );
}

export default function PredictiveAnalyticsPage() {
  const { data, isLoading, error } = useQuery<PredictiveResult>({
    queryKey: ['predictive-insights'],
    queryFn: () => api.get('/operations/analytics/predictive').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          Kon de voorspellende inzichten niet laden. Zorg dat er HR-verzuimdata beschikbaar is.
        </div>
      </div>
    );
  }

  const inzichten = data?.inzichten ?? [];

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Voorspellende Analyse</h1>
      </div>

      <p className="text-sm text-gray-500">
        AI-inzichten op basis van historische HR-verzuimtrends. Kijk vooruit, niet achteruit.
      </p>

      {inzichten.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp className="h-12 w-12 mx-auto mb-3" />
          <p>Onvoldoende historische data voor voorspellingen.</p>
          <p className="text-sm">Voer verzuimdata in via de HR-module voor minimaal 3 perioden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inzichten.map((inzicht, i) => (
            <div
              key={i}
              className={`border rounded-lg p-4 ${TYPE_COLORS[inzicht.type] ?? 'border-gray-200 bg-white'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {TYPE_LABELS[inzicht.type] ?? inzicht.type}
                  </span>
                  <p className="font-semibold text-gray-900">{inzicht.schoolNaam}</p>
                </div>
                <span className="text-xs text-gray-500 bg-white/70 rounded px-2 py-0.5">
                  ~{inzicht.tijdshorizonWeken} weken
                </span>
              </div>

              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">Waarschijnlijkheid</p>
                <WaarschijnlijkheidMeter value={inzicht.waarschijnlijkheid} />
              </div>

              <p className="text-sm text-gray-700 mb-3 leading-relaxed">{inzicht.beschrijving}</p>

              <div className="bg-white/60 rounded p-2.5">
                <p className="text-xs font-medium text-gray-600 mb-1">Aanbeveling</p>
                <p className="text-xs text-gray-700">{inzicht.aanbeveling}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
