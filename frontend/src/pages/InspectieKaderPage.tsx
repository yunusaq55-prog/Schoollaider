import { useState, useEffect } from 'react';
import api from '../api/client';
import { useSchoolContext } from '../context/SchoolContext';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ComplianceMatrixView } from '../components/ComplianceMatrixView';
import { ChevronDown, ClipboardCheck, FileCheck, Shield } from 'lucide-react';
import type { InspectieDomein, BewijsStatus } from '@schoollaider/shared';

interface StandaardWithStatus {
  id: string;
  domeinId: string;
  code: string;
  naam: string;
  beschrijving: string;
  toelichting: string;
  gewicht: number;
  schoolStatus: {
    id: string | null;
    schoolId: string;
    standaardId: string;
    status: BewijsStatus;
    bewijs: string;
    evaluatie: string;
    actueel: boolean;
    opmerking: string;
    updatedAt: string | null;
  };
}

interface DomeinWithStandaarden extends InspectieDomein {
  standaarden: StandaardWithStatus[];
}

const STATUS_OPTIONS: { value: BewijsStatus; label: string }[] = [
  { value: 'AANTOONBAAR', label: 'Aantoonbaar' },
  { value: 'ONVOLLEDIG', label: 'Onvolledig' },
  { value: 'ONTBREEKT', label: 'Ontbreekt' },
];

export function InspectieKaderPage() {
  const { selectedSchoolId } = useSchoolContext();

  const [domeinen, setDomeinen] = useState<DomeinWithStandaarden[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDomains, setOpenDomains] = useState<Record<string, boolean>>({});
  const [editingStatus, setEditingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSchoolId) {
      fetchData();
    }
  }, [selectedSchoolId]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data } = await api.get(`/inspectie/school/${selectedSchoolId}/statuses`);
      setDomeinen(data);
      const openState: Record<string, boolean> = {};
      data.forEach((d: DomeinWithStandaarden) => {
        openState[d.id] = true;
      });
      setOpenDomains(openState);
    } catch (err: any) {
      console.error('[InspectieKader] Data ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleDomain(domainId: string) {
    setOpenDomains((prev) => ({ ...prev, [domainId]: !prev[domainId] }));
  }

  async function handleStatusChange(standaardId: string, newStatus: BewijsStatus) {
    if (!selectedSchoolId) return;
    try {
      await api.put(`/inspectie/school/${selectedSchoolId}/standaard/${standaardId}`, {
        status: newStatus,
      });
      setEditingStatus(null);
      await fetchData();
    } catch (err: any) {
      console.error('[InspectieKader] Status wijzigen mislukt:', err?.message);
    }
  }

  async function handleActueelChange(standaardId: string, actueel: boolean) {
    if (!selectedSchoolId) return;
    try {
      await api.put(`/inspectie/school/${selectedSchoolId}/standaard/${standaardId}`, {
        actueel,
      });
      await fetchData();
    } catch (err: any) {
      console.error('[InspectieKader] Actueel wijzigen mislukt:', err?.message);
    }
  }

  if (!selectedSchoolId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <ClipboardCheck className="h-7 w-7 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900">Geen school geselecteerd</p>
        <p className="mt-1 text-sm text-gray-500">Selecteer een school om het inspectiekader te bekijken.</p>
      </div>
    );
  }

  if (loading) return <TableSkeleton rows={8} cols={5} />;

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Inspectiekader</h1>

      {/* AI Compliance Matrix */}
      <ComplianceMatrixView />

      {domeinen.length === 0 && (
        <div className="card px-6 py-12 text-center">
          <Shield className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">Geen domeinen gevonden.</p>
        </div>
      )}

      {domeinen.map((domein) => {
        const standaarden = domein.standaarden ?? [];
        const aantoonbaar = standaarden.filter((s) => s.schoolStatus.status === 'AANTOONBAAR').length;
        const total = standaarden.length;

        return (
          <div key={domein.id} className="card overflow-hidden">
            {/* Domain Header */}
            <button
              onClick={() => toggleDomain(domein.id)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                  <Shield className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-400">{domein.code}</span>
                  <h2 className="text-sm font-semibold text-gray-900">{domein.naam}</h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {aantoonbaar}/{total} aantoonbaar
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    openDomains[domein.id] ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {/* Standards Table */}
            {openDomains[domein.id] && (
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Standaard</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Bewijs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Evaluatie</th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actueel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standaarden.map((standaard) => {
                      const ss = standaard.schoolStatus;
                      return (
                        <tr key={standaard.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50">
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-mono text-gray-500">{standaard.code}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{standaard.naam}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {editingStatus === standaard.id ? (
                              <select
                                value={ss.status}
                                onChange={(e) => handleStatusChange(standaard.id, e.target.value as BewijsStatus)}
                                onBlur={() => setEditingStatus(null)}
                                autoFocus
                                className="input py-1.5 text-xs"
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            ) : (
                              <button onClick={() => setEditingStatus(standaard.id)} className="transition-opacity hover:opacity-80">
                                <StatusBadge status={ss.status} />
                              </button>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {ss.bewijs ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                                <FileCheck className="h-3 w-3" />
                                {ss.bewijs.split(',').length} doc(s)
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Geen</span>
                            )}
                          </td>
                          <td className="max-w-[200px] truncate px-6 py-4 text-sm text-gray-500">
                            {ss.evaluatie || '-'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={ss.actueel}
                              onChange={(e) => handleActueelChange(standaard.id, e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {standaarden.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                          Geen standaarden in dit domein.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
