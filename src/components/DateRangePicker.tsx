'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subWeeks, startOfYear, addMonths, isSameDay, isWithinInterval, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

const PRESETS = [
  { label: 'Hoje', key: 'today' },
  { label: 'Ontem', key: 'yesterday' },
  { label: 'Hoje e ontem', key: 'today_yesterday' },
  { label: 'Últimos 7 dias', key: 'last_7' },
  { label: 'Últimos 14 dias', key: 'last_14' },
  { label: 'Últimos 28 dias', key: 'last_28' },
  { label: 'Últimos 30 dias', key: 'last_30' },
  { label: 'Esta semana', key: 'this_week' },
  { label: 'Semana passada', key: 'last_week' },
  { label: 'Este mês', key: 'this_month' },
  { label: 'Mês passado', key: 'last_month' },
  { label: 'Máximo', key: 'max' },
];

function getPresetDates(key: string): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  switch (key) {
    case 'today': return { start: today, end: today };
    case 'yesterday': { const y = subDays(today, 1); return { start: y, end: y }; }
    case 'today_yesterday': return { start: subDays(today, 1), end: today };
    case 'last_7': return { start: subDays(today, 6), end: today };
    case 'last_14': return { start: subDays(today, 13), end: today };
    case 'last_28': return { start: subDays(today, 27), end: today };
    case 'last_30': return { start: subDays(today, 29), end: today };
    case 'this_week': return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
    case 'last_week': { const lw = subWeeks(today, 1); return { start: startOfWeek(lw, { weekStartsOn: 1 }), end: endOfWeek(lw, { weekStartsOn: 1 }) }; }
    case 'this_month': return { start: startOfMonth(today), end: endOfMonth(today) };
    case 'last_month': { const lm = subMonths(today, 1); return { start: startOfMonth(lm), end: endOfMonth(lm) }; }
    case 'max': return { start: subDays(today, 365), end: today };
    default: return { start: subDays(today, 6), end: today };
  }
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun, adjust to Mon=0
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

interface CalendarMonthProps {
  year: number;
  month: number;
  tempStart: Date | null;
  tempEnd: Date | null;
  hovered: Date | null;
  onDayClick: (d: Date) => void;
  onDayHover: (d: Date) => void;
}

