import { useState, useEffect, useMemo } from 'react';
import api from '../../api/client';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
} from 'lucide-react';

interface Dossier {
  id: string;
  naam: string;
  status: string;
  deadline: string | null;
  verantwoordingDeadline?: string | null;
}

interface CalendarEvent {
  date: string;
  naam: string;
  type: 'aanvraag' | 'verantwoording';
  dossierId: string;
  daysUntil: number;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // Monday = 0, Sunday = 6
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function daysUntilDate(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const monthNames = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
];

const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

export function SubsidieKalenderPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetchDossiers();
  }, []);

  async function fetchDossiers() {
    try {
      const res = await api.get('/subsidies/dossiers');
      setDossiers(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error('[SubsidieKalender] Data ophalen mislukt:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];
    dossiers.forEach((d) => {
      if (d.deadline) {
        result.push({
          date: d.deadline.split('T')[0],
          naam: d.naam,
          type: 'aanvraag',
          dossierId: d.id,
          daysUntil: daysUntilDate(d.deadline),
        });
      }
      if (d.verantwoordingDeadline) {
        result.push({
          date: d.verantwoordingDeadline.split('T')[0],
          naam: d.naam,
          type: 'verantwoording',
          dossierId: d.id,
          daysUntil: daysUntilDate(d.verantwoordingDeadline),
        });
      }
    });
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [dossiers]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      const existing = map.get(e.date) ?? [];
      existing.push(e);
      map.set(e.date, existing);
    });
    return map;
  }, [events]);

  const upcomingEvents = useMemo(() => {
    return events.filter((e) => e.daysUntil >= 0).sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  function goToToday() {
    setCurrentYear(new Date().getFullYear());
    setCurrentMonth(new Date().getMonth());
  }

  if (loading) return <DashboardSkeleton />;

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const todayStr = new Date().toISOString().split('T')[0];

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);
  // Fill remaining cells to complete the grid
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Subsidie Kalender</h1>

      {/* Calendar */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">
              {monthNames[currentMonth]} {currentYear}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={goToToday}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Vandaag
            </button>
            <button
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
          {dayNames.map((name) => (
            <div key={name} className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[80px] border-b border-r border-gray-50 bg-gray-50/30" />;
            }
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = eventsByDate.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                className={`min-h-[80px] border-b border-r border-gray-50 p-1.5 ${isToday ? 'bg-blue-50/50' : ''}`}
              >
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday ? 'bg-primary-600 text-white' : 'text-gray-700'
                }`}>
                  {day}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.map((ev, i) => {
                    let dotColor = 'bg-blue-500';
                    if (ev.daysUntil < 14 && ev.daysUntil >= 0) dotColor = 'bg-red-500';
                    else if (ev.type === 'verantwoording') dotColor = 'bg-orange-500';

                    return (
                      <div
                        key={`${ev.dossierId}-${ev.type}-${i}`}
                        className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] text-gray-700 hover:bg-gray-100"
                        title={`${ev.naam} (${ev.type})`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
                        <span className="truncate">{ev.naam}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 border-t border-gray-100 px-6 py-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Aanvraag deadline
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            Verantwoording deadline
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            Urgent (&lt; 14 dagen)
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines List */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Komende Deadlines</h2>
            {upcomingEvents.length > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {upcomingEvents.length}
              </span>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {upcomingEvents.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-400">Geen komende deadlines.</p>
            </div>
          )}
          {upcomingEvents.map((ev, i) => {
            let urgencyClass = 'text-blue-600 bg-blue-50';
            if (ev.daysUntil < 7) urgencyClass = 'text-red-600 bg-red-50';
            else if (ev.daysUntil < 14) urgencyClass = 'text-orange-600 bg-orange-50';

            return (
              <div key={`${ev.dossierId}-${ev.type}-${i}`} className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-gray-50/50">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${urgencyClass.split(' ')[1]}`}>
                  <Calendar className={`h-4 w-4 ${urgencyClass.split(' ')[0]}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{ev.naam}</p>
                  <p className="text-xs text-gray-500">
                    {ev.type === 'aanvraag' ? 'Aanvraag deadline' : 'Verantwoording deadline'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${urgencyClass}`}>
                    {ev.daysUntil === 0 ? 'Vandaag' : `${ev.daysUntil} dagen`}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(ev.date).toLocaleDateString('nl-NL')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
