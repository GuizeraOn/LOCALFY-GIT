'use client';

import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);
const fmtShort = (v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : fmt(v);

interface ChartSectionProps {
  charts: {
    salesByProduct?: { name: string; value: number }[];
    salesByPaymentType?: { name: string; value: number }[];
    salesByCountry?: { name: string; value: number }[];
    salesByDayOfWeek?: { name: string; value: number }[];
    salesByHour?: { name: string; value: number }[];
    salesByUtmSource?: { name: string; value: number }[];
    dailyEvolution?: { date: string; grossRevenue: number; netRevenue: number; adSpend: number; profit: number }[];
    approvalRateByMethod?: { name: string; total: number; approved: number; rate: number }[];
  } | null;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-zinc-200 mb-4">{children}</h2>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-sm font-medium text-zinc-400 mb-4">{title}</p>
      {children}
    </div>
  );
}

export function AdvancedCharts({ charts }: ChartSectionProps) {
  if (!charts) return null;

  const {
    salesByProduct = [],
    salesByPaymentType = [],
    salesByCountry = [],
    salesByDayOfWeek = [],
    salesByHour = [],
    salesByUtmSource = [],
    dailyEvolution = [],
    approvalRateByMethod = [],
  } = charts;

  return (
    <div className="space-y-8">

      {/* ── Evolução Diária ──────────────────────────────────────────────── */}
      {dailyEvolution.length > 0 && (
        <div>
          <SectionTitle>Evolução Diária</SectionTitle>
          <ChartCard title="Faturamento, Investimento e Lucro ao Longo do Período">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={fmtShort} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(v: any) => fmt(v)}
                />
                <Legend />
                <Line type="monotone" dataKey="grossRevenue" name="Fat. Bruto" stroke="#6366f1" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="netRevenue" name="Fat. Líquido" stroke="#10b981" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="adSpend" name="Investimento" stroke="#ef4444" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="profit" name="Lucro" stroke="#f59e0b" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ── Breakdown Row ────────────────────────────────────────────────── */}
      <div>
        <SectionTitle>Análise por Segmento</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Tipo de Pagamento — Pie */}
          {salesByPaymentType.length > 0 && (
            <ChartCard title="Faturamento por Tipo de Pagamento">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={salesByPaymentType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(props: any) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {salesByPaymentType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} formatter={(v: any) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* UTM Source — Bar */}
          {salesByUtmSource.length > 0 && (
            <ChartCard title="Faturamento por Origem (UTM Source)">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salesByUtmSource} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={fmtShort} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} formatter={(v: any) => fmt(v)} />
                  <Bar dataKey="value" name="Faturamento" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Produto — Bar */}
          {salesByProduct.length > 0 && (
            <ChartCard title="Faturamento por Produto">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salesByProduct.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={fmtShort} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} width={110} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} formatter={(v: any) => fmt(v)} />
                  <Bar dataKey="value" name="Faturamento" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* País — Bar */}
          {salesByCountry.length > 0 && (
            <ChartCard title="Faturamento por País">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salesByCountry.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={fmtShort} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} width={60} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} formatter={(v: any) => fmt(v)} />
                  <Bar dataKey="value" name="Faturamento" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      </div>

      {/* ── Horários ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {salesByDayOfWeek.some(d => d.value > 0) && (
          <ChartCard title="Faturamento por Dia da Semana">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesByDayOfWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={fmtShort} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} formatter={(v: any) => fmt(v)} />
                <Bar dataKey="value" name="Faturamento" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {salesByHour.some(h => h.value > 0) && (
          <ChartCard title="Faturamento por Hora do Dia">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} interval={2} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={fmtShort} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} formatter={(v: any) => fmt(v)} />
                <Bar dataKey="value" name="Faturamento" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* ── Taxa de Aprovação por Método ──────────────────────────────────── */}
      {approvalRateByMethod.length > 0 && (
        <div>
          <SectionTitle>Taxa de Aprovação por Método de Pagamento</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {approvalRateByMethod.map((m, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-sm text-zinc-400 mb-1">{m.name}</p>
                <p className="text-2xl font-bold text-zinc-100">{m.rate.toFixed(1)}%</p>
                <p className="text-xs text-zinc-500 mt-1">{m.approved} de {m.total} pedidos</p>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(m.rate, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
