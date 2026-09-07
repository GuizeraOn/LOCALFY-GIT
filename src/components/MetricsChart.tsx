'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MetricsChartProps {
  global: {
    netRevenue: number;
    adSpend: number;
    profit: number;
  } | null;
}

export function MetricsChart({ global }: MetricsChartProps) {
  if (!global) return <div className="h-[300px] w-full bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />;

  const data = [
    {
      name: 'Resumo Global',
      'Faturamento Líquido': global.netRevenue,
      'Gastos': global.adSpend,
      'Lucro': global.profit,
    }
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm mb-8">
      <h3 className="text-lg font-medium mb-6 text-zinc-100">Visão Geral</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="name" stroke="#a1a1aa" />
            <YAxis stroke="#a1a1aa" />
            <Tooltip 
              cursor={{fill: '#27272a'}}
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#f4f4f5' }}
              itemStyle={{ color: '#f4f4f5' }}
              formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
            />
            <Legend />
            <Bar dataKey="Faturamento Líquido" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