function CalendarMonth({ year, month, tempStart, tempEnd, hovered, onDayClick, onDayHover }: CalendarMonthProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const today = new Date(); today.setHours(0,0,0,0);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push(date);
  }

  const effectiveEnd = tempEnd || hovered;

  return (
    <div className="flex-1 min-w-[220px]">
      <div className="text-center text-sm font-semibold text-zinc-200 mb-3 capitalize">{monthName}</div>
      <div className="grid grid-cols-7 text-center mb-1">
        {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => (
          <div key={d} className="text-[10px] font-medium text-zinc-500 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center">
        {cells.map((date, idx) => {
          if (!date) return <div key={idx} />;

          const isToday = isSameDay(date, today);
          const isStart = tempStart && isSameDay(date, tempStart);
          const isEnd = tempEnd && isSameDay(date, tempEnd);

          let inRange = false;
          if (tempStart && effectiveEnd) {
            const [rangeStart, rangeEnd] = isAfter(tempStart, effectiveEnd)
              ? [effectiveEnd, tempStart]
              : [tempStart, effectiveEnd];
            inRange = isWithinInterval(date, { start: rangeStart, end: rangeEnd });
          }

          const isEdge = isStart || isEnd;

          return (
            <div
              key={idx}
              onClick={() => onDayClick(date)}
              onMouseEnter={() => onDayHover(date)}
              className={[
                'text-xs py-1 cursor-pointer transition-colors select-none',
                inRange && !isEdge ? 'bg-blue-600/20 text-blue-200' : '',
                isEdge ? 'bg-blue-600 text-white rounded-full font-bold' : 'hover:bg-zinc-700 rounded-full',
                isToday && !isEdge ? 'font-bold text-blue-400' : '',
              ].join(' ')}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [tempStart, setTempStart] = useState<Date | null>(startDate ? parseISO(startDate) : null);
  const [tempEnd, setTempEnd] = useState<Date | null>(endDate ? parseISO(endDate) : null);
  const [selecting, setSelecting] = useState<'start' | 'end' | null>(null);
  const [hovered, setHovered] = useState<Date | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>('last_7');

  // Show 2 months: leftMonth and leftMonth+1
  const [leftMonth, setLeftMonth] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() - 1 < 0 ? 11 : d.getMonth() - 1 };
  });

  const rightMonth = (() => {
    if (leftMonth.month === 11) return { year: leftMonth.year + 1, month: 0 };
    return { year: leftMonth.year, month: leftMonth.month + 1 };
  })();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Reset temp values when opening
  const handleOpen = () => {
    setTempStart(startDate ? parseISO(startDate) : null);
    setTempEnd(endDate ? parseISO(endDate) : null);
    setSelecting('start');
    setOpen(true);
  };

  const handlePreset = (key: string) => {
    const { start, end } = getPresetDates(key);
    setTempStart(start);
    setTempEnd(end);
    setActivePreset(key);
    setSelecting(null);
  };

  const handleDayClick = (date: Date) => {
    if (!tempStart || selecting === 'start') {
      setTempStart(date);
      setTempEnd(null);
      setSelecting('end');
      setActivePreset('custom');
    } else {
      if (isBefore(date, tempStart)) {
        setTempStart(date);
        setTempEnd(tempStart);
      } else {
        setTempEnd(date);
      }
      setSelecting(null);
      setActivePreset('custom');
    }
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      const s = isAfter(tempStart, tempEnd) ? tempEnd : tempStart;
      const e = isAfter(tempStart, tempEnd) ? tempStart : tempEnd;
      onChange(format(s, 'yyyy-MM-dd'), format(e, 'yyyy-MM-dd'));
    } else if (tempStart) {
      onChange(format(tempStart, 'yyyy-MM-dd'), format(tempStart, 'yyyy-MM-dd'));
    }
    setOpen(false);
  };

  const prevMonth = () => {
    if (leftMonth.month === 0) setLeftMonth({ year: leftMonth.year - 1, month: 11 });
    else setLeftMonth({ year: leftMonth.year, month: leftMonth.month - 1 });
  };
  const nextMonth = () => {
    if (leftMonth.month === 11) setLeftMonth({ year: leftMonth.year + 1, month: 0 });
    else setLeftMonth({ year: leftMonth.year, month: leftMonth.month + 1 });
  };

  // Format trigger label
  const formatLabel = () => {
    try {
      const s = parseISO(startDate);
      const e = parseISO(endDate);
      if (isSameDay(s, e)) return format(s, "d 'de' MMM 'de' yyyy", { locale: ptBR });
      return `${format(s, "d 'de' MMM", { locale: ptBR })} – ${format(e, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`;
    } catch { return 'Selecionar período'; }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2 text-sm text-zinc-200 transition-colors"
      >
        <CalendarIcon className="w-4 h-4 text-zinc-400" />
        <span>{formatLabel()}</span>
        <ChevronRight className="w-3 h-3 text-zinc-500 rotate-90" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-2 right-0 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex overflow-hidden min-w-[680px]">
          
          {/* Sidebar: presets */}
          <div className="w-44 border-r border-zinc-800 p-3 flex flex-col gap-0.5">
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">Usados recentemente</div>
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => handlePreset(p.key)}
                className={[
                  'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left w-full transition-colors',
                  activePreset === p.key ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-300 hover:bg-zinc-800',
                ].join(' ')}
              >
                <span className={[
                  'w-3 h-3 rounded-full border flex-shrink-0 flex items-center justify-center',
                  activePreset === p.key ? 'border-blue-500 bg-blue-500' : 'border-zinc-600',
                ].join(' ')}>
                  {activePreset === p.key && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                {p.label}
              </button>
            ))}
          </div>

          {/* Right: calendars + footer */}
          <div className="flex flex-col flex-1">
            {/* Calendars row */}
            <div className="flex gap-6 p-4">
              {/* Nav left */}
              <div className="flex items-start pt-1">
                <button onClick={prevMonth} className="p-1 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <CalendarMonth
                year={leftMonth.year}
                month={leftMonth.month}
                tempStart={tempStart}
                tempEnd={tempEnd}
                hovered={selecting === 'end' ? hovered : null}
                onDayClick={handleDayClick}
                onDayHover={setHovered}
              />

              <CalendarMonth
                year={rightMonth.year}
                month={rightMonth.month}
                tempStart={tempStart}
                tempEnd={tempEnd}
                hovered={selecting === 'end' ? hovered : null}
                onDayClick={handleDayClick}
                onDayHover={setHovered}
              />

              {/* Nav right */}
              <div className="flex items-start pt-1">
                <button onClick={nextMonth} className="p-1 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
              <span className="text-[11px] text-zinc-500">Fuso horário das datas: Horário de Brasília</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-1.5 rounded-md text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApply}
                  disabled={!tempStart}
                  className="px-4 py-1.5 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Atualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
