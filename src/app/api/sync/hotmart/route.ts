export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase-server';

interface HotmartSaleItem {
  transaction: string;
  product: {
    id: number;
    name: string;
  };
  purchase: {
    approved_date: number;
    price: {
      value: number;
    };
    status: string;
  };
  tracking?: {
    source?: string;
    source_sck?: string;
    external_code?: string;
  };
}

interface HotmartHistoryResponse {
  items?: HotmartSaleItem[];
  page_info?: {
    next_page_token?: string;
    results_per_page?: number;
    total_results?: number;
  };
}

export async function POST(request: Request) {
  try {
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing startDate or endDate' }, { status: 400 });
    }

    const HOTMART_ACCESS_TOKEN = process.env.HOTMART_ACCESS_TOKEN;

    if (!HOTMART_ACCESS_TOKEN) {
      console.warn('Missing HOTMART_ACCESS_TOKEN environment variable.');
      return NextResponse.json({ error: 'Server configuration error: HOTMART_ACCESS_TOKEN not set' }, { status: 500 });
    }

    // Convert dates to timestamps in milliseconds
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();

    let totalUpserted = 0;
    let totalFetched = 0;
    let pageToken: string | undefined = undefined;

    // Paginate through results
    do {
      const params = new URLSearchParams({
        start_date: String(startTimestamp),
        end_date: String(endTimestamp),
        max_results: '50',
      });

      if (pageToken) {
        params.set('page_token', pageToken);
      }

      const hotmartUrl = `https://developers.hotmart.com/payments/api/v1/sales/history?${params.toString()}`;

      const hotmartResponse = await fetch(hotmartUrl, {
        headers: {
          Authorization: `Bearer ${HOTMART_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!hotmartResponse.ok) {
        const errorText = await hotmartResponse.text();
        console.error('Hotmart API Error:', errorText);
        return NextResponse.json({ error: 'Failed to fetch from Hotmart API', details: errorText }, { status: 502 });
      }

      const hotmartData: HotmartHistoryResponse = await hotmartResponse.json();
      const items = hotmartData.items || [];

      totalFetched += items.length;

      for (const item of items) {
        const transactionId = item.transaction;
        if (!transactionId) continue;

        const status = item.purchase?.status || 'UNKNOWN';
        const price = item.purchase?.price?.value || 0;
        const approvedDate = item.purchase?.approved_date
          ? new Date(item.purchase.approved_date).toISOString()
          : new Date().toISOString();

        // Upsert sale
        const { error: saleError } = await supabaseServerClient
          .from('sales')
          .upsert(
            {
              transaction_id: transactionId,
              status,
              price: Number(price),
              updated_at: approvedDate,
            },
            { onConflict: 'transaction_id' }
          );

        if (saleError) {
          console.error(`Error upserting sale ${transactionId}:`, saleError);
          continue;
        }

        totalUpserted++;

        // Upsert UTMs from tracking info
        const tracking = item.tracking;
        if (tracking && (tracking.source || tracking.source_sck || tracking.external_code)) {
          const { error: utmError } = await supabaseServerClient
            .from('sale_utms')
            .upsert(
              {
                transaction_id: transactionId,
                utm_source: tracking.source || null,
                utm_campaign: tracking.source_sck || null,
                utm_medium: null,
                utm_content: tracking.external_code || null,
                utm_term: null,
              },
              { onConflict: 'transaction_id' }
            );

          if (utmError) {
            console.error(`Error upserting UTMs for ${transactionId}:`, utmError);
          }
        }
      }

      pageToken = hotmartData.page_info?.next_page_token;
    } while (pageToken);

    return NextResponse.json(
      { success: true, upserted: totalUpserted, fetched: totalFetched },
      { status: 200 }
    );
  } catch (error) {
    console.error('Hotmart sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
