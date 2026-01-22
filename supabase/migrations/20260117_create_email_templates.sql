-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'shipment_status', 'shipment_delivered', 'shipment_exception'
    subject_template TEXT NOT NULL,
    heading_template TEXT,
    body_template TEXT, -- Can contain placeholders like {{tracking_number}}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, type)
);

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_templates_select ON email_templates 
    FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

CREATE POLICY email_templates_modify ON email_templates 
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
        AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND tenant_id = email_templates.tenant_id AND role = 'admin')
    );

-- Seed default templates for existing tenants (optional, but good practice)
-- This triggers on tenant creation to ensure they have default templates
CREATE OR REPLACE FUNCTION seed_default_email_templates()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO email_templates (tenant_id, type, subject_template, heading_template, body_template)
    VALUES 
    (NEW.id, 'shipment_status', 'Shipment Update: {{status}}', 'Your shipment is {{status}}', 'Your shipment {{tracking_number}} has moved to {{status}}. Check the link below for details.'),
    (NEW.id, 'shipment_delivered', 'Delivered: {{tracking_number}}', 'Package Delivered!', 'Good news! Your package {{tracking_number}} has been delivered.'),
    (NEW.id, 'shipment_exception', 'generated-exception', 'Shipment Exception', 'There is an issue with your shipment {{tracking_number}}. Please contact support.')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to seed templates for new tenants
CREATE TRIGGER on_tenant_created_seed_templates
    AFTER INSERT ON tenants
    FOR EACH ROW
    EXECUTE PROCEDURE seed_default_email_templates();
