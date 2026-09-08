export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase-server';
import { calculateMetrics } from '@/lib/metrics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing startDate or endDate' }, { status: 400 });
    }

    // Fetch Sales with UTMs
    const { data: sales, error: salesError } = await supabaseServerClient
      .from('sales')
      .select('*, sale_utms(*)')
      .gte('created_at', `${startDate}T00:00:00.000Z`)
      .lte('created_at', `${endDate}T23:59:59.999Z`);

    if (salesError) throw salesError;

    // Fetch Ad Spend
    const { data: adSpends, error: adsError } = await supabaseServerClient
      .from('ad_spend')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (adsError) throw adsError;

    // Fetch Expenses
    const { data: expenses, error: expError } = await supabaseServerClient
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (expError) throw expError;

    let rates: Record<string, number> = { BRL: 1 };
    try {
      const erRes = await fetch('https://open.er-api.com/v6/latest/BRL', { next: { revalidate: 3600 } });
      if (erRes.ok) {
        const erData = await erRes.json();
        if (erData && erData.rates) {
          rates = erData.rates;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar taxas de câmbio', e);
    }

    const metrics = calculateMetrics(sales || [], adSpends || [], expenses || [], rates);

    return NextResponse.json(metrics, { status: 200 });

  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
