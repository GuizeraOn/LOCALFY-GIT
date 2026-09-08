import { Clock, AlertTriangle, RotateCcw, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

interface FunnelHealthProps {
  global: {
    impressions: number;
    clicks: number;
    pageviews: number;
    initiateCheckouts: number;
    vendasIniciadas: number;
    vendasAprovadas: number;
    cpa: number;
    vendasPendentesCount: number;
    vendasPendentesValue: number;
    refundsValue: number;
    refundsCount: number;
    refundRate: number;
    chargebacksValue: number;
    chargebacksCount: number;
    chargebackRate: number;
    unitsSold: number;
  } | null;
}

export function FunnelHealthCards({ global }: FunnelHealthProps) {
  if (!global) return null;

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const fmtNum = (v: number) =>
    new Intl.NumberFormat('pt-BR').format(v || 0);
  const fmtPct = (v: number) => `${(v || 0).toFixed(2)}%`;

  // ── Preparação dos Dados do Funil ──────────────────────────────────────────
  const rawSteps = [
    { label: 'Cliques', value: global.clicks },
    { label: 'Visitas Pág.', value: global.pageviews },
    { label: 'ICs', value: global.initiateCheckouts },
    { label: 'Vendas Inic.', value: global.vendasIniciadas },
    { label: 'Vendas Aprov.', value: global.vendasAprovadas },
  ];

  const maxStepValue = Math.max(...rawSteps.map(s => s.value), 1);
  const baseValue = rawSteps[0].value > 0 ? rawSteps[0].value : 1;

  const funnelData = rawSteps.map((s, i) => {
    // Dropoff é calculado sempre em relação ao primeiro passo (Cliques)
    const pct = s.value > 0 ? (s.value / baseValue) * 100 : 0;
    return {
      name: s.label,
      value: s.value,
      // O "pad" empurra a área colorida para o centro, criando o formato de funil simétrico
      pad: (maxStepValue - s.value) / 2,
      pctLabel: `${pct.toFixed(1)}%`,
    };
  });

  const renderFunnelLabel = (props: any) => {
    const { x, index } = props;
    const d = funnelData[index];
    // Ignora o label se o valor for 0 para não encavalar texto fora do funil
    if (d.value === 0) return null;
    
    return (
      <text 
        x={x} 
        y="50%" // Centraliza perfeitamente no eixo Y do SVG
        fill="#ffffff" 
        textAnchor="middle" 
        dominantBaseline="middle" 
        fontSize={14} 
        fontWeight="bold"
      >
        {d.pctLabel}
      </text>
    );
  };

  // ── Saúde do Negócio ───────────────────────────────────────────────────────
  const healthCards = [
    {
      label: 'Vendas Pendentes',
      value: fmtNum(global.vendasPendentesCount),
      sub: fmt(global.vendasPendentesValue),
      icon: <Clock className="w-4 h-4 text-yellow-400" />,
      color: 'text-yellow-400',
    },
    {
      label: 'Reembolsos',
      value: fmt(global.refundsValue),
      sub: `${fmtNum(global.refundsCount)} vendas · ${fmtPct(global.refundRate)} taxa`,
      icon: <RotateCcw className="w-4 h-4 text-orange-400" />,
      color: 'text-orange-400',
    },
    {
      label: 'Chargebacks',
      value: fmt(global.chargebacksValue),
      sub: `${fmtNum(global.chargebacksCount)} ocorrências · ${fmtPct(global.chargebackRate)} taxa`,
      icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
      color: 'text-red-400',
    },
    {
      label: 'Unidades Vendidas',
      value: fmtNum(global.unitsSold),
      sub: 'vendas aprovadas',
      icon: <Package className="w-4 h-4 text-indigo-400" />,
      color: 'text-indigo-400',
    },
  ];

  return (
    <div className="space-y-6 mb-8 mt-6">
      
      {/* Funil de Conversão e CPA */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">Funil de Conversão (Tráfego & Vendas)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Gráfico do Funil */}
          <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={funnelData} margin={{ top: 20, right: 30, left: 30, bottom: 0 }}>
                {/* Linhas verticais separando as etapas como no print */}
                <CartesianGrid vertical={true} horizontal={false} stroke="#27272a" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 13, fontWeight: 500 }} 
                />
                <YAxis domain={[0, maxStepValue]} hide />
                <Tooltip 
                  cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelStyle={{ color: '#a1a1aa', marginBottom: 4 }}
                  formatter={(val: any, name: any, props: any) => {
                    if (name === 'pad') return []; // Esconde o pad no tooltip
                    const d = funnelData[props.dataKey === 'value' ? props.index : 0];
                    return [fmtNum(val) + ` (${d.pctLabel})`, 'Volume'];
                  }}
                />
                {/* Preenchimento invisível inferior para centralizar a área visível */}
                <Area 
                  type="monotone" 
                  dataKey="pad" 
                  stackId="1" 
                  stroke="none" 
                  fill="transparent" 
                  activeDot={false} 
                  tooltipType="none" 
                />
                {/* Área visível do funil */}
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stackId="1" 
                  stroke="#3b82f6" 
                  fill="url(#colorFunnel)" 
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#1e3a8a', strokeWidth: 2 }}
                >
                  <LabelList content={renderFunnelLabel} />
                </Area>
                
                {/* Gradiente para o funil ficar mais bonito */}
                <defs>
                  <linearGradient id="colorFunnel" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Destaque do CPA */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-zinc-400 text-sm font-medium mb-2 uppercase tracking-wide">Custo por Aquisição</h3>
            <p className="text-4xl font-extrabold text-emerald-400 drop-shadow-sm">{fmt(global.cpa)}</p>
            <p className="text-xs text-zinc-500 mt-3 max-w-[180px]">
              Gasto médio em anúncios para gerar uma Venda Aprovada.
            </p>
          </div>

        </div>
      </div>

      {/* Saúde do Negócio */}
      <div className="pt-4">
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">Saúde do Negócio (Estornos & Fluxo de Caixa)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {healthCards.map((card, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-1.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                {card.icon}
                <span className="text-sm font-medium text-zinc-400">{card.label}</span>
              </div>
              <span className={`text-2xl font-bold ${card.color}`}>{card.value}</span>
              {card.sub && <span className="text-sm text-zinc-500">{card.sub}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
