-- Add missing columns to profiles table to support extended profile information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Verify columns are added
COMMENT ON COLUMN public.profiles.company IS 'User company name';
COMMENT ON COLUMN public.profiles.address IS 'User street address';
COMMENT ON COLUMN public.profiles.city IS 'User city';
COMMENT ON COLUMN public.profiles.country IS 'User country';
