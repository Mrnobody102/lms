-- Delete old tenant if exists
DELETE FROM "Tenant" WHERE slug = 'test-center';

-- Create Test Tenant with proper UUID
INSERT INTO "Tenant" (id, name, slug, settings) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Test Learning Center', 'test-center', '{}');

-- Verify
SELECT id, name, slug FROM "Tenant" WHERE slug = 'test-center';
