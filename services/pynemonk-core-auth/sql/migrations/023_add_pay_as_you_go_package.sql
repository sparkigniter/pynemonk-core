-- Migration: 023_add_pay_as_you_go_package.sql
-- Description: Add the student-centric Pay-As-You-Go (PAYG) pricing tier.

INSERT INTO auth.package (name, slug, description, price_usd, features)
VALUES (
    'Pay-As-You-Go',
    'pay_as_you_go',
    'Perfect for all schools: ₹15 per active student/month. Includes unlimited staff and full module access.',
    0.16,
    '["₹15 ($0.16) per active student / month", "Unlimited staff & teacher accounts", "All platform modules included", "Unlimited storage & parent portals"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_usd = EXCLUDED.price_usd,
    features = EXCLUDED.features;
