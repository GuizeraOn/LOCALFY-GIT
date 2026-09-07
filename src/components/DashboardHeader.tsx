'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { DateRangePicker } from '@/components/DateRangePicker';

interface HeaderProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  onSync: () => void;
}

export function DashboardHeader({ startDate, endDate, onDateChange, onSync }: HeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingHotmart, setIsSyncingHotmart] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate })
      });
      if (res.ok) {
        onSync();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleHotmartSync = async () => {
    setIsSyncingHotmart(true);
    try {
      const res = await fetch('/api/sync/hotmart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate })
      });
      if (res.ok) {
        onSync();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingHotmart(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-zinc-800 pb-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Métricas & Vendas</h1>
        <p className="text-zinc-400 text-sm">Visão consolidada de lucros e resultados</p>
      </div>

      <div className="flex items-center gap-3">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={onDateChange}
        />

        <button
          onClick={handleHotmartSync}
          disabled={isSyncingHotmart}
          className="flex items-center justify-center bg-orange-500 text-white hover:bg-orange-600 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncingHotmart ? 'animate-spin' : ''}`} />
          {isSyncingHotmart ? 'Sincronizando...' : 'Sync Hotmart'}
        </button>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center justify-center bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sync Facebook'}
        </button>
      </div>
    </div>
  );
}
