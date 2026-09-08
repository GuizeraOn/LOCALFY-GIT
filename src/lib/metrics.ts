export const AD_TAX_PERCENTAGE = parseFloat(process.env.NEXT_PUBLIC_AD_TAX_PERCENTAGE || '0.13');

export function calculateMetrics(
  sales: any[], 
  adSpends: any[], 
  expenses: any[],
  rates: Record<string, number> = { BRL: 1 }
) {
  function getPriceInBRL(sale: any) {
    const price = Number(sale.price);
    const currency = sale.currency || 'BRL';
    const rate = rates[currency];
    if (rate && rate > 0) {
      return price / rate;
    }
    return price;
  }

  // Global Metrics
  const approvedSales = sales.filter(s => s.status === 'APPROVED' || s.status === 'COMPLETED');
  
  const grossRevenue = approvedSales.reduce((acc, sale) => acc + getPriceInBRL(sale), 0);
  const netRevenue = grossRevenue; // Sem desconto da Hotmart assumido aqui
  
  // O gasto total em ads recebe o imposto (ex: 13%)
  const rawAdSpend = adSpends.reduce((acc, ad) => acc + Number(ad.spend), 0);
  const totalAdSpend = rawAdSpend * (1 + AD_TAX_PERCENTAGE);
  
  const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
  
  const profit = netRevenue - totalAdSpend - totalExpenses;
  const roas = totalAdSpend > 0 ? netRevenue / totalAdSpend : 0;
  const roi = (totalAdSpend + totalExpenses) > 0 ? (profit / (totalAdSpend + totalExpenses)) * 100 : 0;
  const cpa = approvedSales.length > 0 ? totalAdSpend / approvedSales.length : 0;
  const margin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0;

  // By Campaign (Ignoring organic sales without UTM and global expenses)
  const campaignStats: Record<string, any> = {};

  // Group ad spend by campaign
  adSpends.forEach(ad => {
    const cid = ad.campaign_id;
    if (!campaignStats[cid]) {
      campaignStats[cid] = {
        campaign_id: cid,
        campaign_name: ad.campaign_name,
        spend: 0,
        impressions: 0,
        clicks: 0,
        salesCount: 0,
        grossRevenue: 0,
      };
    }
    // Aplica o imposto no gasto da campanha também
    campaignStats[cid].spend += Number(ad.spend) * (1 + AD_TAX_PERCENTAGE);
    campaignStats[cid].impressions += Number(ad.impressions);
    campaignStats[cid].clicks += Number(ad.clicks);
  });

  // Group tracked sales by campaign
  approvedSales.forEach(sale => {
    const cid = sale.sale_utms?.utm_campaign;
    if (cid && campaignStats[cid]) {
      campaignStats[cid].salesCount += 1;
      campaignStats[cid].grossRevenue += getPriceInBRL(sale);
    }
  });

  // Calculate campaign metrics
  const campaigns = Object.values(campaignStats).map(c => {
    const cNetRevenue = c.grossRevenue;
    const cProfit = cNetRevenue - c.spend;
    const cRoas = c.spend > 0 ? cNetRevenue / c.spend : 0;
    const cRoi = c.spend > 0 ? (cProfit / c.spend) * 100 : 0;
    const cCpa = c.salesCount > 0 ? c.spend / c.salesCount : 0;
    const cMargin = cNetRevenue > 0 ? (cProfit / cNetRevenue) * 100 : 0;

    return {
      ...c,
      netRevenue: cNetRevenue,
      profit: cProfit,
      roas: cRoas,
      roi: cRoi,
      cpa: cCpa,
      margin: cMargin
    };
  });

  return {
    global: {
      salesCount: approvedSales.length,
      grossRevenue,
      netRevenue,
      adSpend: totalAdSpend,
      expenses: totalExpenses,
      profit,
      roas,
      roi,
      cpa,
      margin
    },
    campaigns
  };
}
