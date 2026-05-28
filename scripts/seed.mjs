import { neon } from '@neondatabase/serverless';

/* eslint-disable no-console */

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required to seed demo data.');
  throw new Error('DATABASE_URL is required to seed demo data.');
}

const sql = neon(databaseUrl);

const categories = [
  'Software',
  'Office supplies',
  'Professional services',
  'Travel',
  'Utilities',
];

const vendors = [
  { name: 'Acme Office Supply', email: 'billing@acme.example' },
  { name: 'Northstar Software', email: 'ap@northstar.example' },
  { name: 'Blue River Consulting', email: 'invoices@blueriver.example' },
];

const [owner] = await sql`
  select id
  from users
  order by created_at asc
  limit 1
`;

await Promise.all(categories.map((name) => sql`
    insert into categories (name)
    values (${name})
    on conflict (name) do nothing
  `));

await Promise.all(vendors.map((vendor) => sql`
    insert into vendors (name, email, owner_id)
    select ${vendor.name}, ${vendor.email}, ${owner?.id ?? null}
    where not exists (
      select 1
      from vendors
      where name = ${vendor.name}
    )
  `));

console.log(
  [
    'Seeded demo categories and vendors.',
    owner
      ? `Assigned vendor owner ${owner.id}.`
      : 'No users found; vendors were seeded without owners.',
  ].join(' '),
);
