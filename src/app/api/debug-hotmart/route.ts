export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import https from 'https';

export async function GET() {
  const rawToken = process.env.HOTMART_ACCESS_TOKEN?.trim() || '';
  
  const endDateMs = Date.now();
  const startDateMs = endDateMs - 7 * 24 * 60 * 60 * 1000;
  const path = `/payments/api/v1/sales/history?max_results=1&start_date=${startDateMs}&end_date=${endDateMs}`;
  
  // Test 1: Next.js patched fetch
  let fetchStatus = -1;
  let fetchBody = '';
  try {
    const res = await fetch(`https://developers.hotmart.com${path}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${rawToken}`, Accept: 'application/json' },
    });
    fetchStatus = res.status;
    fetchBody = (await res.text()).substring(0, 200);
  } catch (e: any) {
    fetchBody = e.message;
  }

  // Test 2: Raw Node.js https (bypasses Next.js fetch patching)
  const nativeResult = await new Promise<{ status: number; body: string }>((resolve) => {
    const req = https.request({
      hostname: 'developers.hotmart.com',
      path,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${rawToken}`,
        Accept: 'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, body: data.substring(0, 200) });
      });
    });
    req.on('error', (e) => resolve({ status: -1, body: e.message }));
    req.end();
  });

  return NextResponse.json({
    tokenLength: rawToken.length,
    last5: rawToken.substring(rawToken.length - 5),
    path,
    fetchResult: { status: fetchStatus, body: fetchBody },
    nativeResult,
  });
}
