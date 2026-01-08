-- Add users.update permission
INSERT INTO public.permissions (name, description, resource, action)
VALUES ('users.update', 'Ability to update users', 'users', 'update')
ON CONFLICT (name) DO NOTHING;

-- Grant users.update to admin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin' AND p.name = 'users.update'
ON CONFLICT DO NOTHING;

-- Grant users.update to staff role? (Usually staff can't edit others, but maybe themselves via different logic. For now, only admin)
