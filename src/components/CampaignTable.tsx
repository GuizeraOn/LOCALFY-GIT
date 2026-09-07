interface CampaignTableProps {
  campaigns: any[] | null;
}

export function CampaignTable({ campaigns }: CampaignTableProps) {
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatRoas = (value: number) => {
    return (value || 0).toFixed(2) + 'x';
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-zinc-800">
        <h3 className="text-lg font-medium text-zinc-100">Desempenho por Campanha</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/50">
            <tr>
              <th className="px-6 py-4 font-medium">Campanha</th>
              <th className="px-6 py-4 font-medium">Gastos</th>
              <th className="px-6 py-4 font-medium">Vendas</th>
              <th className="px-6 py-4 font-medium">Rec. Líquida</th>
              <th className="px-6 py-4 font-medium">Lucro</th>
              <th className="px-6 py-4 font-medium">ROAS</th>
              <th className="px-6 py-4 font-medium">CPA</th>
            </tr>
          </thead>
          <tbody>
            {!campaigns && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-zinc-500 animate-pulse">Carregando dados...</td>
              </tr>
            )}
            {campaigns && campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">Nenhuma campanha encontrada no período.</td>
              </tr>
            )}
            {campaigns && campaigns.sort((a, b) => b.profit - a.profit).map((c, idx) => (
              <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-200">{c.campaign_name || c.campaign_id}</td>
                <td className="px-6 py-4 text-red-400">{formatMoney(c.spend)}</td>
                <td className="px-6 py-4">{c.salesCount}</td>
                <td className="px-6 py-4">{formatMoney(c.netRevenue)}</td>
                <td className={`px-6 py-4 font-medium ${c.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatMoney(c.profit)}
                </td>
                <td className="px-6 py-4">{formatRoas(c.roas)}</td>
                <td className="px-6 py-4">{formatMoney(c.cpa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
