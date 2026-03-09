import { useState, useEffect } from 'react';
import api from '../api/client';
import { useSchoolContext } from '../context/SchoolContext';
import { Sparkles, Shield, FileCheck, AlertTriangle } from 'lucide-react';

interface ComplianceStandaard {
  standaardId: string;
  code: string;
  naam: string;
  domeinCode: string;
  gewicht: number;
  handmatigeStatus: 'AANTOONBAAR' | 'ONVOLLEDIG' | 'ONTBREEKT';
  aiStatus: 'AANTOONBAAR' | 'ONVOLLEDIG' | 'ONTBREEKT' | null;
  effectieveStatus: 'AANTOONBAAR' | 'ONVOLLEDIG' | 'ONTBREEKT';
  aiConfidence: number | null;
  aantalDocumenten: number;
  aantalAiSecties: number;
  actueel: boolean;
}

interface ComplianceDomain {
  code: string;
  naam: string;
  standaarden: ComplianceStandaard[];
  domeinScore: number;
}

interface ComplianceMatrix {
  schoolId: string;
  schoolNaam: string;
  domeinen: ComplianceDomain[];
  overallScore: number;
  aantoonbaarCount: number;
  onvolledigCount: number;
  ontbreektCount: number;
  totalStandaarden: number;
}

const STATUS_COLORS = {
  AANTOONBAAR: 'bg-emerald-500',
  ONVOLLEDIG: 'bg-amber-500',
  ONTBREEKT: 'bg-red-500',
};

const STATUS_BG = {
  AANTOONBAAR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ONVOLLEDIG: 'bg-amber-50 text-amber-700 border-amber-200',
  ONTBREEKT: 'bg-red-50 text-red-700 border-red-200',
};

export function ComplianceMatrixView() {
  const { selectedSchoolId } = useSchoolContext();
  const [matrix, setMatrix] = useState<ComplianceMatrix | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedSchoolId) {
      loadMatrix();
    }
  }, [selectedSchoolId]);

  async function loadMatrix() {
    setLoading(true);
    try {
      const { data } = await api.get(`/dashboard/school/${selectedSchoolId}/compliance`);
      setMatrix(data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  if (!selectedSchoolId || loading) return null;
  if (!matrix) return null;

  return (
    <div className="card">
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Compliance Matrix</h2>
              <p className="text-xs text-gray-500">
                AI-verrijkte inspectie-compliance voor {matrix.schoolNaam}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ScorePill score={matrix.overallScore} />
            <div className="flex gap-2 text-xs">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                {matrix.aantoonbaarCount} aantoonbaar
              </span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                {matrix.onvolledigCount} onvolledig
              </span>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-700">
                {matrix.ontbreektCount} ontbreekt
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual matrix grid */}
      <div className="p-6">
        <div className="grid gap-4">
          {matrix.domeinen.map((domein) => (
            <div key={domein.code} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">{domein.code}</span>
                  <span className="text-xs text-gray-400">{domein.naam}</span>
                </div>
                <span className="text-xs font-medium text-gray-500">{domein.domeinScore}%</span>
              </div>
              <div className="flex gap-1.5">
                {domein.standaarden.map((s) => (
                  <StandaardCell key={s.standaardId} standaard={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StandaardCell({ standaard }: { standaard: ComplianceStandaard }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`flex h-10 min-w-[3rem] flex-1 cursor-default items-center justify-center rounded-lg border text-xs font-bold transition-all ${STATUS_BG[standaard.effectieveStatus]}`}
      >
        <span>{standaard.code}</span>
        {standaard.aiStatus && (
          <Sparkles className="ml-1 h-2.5 w-2.5 opacity-60" />
        )}
      </div>

      {/* Tooltip */}
      {hovered && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          {/* Arrow */}
          <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-gray-200 bg-white" />
          <div className="relative">
            <div className="mb-2 text-xs font-semibold text-gray-900">{standaard.naam}</div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Handmatig:</span>
                <span className={`rounded px-1.5 py-0.5 font-medium ${STATUS_BG[standaard.handmatigeStatus]}`}>
                  {standaard.handmatigeStatus}
                </span>
              </div>
              {standaard.aiStatus && (
                <div className="flex justify-between">
                  <span className="text-gray-500">AI Status:</span>
                  <span className={`rounded px-1.5 py-0.5 font-medium ${STATUS_BG[standaard.aiStatus]}`}>
                    {standaard.aiStatus}
                  </span>
                </div>
              )}
              {standaard.aiConfidence != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Vertrouwen:</span>
                  <span className="font-mono text-gray-700">{Math.round(standaard.aiConfidence * 100)}%</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Documenten:</span>
                <span className="flex items-center gap-1 text-gray-700">
                  <FileCheck className="h-3 w-3" />
                  {standaard.aantalDocumenten}
                  {standaard.aantalAiSecties > 0 && (
                    <span className="text-violet-500">+{standaard.aantalAiSecties} AI</span>
                  )}
                </span>
              </div>
              {!standaard.actueel && standaard.effectieveStatus !== 'ONTBREEKT' && (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  Niet actueel
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-700 bg-emerald-50' : score >= 50 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-bold ${color}`}>
      {score}%
    </span>
  );
}
