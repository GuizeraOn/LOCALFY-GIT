export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing startDate or endDate' }, { status: 400 });
    }

    const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
    const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;

    if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
      console.warn('Missing Facebook environment variables.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Call Facebook Graph API
    const fbUrl = `https://graph.facebook.com/v19.0/act_${FB_AD_ACCOUNT_ID}/insights?time_range={'since':'${startDate}','until':'${endDate}'}&level=campaign&fields=campaign_id,campaign_name,spend,impressions,clicks&time_increment=1&access_token=${FB_ACCESS_TOKEN}`;
    
    const fbResponse = await fetch(fbUrl);
    if (!fbResponse.ok) {
      const errorText = await fbResponse.text();
      console.error('Facebook API Error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch from Facebook' }, { status: 502 });
    }

    const fbData = await fbResponse.json();
    const insights = fbData.data || [];

    let upsertCount = 0;

    // Upsert into Supabase
    for (const item of insights) {
      const { error } = await supabaseServerClient
        .from('ad_spend')
        .upsert({
          date: item.date_start,
          campaign_id: item.campaign_id,
          campaign_name: item.campaign_name,
          spend: Number(item.spend || 0),
          impressions: Number(item.impressions || 0),
          clicks: Number(item.clicks || 0)
        }, {
          onConflict: 'date, campaign_id'
        });

      if (error) {
        console.error(`Error upserting ad_spend for campaign ${item.campaign_id} on ${item.date_start}:`, error);
      } else {
        upsertCount++;
      }
    }

    return NextResponse.json({ success: true, count: upsertCount, total: insights.length }, { status: 200 });

  } catch (error) {
    console.error('Facebook sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
