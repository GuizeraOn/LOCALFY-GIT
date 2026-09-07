import { DollarSign, TrendingUp, HandCoins, Activity, BarChart3, Banknote } from 'lucide-react';

interface MetricCardsProps {
  global: {
    grossRevenue: number;
    netRevenue: number;
    adSpend: number;
    profit: number;
    roas: number;
    roi: number;
  } | null;
}

export function MetricCards({ global }: MetricCardsProps) {
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format((value || 0) / 100);
  };

  const formatRoas = (value: number) => {
    return (value || 0).toFixed(2) + 'x';
  };

  const cards = [
    { title: 'Faturamento Bruto', value: formatMoney(global?.grossRevenue || 0), icon: <Banknote className="w-5 h-5 text-zinc-400" /> },
    { title: 'Faturamento Líquido', value: formatMoney(global?.netRevenue || 0), icon: <HandCoins className="w-5 h-5 text-zinc-400" /> },
    { title: 'Gastos Ads', value: formatMoney(global?.adSpend || 0), icon: <TrendingUp className="w-5 h-5 text-red-400" /> },
    { title: 'Lucro Líquido', value: formatMoney(global?.profit || 0), icon: <DollarSign className="w-5 h-5 text-green-400" />, color: (global?.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500' },
    { title: 'ROAS', value: formatRoas(global?.roas || 0), icon: <Activity className="w-5 h-5 text-blue-400" /> },
    { title: 'ROI', value: formatPercent(global?.roi || 0), icon: <BarChart3 className="w-5 h-5 text-emerald-400" /> },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-zinc-400">{card.title}</span>
            {card.icon}
          </div>
          <div className={`text-2xl font-bold ${card.color || 'text-zinc-100'}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
