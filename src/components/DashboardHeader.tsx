'use client';

import { useState } from 'react';
import { RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface HeaderProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  onSync: () => void;
}

export function DashboardHeader({ startDate, endDate, onDateChange, onSync }: HeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate })
      });
      if (res.ok) {
        onSync(); // Refresh SWR
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const days = parseInt(e.target.value);
    const end = new Date();
    const start = subDays(end, days);
    onDateChange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-zinc-800 pb-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Métricas & Vendas</h1>
        <p className="text-zinc-400">Visão consolidada de lucros e resultados</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300">
          <CalendarIcon className="w-4 h-4 mr-2 text-zinc-400" />
          <select 
            className="bg-transparent outline-none cursor-pointer"
            onChange={handleRangeChange}
            defaultValue="7"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="15">Últimos 15 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>

        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center justify-center bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sync Facebook'}
        </button>
      </div>
    </div>
  );
}
