import { MousePointerClick, Eye, ShoppingCart, CheckCircle, Clock, AlertTriangle, RotateCcw, Package } from 'lucide-react';

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

  const funnelSteps = [
    {
      label: 'Impressões',
      value: fmtNum(global.impressions),
      icon: <Eye className="w-4 h-4 text-zinc-400" />,
      show: global.impressions > 0,
    },
    {
      label: 'Cliques',
      value: fmtNum(global.clicks),
      icon: <MousePointerClick className="w-4 h-4 text-indigo-400" />,
      show: global.clicks > 0,
    },
    {
      label: 'Visitas (Pageviews)',
      value: fmtNum(global.pageviews),
      icon: <Eye className="w-4 h-4 text-blue-400" />,
      show: global.pageviews > 0,
    },
    {
      label: 'Checkouts Iniciados',
      value: fmtNum(global.initiateCheckouts),
      icon: <ShoppingCart className="w-4 h-4 text-yellow-400" />,
      show: global.initiateCheckouts > 0,
    },
    {
      label: 'Vendas Iniciadas',
      value: fmtNum(global.vendasIniciadas),
      icon: <ShoppingCart className="w-4 h-4 text-orange-400" />,
      show: true,
    },
    {
      label: 'Vendas Aprovadas',
      value: fmtNum(global.vendasAprovadas),
      icon: <CheckCircle className="w-4 h-4 text-green-400" />,
      show: true,
    },
    {
      label: 'CPA',
      value: fmt(global.cpa),
      icon: <Package className="w-4 h-4 text-emerald-400" />,
      show: true,
    },
  ];

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

  const visibleFunnel = funnelSteps.filter(s => s.show);

  return (
    <div className="space-y-6 mb-8">
      {/* Funil de Conversão */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">Funil de Conversão</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {visibleFunnel.map((step, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 mb-1">
                {step.icon}
                <span className="text-xs text-zinc-400 leading-tight">{step.label}</span>
              </div>
              <span className="text-xl font-bold text-zinc-100">{step.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Saúde do Negócio */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">Saúde do Negócio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {healthCards.map((card, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 mb-1">
                {card.icon}
                <span className="text-xs text-zinc-400">{card.label}</span>
              </div>
              <span className={`text-xl font-bold ${card.color}`}>{card.value}</span>
              {card.sub && <span className="text-xs text-zinc-500">{card.sub}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
