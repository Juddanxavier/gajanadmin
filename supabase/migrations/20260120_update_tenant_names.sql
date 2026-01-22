-- Update tenant names to "India" and "Sri Lanka"

UPDATE tenants 
SET name = 'India' 
WHERE slug = 'india';

UPDATE tenants 
SET name = 'Sri Lanka' 
WHERE slug = 'sri-lanka';

-- Verify the changes
SELECT id, name, slug, country_code 
FROM tenants 
ORDER BY name;
