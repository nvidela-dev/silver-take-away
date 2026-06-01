-- Pagination demo data. The bills workspace is designed around 10-row pages:
-- 60 drafts for six pages, 30 awaiting approval bills for three pages, and
-- 30 payment-workflow bills for three pages. Fixed IDs make this idempotent.
INSERT INTO bills (
  id,
  vendor_id,
  created_by,
  status,
  invoice_number,
  invoice_date,
  due_date,
  amount,
  currency,
  description
)
SELECT
  ('88000000-0000-0000-0000-' || lpad(series::text, 12, '0'))::uuid,
  (
    CASE ((series - 1) % 10) + 1
      WHEN 10 THEN '22000000-0000-0000-0000-00000000000a'
      ELSE '22000000-0000-0000-0000-' || lpad((((series - 1) % 10) + 1)::text, 12, '0')
    END
  )::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  CASE
    WHEN series <= 60 THEN 'draft'::bill_status
    WHEN series <= 90 THEN 'awaiting_approval'::bill_status
    WHEN series <= 100 THEN 'approved'::bill_status
    WHEN series <= 110 THEN 'scheduled'::bill_status
    ELSE 'initiated'::bill_status
  END,
  'PAGE-' || lpad(series::text, 4, '0'),
  DATE '2026-05-01' + ((series - 1) % 28),
  DATE '2026-06-01' + ((series - 1) % 28),
  (100 + series * 17.25)::numeric(12, 2),
  'USD',
  'Pagination demo bill ' || series
FROM generate_series(1, 120) AS series
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint

INSERT INTO bill_line_items (
  id,
  bill_id,
  description,
  amount,
  category_id,
  sort_order
)
SELECT
  ('99000000-0000-0000-0000-' || lpad(series::text, 12, '0'))::uuid,
  ('88000000-0000-0000-0000-' || lpad(series::text, 12, '0'))::uuid,
  'Pagination demo line item ' || series,
  (100 + series * 17.25)::numeric(12, 2),
  categories.id,
  0
FROM generate_series(1, 120) AS series
CROSS JOIN LATERAL (
  SELECT id
  FROM categories
  WHERE name = 'Office supplies'
) AS categories
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint

INSERT INTO payments (
  id,
  bill_id,
  created_by,
  amount,
  payment_method,
  status,
  scheduled_date,
  initiated_date
)
SELECT
  ('aa000000-0000-0000-0000-' || lpad(series::text, 12, '0'))::uuid,
  ('88000000-0000-0000-0000-' || lpad(series::text, 12, '0'))::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  (100 + series * 17.25)::numeric(12, 2),
  'ach'::payment_method_type,
  CASE
    WHEN series <= 110 THEN 'scheduled'::payment_status
    ELSE 'initiated'::payment_status
  END,
  DATE '2026-06-01' + ((series - 1) % 28),
  CASE
    WHEN series > 110 THEN TIMESTAMPTZ '2026-06-01 09:00:00+00' + ((series - 111) * INTERVAL '1 day')
    ELSE NULL
  END
FROM generate_series(91, 120) AS series
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint

INSERT INTO bill_activity_log (
  id,
  bill_id,
  actor_id,
  action,
  metadata
)
SELECT
  ('bb000000-0000-0000-0000-' || lpad(series::text, 12, '0'))::uuid,
  ('88000000-0000-0000-0000-' || lpad(series::text, 12, '0'))::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  CASE
    WHEN series <= 60 THEN 'draft_created'
    WHEN series <= 90 THEN 'submitted'
    WHEN series <= 100 THEN 'approved'
    WHEN series <= 110 THEN 'payment_scheduled'
    ELSE 'payment_initiated'
  END,
  '{"source":"pagination_seed"}'::jsonb
FROM generate_series(1, 120) AS series
ON CONFLICT (id) DO NOTHING;
