export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import https from 'https';
import { supabaseServerClient } from '@/lib/supabase-server';
import {
  buildSalesHistoryUrl,
  mapHotmartItem,
  dedupeMappedSales,
  extractPageInfo,
  type MappedHotmartSale,
} from '@/lib/hotmart';

const HOTMART_COMMISSIONS_URL = 'https://developers.hotmart.com/payments/api/v1/sales/commissions';

// ---------------------------------------------------------------------------
// Fetch a single Hotmart URL with the Bearer token, returning raw body string.
// ---------------------------------------------------------------------------
function hotmartGet(token: string, url: string): Promise<{ ok: boolean; status: number; body: string }> {
  const parsed = new URL(url);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ ok: res.statusCode! >= 200 && res.statusCode! < 300, status: res.statusCode!, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Fetch all Hotmart commissions for a date range.
// Returns a map of transaction_id → net_revenue_in_BRL.
// Best-effort: returns empty map on any error so it never breaks the sync.
// ---------------------------------------------------------------------------
async function fetchCommissionsBRL(
  token: string,
  startDateMs: number,
  endDateMs: number,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  let pageToken: string | null = null;

  try {
    do {
      const urlObj = new URL(HOTMART_COMMISSIONS_URL);
      urlObj.searchParams.set('start_date', String(startDateMs));
      urlObj.searchParams.set('end_date', String(endDateMs));
      urlObj.searchParams.set('max_results', '50');
      if (pageToken) urlObj.searchParams.set('page_token', pageToken);

      const resp = await hotmartGet(token, urlObj.toString());
      if (!resp.ok) {
        console.warn('[hotmart-sync] commissions API returned', resp.status, '— skipping net_revenue enrichment');
        break;
      }

      const payload: any = JSON.parse(resp.body);
      const items: any[] = payload.items ?? payload.data ?? [];

      if (items.length > 0) {
        console.log('[hotmart-sync] commissions sample item:', JSON.stringify(items[0]));
      }

      for (const item of items) {
        const txn: string | undefined = item.transaction ?? item.purchase?.transaction;
        if (!txn) continue;

        // Format A: flat item with commission_type / source === 'PRODUCER'
        if (item.commission_type === 'PRODUCER' || item.source === 'PRODUCER') {
          // Try known field names for the BRL payout amount
          const brl = item.converted_value ?? item.value_in_brl ?? item.net ?? item.total ?? null;
          if (brl != null && !map.has(txn)) map.set(txn, Number(brl));
          continue;
        }

        // Format B: item has a commissions array (one row per producer/affiliate)
        if (Array.isArray(item.commissions)) {
          const prod = item.commissions.find((c: any) =>
            c.source === 'PRODUCER' || c.commission_type === 'PRODUCER'
          );
          if (prod) {
            const brl = prod.converted_value ?? prod.value_in_brl ?? prod.net ?? prod.total ?? null;
            if (brl != null && !map.has(txn)) map.set(txn, Number(brl));
          }
        }
      }

      pageToken = payload.page_info?.next_page_token ?? null;
    } while (pageToken);
  } catch (err) {
    console.error('[hotmart-sync] Error fetching commissions:', err);
  }

  console.log(`[hotmart-sync] commissions enrichment: ${map.size} BRL net values fetched`);
  return map;
}

// ---------------------------------------------------------------------------
// Local row type — keeps created_at optional so we can omit it when null
// ---------------------------------------------------------------------------
interface SaleRow {
  transaction_id: string;
  status: string;
  price: number;
  currency: string;
  net_revenue: number | null;
  payment_type: string | null;
  country: string | null;
  hsrc: string | null;
  product_id: string | null;
  product_name: string | null;
  updated_at: string;
  created_at: string | null;
}

interface UtmRow {
  transaction_id: string;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

// ---------------------------------------------------------------------------
// Date validation
// ---------------------------------------------------------------------------
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  try {
    // 1. Parse body defensively — an empty body is valid
    let body: Record<string, unknown> = {};
    try {
      const parsed: unknown = await request.json();
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        body = parsed as Record<string, unknown>;
      }
    } catch {
      // Empty or malformed body — treat as {}
    }

    // 2. Check token — never echo it
    let token = process.env.HOTMART_ACCESS_TOKEN?.trim();
    if (!token) {
      console.warn('Missing HOTMART_ACCESS_TOKEN environment variable.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    // Hotmart expects the token URL-encoded (with %2B, %2F, %3D).
    // Vercel may auto-decode env vars, turning %2B→+ and %3D→=.
    // If the token contains decoded chars (+, /, =) but no %, re-encode it.
    if (!token.includes('%') && (token.includes('+') || token.includes('/') || token.includes('='))) {
      token = encodeURIComponent(token);
    }
    console.log(`[hotmart-sync] Token length: ${token.length}, Starts with: ${token.substring(0, 5)}... Ends with: ...${token.substring(token.length - 5)}`);

    // 3. Validate dates
    const rawStart = typeof body.startDate === 'string' ? body.startDate : undefined;
    const rawEnd = typeof body.endDate === 'string' ? body.endDate : undefined;

    if (rawStart !== undefined && !DATE_RE.test(rawStart)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }
    if (rawEnd !== undefined && !DATE_RE.test(rawEnd)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const endDateMs = Math.min(
      rawEnd ? Date.parse(`${rawEnd}T23:59:59.999Z`) : Date.now(),
      Date.now() // Hotmart rejeita datas futuras com 400
    );
    const startDateMs = rawStart
      ? Date.parse(`${rawStart}T00:00:00.000Z`)
      : endDateMs - 365 * 24 * 60 * 60 * 1000;

    if (!Number.isFinite(endDateMs) || !Number.isFinite(startDateMs) || startDateMs > endDateMs) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // 4. Optional page token
    const pageToken =
      typeof body.pageToken === 'string' && body.pageToken.length > 0
        ? body.pageToken
        : null;

    // 5. Build URL
    const url = buildSalesHistoryUrl({ startDateMs, endDateMs, pageToken, maxResults: 50 });
    console.log(`[hotmart-sync] Fetching URL: ${url}`);

    // 6. Call Hotmart History API (uses shared helper — no extra boilerplate)
    const hotmartResponse = await hotmartGet(token, url);

    // 7. Handle non-ok response
    if (!hotmartResponse.ok) {
      console.error('Hotmart API Error:', hotmartResponse.status, hotmartResponse.body);
      if (hotmartResponse.status === 401 || hotmartResponse.status === 403) {
        return NextResponse.json({ error: 'Hotmart authentication failed', detail: hotmartResponse.body }, { status: 401 });
      }
      return NextResponse.json({ error: 'Failed to fetch from Hotmart', hotmart_status: hotmartResponse.status, detail: hotmartResponse.body }, { status: 502 });
    }

    // 8. Parse JSON
    const payload: unknown = JSON.parse(hotmartResponse.body);
    const payloadRecord: Record<string, unknown> =
      payload !== null && typeof payload === 'object' && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {};

    const itemsRaw: unknown[] = Array.isArray(payloadRecord.items)
      ? payloadRecord.items
      : Array.isArray(payloadRecord.data)
      ? payloadRecord.data
      : [];

    // 9. Map items — drop nulls and count skipped, then dedup
    // Log the first raw item so we can inspect the actual Hotmart API shape in dev logs
    if (itemsRaw.length > 0) {
      console.log('[hotmart-sync] first raw item sample:', JSON.stringify(itemsRaw[0]));
    }

    let skipped = 0;
    const survivors: MappedHotmartSale[] = [];
    for (const item of itemsRaw) {
      const mapped = mapHotmartItem(item);
      if (mapped === null) {
        skipped++;
      } else {
        survivors.push(mapped);
      }
    }
    const mapped = dedupeMappedSales(survivors);

    // 10. Fetch Hotmart commissions to get accurate BRL net_revenue values.
    //     This runs in parallel with the DB fetch below — best-effort, never blocks sync.
    const commissionsBRL = await fetchCommissionsBRL(token, startDateMs, endDateMs);

    // 10b. Fetch existing sales to preserve webhook data and product info.
    const transactionIds = mapped.map(m => m.sale.transaction_id);
    let existingMap = new Map<string, any>();
    if (transactionIds.length > 0) {
      const { data: existingSales } = await supabaseServerClient
        .from('sales')
        .select('transaction_id, net_revenue, product_id, product_name, price, currency')
        .in('transaction_id', transactionIds);
      if (existingSales) {
        existingMap = new Map(existingSales.map(s => [s.transaction_id, s]));
      }
    }

    const updatedAt = new Date().toISOString();
    const saleRows: SaleRow[] = mapped.map((m) => {
      const ext = existingMap.get(m.sale.transaction_id);
      const txId = m.sale.transaction_id;

      // Priority: 1) Hotmart commissions API (BRL amount, most accurate)
      //           2) History API commission field (if present)
      //           3) Existing DB value (from webhook or previous sync)
      let finalNet: number | null = commissionsBRL.get(txId) ?? null;
      if (finalNet === null) finalNet = m.sale.net_revenue;
      if (finalNet === null && ext?.net_revenue !== null && ext?.net_revenue !== undefined) {
        finalNet = ext.net_revenue;
      }

      // Preserve product info if History API is missing it
      let finalProductId = m.sale.product_id;
      if (!finalProductId && ext?.product_id) finalProductId = ext.product_id;
      
      let finalProductName = m.sale.product_name;
      if (!finalProductName && ext?.product_name) finalProductName = ext.product_name;

      return {
        transaction_id: m.sale.transaction_id,
        status: m.sale.status,
        price: m.sale.price,
        currency: m.sale.currency,
        net_revenue: finalNet,
        payment_type: m.sale.payment_type,
        country: m.sale.country,
        hsrc: m.sale.hsrc,
        product_id: finalProductId,
        product_name: finalProductName,
        updated_at: updatedAt,
        created_at: m.sale.created_at,
      };
    });

    if (saleRows.length > 0) {
      const { error: saleError } = await supabaseServerClient
        .from('sales')
        .upsert(saleRows, { onConflict: 'transaction_id' });
      if (saleError) {
        console.error('Error upserting sales:', saleError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
    }

    const utmRows: UtmRow[] = mapped
      .filter((m) => m.utms !== null)
      .map((m) => m.utms as UtmRow);

    if (utmRows.length > 0) {
      const { error: utmError } = await supabaseServerClient
        .from('sale_utms')
        .upsert(utmRows, { onConflict: 'transaction_id' });
      if (utmError) {
        // Log but do not fail — sales are already persisted (mirrors webhook behaviour)
        console.error('Error upserting sale_utms:', utmError);
      }
    }

    // 11. Return pagination info
    const { nextPageToken, totalResults } = extractPageInfo(payload);

    return NextResponse.json(
      {
        success: true,
        count: saleRows.length,
        total: itemsRaw.length,
        skipped,
        nextPageToken,
        totalResults,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Hotmart sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
