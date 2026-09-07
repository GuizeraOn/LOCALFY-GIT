-- Create sales table
CREATE TABLE public.sales (
    transaction_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale_utms table (references sales)
CREATE TABLE public.sale_utms (
    transaction_id TEXT PRIMARY KEY REFERENCES public.sales(transaction_id) ON DELETE CASCADE,
    utm_source TEXT,
    utm_campaign TEXT,
    utm_medium TEXT,
    utm_content TEXT,
    utm_term TEXT
);

-- Create ad_spend table
CREATE TABLE public.ad_spend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    campaign_id TEXT NOT NULL,
    campaign_name TEXT NOT NULL,
    spend NUMERIC NOT NULL,
    impressions INTEGER NOT NULL,
    clicks INTEGER NOT NULL
);

-- Add updated_at trigger for sales
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_modtime
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
