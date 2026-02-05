-- Add company_address and brand_color to settings table

ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS company_address text,
ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#2563EB';

-- Comment on columns
COMMENT ON COLUMN public.settings.company_address IS 'Physical address of the company for email footers';
COMMENT ON COLUMN public.settings.brand_color IS 'Primary brand color hex code for email styling';
