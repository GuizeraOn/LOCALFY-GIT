export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase-server';

// Hotmart webhook payload typically contains data in specific formats, 
// here we handle the main ones required by the plan.
export async function POST(request: Request) {
  try {
    const htoken = request.headers.get('x-hotmart-hottok');
    const expectedToken = process.env.HOTMART_WEBHOOK_TOKEN;

    if (expectedToken && htoken !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();

    // Hotmart new webhook format: { event, data: { purchase: { transaction, status, payment, ... } } }
    // Also handle legacy flat payloads.
    const purchaseData = payload.data?.purchase ?? payload.purchase ?? payload;

    const transaction = 
      purchaseData?.transaction ??
      payload.data?.transaction ??
      payload.transaction;

    // Prefer the explicit status inside purchase data; fall back to event name normalization
    const rawStatus: string = (
      purchaseData?.status ??
      payload.data?.status ??
      payload.status ??
      payload.event ??
      'UNKNOWN'
    ).toUpperCase();

    // Map Hotmart event names → clean internal status values
    const STATUS_MAP: Record<string, string> = {
      PURCHASE_APPROVED:  'APPROVED',
      PURCHASE_COMPLETE:  'COMPLETED',
      PURCHASE_COMPLETED: 'COMPLETED',
      PURCHASE_CANCELED:  'CANCELED',
      PURCHASE_CANCELLED: 'CANCELED',
      PURCHASE_REFUNDED:  'REFUNDED',
      PURCHASE_REFUSED:   'REFUSED',
      PURCHASE_DELAYED:   'DELAYED',
      PURCHASE_EXPIRED:   'EXPIRED',
      PURCHASE_PROTEST:   'CHARGEBACK',
      PURCHASE_CHARGEBACK:'CHARGEBACK',
      BILLET_PRINTED:     'BILLET_PRINTED',
      WAITING_PAYMENT:    'WAITING_PAYMENT',
    };
    const status = STATUS_MAP[rawStatus] ?? rawStatus;

    const price = purchaseData?.price?.value ?? payload.data?.price ?? payload.price ?? 0;
    const currency = purchaseData?.price?.currency_code ?? payload.data?.currency ?? payload.currency ?? 'BRL';
    const payment_type = purchaseData?.payment?.type ?? payload.data?.payment?.type ?? payload.payment_type ?? null;
    const country = purchaseData?.buyer?.country?.iso ?? payload.data?.buyer?.country?.iso ?? payload.buyer_country ?? null;
    const hsrc = purchaseData?.sck ?? purchaseData?.src ?? payload.sck ?? payload.src ?? null;
    const product_id = String(payload.data?.product?.id ?? payload.product?.id ?? payload.product?.ucode ?? payload.product_id ?? '');
    const product_name = payload.data?.product?.name ?? payload.product?.name ?? payload.product_name ?? null;
    
    let netRevenue: number | null = null;
    const commissions = payload.commissions || payload.data?.commissions || payload.purchase?.commissions;
    if (Array.isArray(commissions)) {
      const prodCommission = commissions.find((c: any) => c.source === 'PRODUCER');
      if (prodCommission && prodCommission.value !== undefined) {
        netRevenue = Number(prodCommission.value);
      }
    }
    if (netRevenue === null) {
      const fee = payload.hotmart_fee || payload.data?.hotmart_fee;
      if (fee?.total !== undefined) {
        netRevenue = Number(price) - Number(fee.total);
      }
    }
    
    // UTMs
    const utm_source = payload.utm_source || payload.data?.utm_source || null;
    const utm_campaign = payload.utm_campaign || payload.data?.utm_campaign || null;
    const utm_medium = payload.utm_medium || payload.data?.utm_medium || null;
    const utm_content = payload.utm_content || payload.data?.utm_content || null;
    const utm_term = payload.utm_term || payload.data?.utm_term || null;

    if (!transaction) {
      // If no transaction ID, we can't do upsert idempotency, but we return 200 so hotmart stops retrying
      console.warn('Webhook received without transaction id', payload);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 1. Upsert Sale
    const { error: saleError } = await supabaseServerClient
      .from('sales')
      .upsert({
        transaction_id: transaction,
        status: status || 'UNKNOWN',
        price: Number(price),
        currency,
        net_revenue: netRevenue,
        payment_type,
        country,
        hsrc,
        product_id: product_id ? product_id : null,
        product_name,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'transaction_id'
      });

    if (saleError) {
      console.error('Error upserting sale:', saleError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 2. Upsert UTMs
    // D-01: UTMs in separate table
    // D-02: utm_campaign contains the name
    if (utm_source || utm_campaign || utm_medium || utm_content || utm_term) {
      const { error: utmError } = await supabaseServerClient
        .from('sale_utms')
        .upsert({
          transaction_id: transaction,
          utm_source,
          utm_campaign,
          utm_medium,
          utm_content,
          utm_term
        }, {
          onConflict: 'transaction_id'
        });

      if (utmError) {
        console.error('Error upserting UTMs:', utmError);
        // We still return 200 because the main sale was recorded.
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
