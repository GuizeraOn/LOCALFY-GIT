export const AD_TAX_PERCENTAGE = parseFloat(process.env.NEXT_PUBLIC_AD_TAX_PERCENTAGE || '0.13');

export function calculateMetrics(
  sales: any[], 
  adSpends: any[], 
  expenses: any[],
  rates: Record<string, number> = { BRL: 1 }
) {
  function getPriceInBRL(sale: any) {
    const price = Number(sale.price) || 0;
    const currency = (sale.currency || 'BRL').toUpperCase();
    let converted = price;

    if (currency !== 'BRL') {
      const rate = rates[currency];
      if (rate && rate > 0) {
        converted = price / rate;
      } else {
        // Se a API de câmbio falhar ou não tiver a moeda, NUNCA some o valor bruto estrangeiro como BRL.
        // Calcula o bruto retroativamente usando o valor líquido (que a Hotmart já entrega em BRL).
        if (sale.net_revenue) {
          converted = Number(sale.net_revenue) / 0.901;
        } else {
          converted = 0; 
        }
      }
    }

    // Safety: se a conversão gerar um valor muito maior que o líquido 
    // (ex: erros cambiais severos, vendas com coprodutor/afiliado onde o Gross seria inflado)
    // O Bruto NUNCA deve ser maior que ~1.5x o valor Líquido do produtor na Hotmart.
    if (sale.net_revenue !== null && sale.net_revenue !== undefined) {
      const netBRL = Number(sale.net_revenue);
      if (netBRL > 0 && converted > netBRL * 1.5) {
        return netBRL / 0.901; 
      }
    }

    return converted;
  }

  function getNetPriceInBRL(sale: any) {
    let net = sale.net_revenue !== null && sale.net_revenue !== undefined
      ? Number(sale.net_revenue)
      : Number(sale.price) * 0.901; // Fallback 9.9% taxa Hotmart

    const currency = sale.currency || 'BRL';
    const rate = rates[currency];
    if (rate && rate > 0) return net / rate;
    return net;
  }

  // ── Global Filters ──────────────────────────────────────────────────────────
  const approvedSales = sales.filter(s => s.status === 'APPROVED' || s.status === 'COMPLETED');
  const pendingSales  = sales.filter(s => s.status === 'BILLET_PRINTED' || s.status === 'WAITING_PAYMENT');
  const refundedSales = sales.filter(s => s.status === 'REFUNDED' || s.status === 'PURCHASE_REFUNDED');
  const chargebackSales = sales.filter(s => s.status === 'CHARGEBACK');

  // ── Revenue ─────────────────────────────────────────────────────────────────
  const grossRevenue = approvedSales.reduce((acc, s) => acc + getPriceInBRL(s), 0);
  const netRevenue   = approvedSales.reduce((acc, s) => acc + getNetPriceInBRL(s), 0);

  // ── Ad Spend ────────────────────────────────────────────────────────────────
  const rawAdSpend  = adSpends.reduce((acc, ad) => acc + Number(ad.spend), 0);
  const totalAdSpend = rawAdSpend * (1 + AD_TAX_PERCENTAGE);
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const profit = netRevenue - totalAdSpend - totalExpenses;
  const roas   = totalAdSpend > 0 ? netRevenue / totalAdSpend : 0;
  const roi    = (totalAdSpend + totalExpenses) > 0 ? (profit / (totalAdSpend + totalExpenses)) * 100 : 0;
  const cpa    = approvedSales.length > 0 ? totalAdSpend / approvedSales.length : 0;
  const margin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0;

  // ── Funnel / Traffic (from FB Ads data) ─────────────────────────────────────
  const clicks            = adSpends.reduce((acc, ad) => acc + Number(ad.clicks || 0), 0);
  const impressions       = adSpends.reduce((acc, ad) => acc + Number(ad.impressions || 0), 0);
  const pageviews         = adSpends.reduce((acc, ad) => acc + Number(ad.pageviews || 0), 0);
  const initiateCheckouts = adSpends.reduce((acc, ad) => acc + Number(ad.initiate_checkouts || 0), 0);
  const vendasIniciadas   = sales.length; // all transactions received
  const vendasAprovadas   = approvedSales.length;

  // ── Business Health ─────────────────────────────────────────────────────────
  const vendasPendentesCount = pendingSales.length;
  const vendasPendentesValue = pendingSales.reduce((acc, s) => acc + getPriceInBRL(s), 0);
  const refundsValue    = refundedSales.reduce((acc, s) => acc + getPriceInBRL(s), 0);
  const refundsCount    = refundedSales.length;
  const chargebacksValue = chargebackSales.reduce((acc, s) => acc + getPriceInBRL(s), 0);
  const chargebacksCount = chargebackSales.length;
  const refundRate      = vendasAprovadas > 0 ? (refundsCount / vendasAprovadas) * 100 : 0;
  const chargebackRate  = vendasAprovadas > 0 ? (chargebacksCount / vendasAprovadas) * 100 : 0;
  const unitsSold       = vendasAprovadas;

  // ── Chart: Sales by Product ─────────────────────────────────────────────────
  const productMap: Record<string, number> = {};
  approvedSales.forEach(s => {
    const name = s.product_name || 'Sem produto';
    productMap[name] = (productMap[name] || 0) + getPriceInBRL(s);
  });
  const salesByProduct = Object.entries(productMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // ── Chart: Sales by Payment Type ────────────────────────────────────────────
  const paymentMap: Record<string, number> = {};
  approvedSales.forEach(s => {
    const pt = s.payment_type || 'Desconhecido';
    paymentMap[pt] = (paymentMap[pt] || 0) + getPriceInBRL(s);
  });
  const salesByPaymentType = Object.entries(paymentMap)
    .map(([name, value]) => ({ name, value }));

  // ── Chart: Approval Rate by Payment Method ──────────────────────────────────
  // Only count statuses that represent a genuine payment attempt
  const PAYMENT_ATTEMPT_STATUSES = new Set([
    'APPROVED', 'COMPLETED', 'REFUSED', 'DECLINED', 'ERROR',
    'BILLET_PRINTED', 'WAITING_PAYMENT', 'DELAYED', 'EXPIRED',
  ]);
  const methodTotal: Record<string, number> = {};
  const methodApproved: Record<string, number> = {};
  sales.forEach(s => {
    if (!PAYMENT_ATTEMPT_STATUSES.has(s.status)) return; // skip refunds/chargebacks/canceled
    const pt = s.payment_type || 'Desconhecido';
    methodTotal[pt] = (methodTotal[pt] || 0) + 1;
    if (s.status === 'APPROVED' || s.status === 'COMPLETED') {
      methodApproved[pt] = (methodApproved[pt] || 0) + 1;
    }
  });
  const approvalRateByMethod = Object.keys(methodTotal).map(method => ({
    name: method,
    total: methodTotal[method],
    approved: methodApproved[method] || 0,
    rate: ((methodApproved[method] || 0) / methodTotal[method]) * 100,
  }));

  // ── Chart: Sales by Country ─────────────────────────────────────────────────
  const countryMap: Record<string, number> = {};
  approvedSales.forEach(s => {
    const c = s.country || 'Desconhecido';
    countryMap[c] = (countryMap[c] || 0) + getPriceInBRL(s);
  });
  const salesByCountry = Object.entries(countryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // ── Chart: Sales by Day of Week ─────────────────────────────────────────────
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dowMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  approvedSales.forEach(s => {
    if (s.created_at) {
      const d = new Date(s.created_at).getDay();
      dowMap[d] = (dowMap[d] || 0) + getPriceInBRL(s);
    }
  });
  const salesByDayOfWeek = daysOfWeek.map((name, i) => ({ name, value: dowMap[i] }));

  // ── Chart: Sales by Hour ────────────────────────────────────────────────────
  const hourMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourMap[h] = 0;
  approvedSales.forEach(s => {
    if (s.created_at) {
      const h = new Date(s.created_at).getHours();
      hourMap[h] = (hourMap[h] || 0) + getPriceInBRL(s);
    }
  });
  const salesByHour = Object.entries(hourMap).map(([h, value]) => ({
    name: `${h.toString().padStart(2, '0')}h`,
    value,
  }));

  // ── Chart: Sales by UTM Source ──────────────────────────────────────────────
  const utmSourceMap: Record<string, number> = {};
  approvedSales.forEach(s => {
    const src = s.sale_utms?.utm_source || 'Orgânico';
    utmSourceMap[src] = (utmSourceMap[src] || 0) + getPriceInBRL(s);
  });
  const salesByUtmSource = Object.entries(utmSourceMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // ── Chart: Cumulative Daily Evolution (Faturamento, Gasto, Lucro) ────────────
  const dailyMap: Record<string, { date: string; grossRevenue: number; netRevenue: number; adSpend: number; profit: number }> = {};
  approvedSales.forEach(s => {
    if (s.created_at) {
      const date = s.created_at.slice(0, 10);
      if (!dailyMap[date]) dailyMap[date] = { date, grossRevenue: 0, netRevenue: 0, adSpend: 0, profit: 0 };
      dailyMap[date].grossRevenue += getPriceInBRL(s);
      dailyMap[date].netRevenue   += getNetPriceInBRL(s);
    }
  });
  adSpends.forEach(ad => {
    const date = ad.date;
    if (!dailyMap[date]) dailyMap[date] = { date, grossRevenue: 0, netRevenue: 0, adSpend: 0, profit: 0 };
    dailyMap[date].adSpend += Number(ad.spend) * (1 + AD_TAX_PERCENTAGE);
  });
  const dailyEvolution = Object.values(dailyMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ ...d, profit: d.netRevenue - d.adSpend }));

  // ── By Campaign ─────────────────────────────────────────────────────────────
  const campaignStats: Record<string, any> = {};
  adSpends.forEach(ad => {
    const cid = ad.campaign_id;
    if (!campaignStats[cid]) {
      campaignStats[cid] = {
        campaign_id: cid,
        campaign_name: ad.campaign_name,
        spend: 0,
        impressions: 0,
        clicks: 0,
        pageviews: 0,
        initiate_checkouts: 0,
        salesCount: 0,
        grossRevenue: 0,
        netRevenue: 0,
      };
    }
    campaignStats[cid].spend              += Number(ad.spend) * (1 + AD_TAX_PERCENTAGE);
    campaignStats[cid].impressions         += Number(ad.impressions);
    campaignStats[cid].clicks              += Number(ad.clicks);
    campaignStats[cid].pageviews           += Number(ad.pageviews || 0);
    campaignStats[cid].initiate_checkouts  += Number(ad.initiate_checkouts || 0);
  });

  approvedSales.forEach(sale => {
    const cid = sale.sale_utms?.utm_campaign;
    if (cid && campaignStats[cid]) {
      campaignStats[cid].salesCount   += 1;
      campaignStats[cid].grossRevenue += getPriceInBRL(sale);
      campaignStats[cid].netRevenue   += getNetPriceInBRL(sale);
    }
  });

  const campaigns = Object.values(campaignStats).map(c => {
    const cNetRevenue = c.netRevenue;
    const cProfit     = cNetRevenue - c.spend;
    const cRoas       = c.spend > 0 ? cNetRevenue / c.spend : 0;
    const cRoi        = c.spend > 0 ? (cProfit / c.spend) * 100 : 0;
    const cCpa        = c.salesCount > 0 ? c.spend / c.salesCount : 0;
    const cMargin     = cNetRevenue > 0 ? (cProfit / cNetRevenue) * 100 : 0;
    return { ...c, netRevenue: cNetRevenue, profit: cProfit, roas: cRoas, roi: cRoi, cpa: cCpa, margin: cMargin };
  });

  return {
    global: {
      // Revenue
      salesCount: vendasAprovadas,
      grossRevenue,
      netRevenue,
      adSpend: totalAdSpend,
      expenses: totalExpenses,
      profit,
      roas,
      roi,
      cpa,
      margin,
      // Funnel
      impressions,
      clicks,
      pageviews,
      initiateCheckouts,
      vendasIniciadas,
      vendasAprovadas,
      // Health
      vendasPendentesCount,
      vendasPendentesValue,
      refundsValue,
      refundsCount,
      refundRate,
      chargebacksValue,
      chargebacksCount,
      chargebackRate,
      unitsSold,
    },
    campaigns,
    charts: {
      salesByProduct,
      salesByPaymentType,
      approvalRateByMethod,
      salesByCountry,
      salesByDayOfWeek,
      salesByHour,
      salesByUtmSource,
      dailyEvolution,
    },
  };
}
