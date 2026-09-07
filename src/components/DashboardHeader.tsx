'use client';

import { useState } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { DateRangePicker } from '@/components/DateRangePicker';

const MAX_IMPORT_PAGES = 200;

interface HeaderProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  onSync: () => void;
}

export function DashboardHeader({ startDate, endDate, onDateChange, onSync }: HeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [importTotal, setImportTotal] = useState<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDone, setImportDone] = useState(false);

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

  const handleImportHistory = async () => {
    if (isImporting) return;
    if (!startDate || !endDate) return;

    setIsImporting(true);
    setImportError(null);
    setImportedCount(0);
    setImportTotal(null);
    setImportDone(false);

    let pageToken: string | null = null;
    let imported = 0;

    try {
      for (let i = 0; i < MAX_IMPORT_PAGES; i++) {
        const res = await fetch('/api/sync/hotmart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate, endDate, pageToken })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = (errData as { error?: string }).error;
          setImportError(errMsg ?? 'Falha ao importar histórico da Hotmart');
          break;
        }

        const data = await res.json() as {
          success: boolean;
          count: number;
          total: number;
          skipped: number;
          nextPageToken: string | null;
          totalResults: number | null;
        };

        imported += data.count ?? 0;
        setImportedCount(imported);

        if (typeof data.totalResults === 'number') {
          setImportTotal(data.totalResults);
        }

        pageToken = data.nextPageToken ?? null;
        if (pageToken === null) {
          break;
        }
      }
    } catch (e) {
      console.error(e);
      setImportError('Erro de rede ao importar histórico');
    } finally {
      setIsImporting(false);
      setImportDone(true);
      onSync();
    }
  };

  const progressPercent =
    typeof importTotal === 'number' && importTotal > 0
      ? Math.min(100, Math.round((importedCount / importTotal) * 100))
      : 100;

  return (
    <div className="mb-8 border-b border-zinc-800 pb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Métricas &amp; Vendas</h1>
          <p className="text-zinc-400 text-sm">Visão consolidada de lucros e resultados</p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={onDateChange}
          />

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center justify-center bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sync Facebook'}
          </button>

          <button
            onClick={handleImportHistory}
            disabled={isImporting}
            className="flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-500 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          >
            <Download className={`w-4 h-4 mr-2 ${isImporting ? 'animate-pulse' : ''}`} />
            {isImporting
              ? `Importando... ${importedCount}${typeof importTotal === 'number' ? `/${importTotal}` : ''}`
              : 'Importar Histórico'}
          </button>
        </div>
      </div>

      {isImporting && (
        <div className="mt-3">
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-emerald-500 transition-all duration-300${typeof importTotal !== 'number' ? ' animate-pulse' : ''}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Importando vendas da Hotmart...{typeof importTotal === 'number' ? ` ${importedCount}/${importTotal}` : ''}
          </p>
        </div>
      )}

      {!isImporting && importError !== null && (
        <p className="text-xs text-red-400 mt-2">{importError}</p>
      )}

      {!isImporting && importError === null && importDone && (
        <p className="text-xs text-emerald-400 mt-2">
          Importação concluída: {importedCount} vendas
        </p>
      )}
    </div>
  );
}
