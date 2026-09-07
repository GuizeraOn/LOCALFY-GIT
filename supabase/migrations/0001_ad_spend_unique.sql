-- Add unique constraint for idempotency
ALTER TABLE public.ad_spend 
ADD CONSTRAINT ad_spend_date_campaign_id_key UNIQUE (date, campaign_id);
