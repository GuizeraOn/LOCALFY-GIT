export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  const rawToken = process.env.HOTMART_ACCESS_TOKEN?.trim() || '';
  
  // Info about the raw token from env
  const hasPercent = rawToken.includes('%');
  const hasPlus = rawToken.includes('+');
  const hasEquals = rawToken.includes('=');
  const last10 = rawToken.substring(rawToken.length - 10);
  
  // Test: send the token exactly as-is to Hotmart with a simple 1-result query
  const endDateMs = Date.now();
  const startDateMs = endDateMs - 7 * 24 * 60 * 60 * 1000;
  const url = `https://developers.hotmart.com/payments/api/v1/sales/history?max_results=1&start_date=${startDateMs}&end_date=${endDateMs}`;
  
  const res = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${rawToken}`,
      Accept: 'application/json',
    },
  });

  const body = await res.text();

  return NextResponse.json({
    tokenLength: rawToken.length,
    hasPercent,
    hasPlus,
    hasEquals,
    last10,
    hotmartStatus: res.status,
    hotmartBody: body.substring(0, 300),
    urlSent: url,
  });
}
