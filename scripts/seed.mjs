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

const draftBills = [
  {
    vendorName: 'Acme Office Supply',
    invoiceNumber: 'DEMO-1001',
    invoiceDate: '2026-05-01',
    dueDate: '2026-05-31',
    amount: '480.00',
    description: 'Office supplies for the operations team.',
    lineItems: [
      {
        categoryName: 'Office supplies',
        description: 'Printer paper and desk supplies',
        amount: '480.00',
      },
    ],
  },
  {
    vendorName: 'Northstar Software',
    invoiceNumber: 'DEMO-1002',
    invoiceDate: '2026-05-04',
    dueDate: '2026-06-03',
    amount: '1250.00',
    description: 'Monthly SaaS subscriptions.',
    lineItems: [
      {
        categoryName: 'Software',
        description: 'Platform subscription',
        amount: '1250.00',
      },
    ],
  },
  {
    vendorName: 'Blue River Consulting',
    invoiceNumber: 'DEMO-1003',
    invoiceDate: '2026-05-12',
    dueDate: '2026-06-11',
    amount: '3200.00',
    description: 'Implementation consulting retainer.',
    lineItems: [
      {
        categoryName: 'Professional services',
        description: 'Process review and implementation support',
        amount: '3200.00',
      },
    ],
  },
];

const [owner] = await sql`
  select id
  from users
  order by created_at asc
  limit 1
`;

if (owner) {
  await sql`
    update users
    set role = 'admin', updated_at = now()
    where id = ${owner.id}
      and not exists (
        select 1
        from users
        where role in ('admin', 'owner', 'ap_clerk')
      )
  `;
}

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

if (owner) {
  await Promise.all(draftBills.map(async (bill) => {
    const [insertedBill] = await sql`
      with vendor_record as (
        select id
        from vendors
        where name = ${bill.vendorName}
        limit 1
      )
      insert into bills (
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
      select
        vendor_record.id,
        ${owner.id},
        'draft',
        ${bill.invoiceNumber},
        ${bill.invoiceDate},
        ${bill.dueDate},
        ${bill.amount},
        'USD',
        ${bill.description}
      from vendor_record
      where not exists (
        select 1
        from bills
        where invoice_number = ${bill.invoiceNumber}
      )
      returning id
    `;

    const [targetBill] = insertedBill
      ? [insertedBill]
      : await sql`
        select id
        from bills
        where invoice_number = ${bill.invoiceNumber}
        limit 1
      `;

    if (targetBill) {
      await Promise.all(bill.lineItems.map((lineItem, index) => sql`
        insert into bill_line_items (
          bill_id,
          description,
          amount,
          category_id,
          sort_order
        )
        select
          ${targetBill.id},
          ${lineItem.description},
          ${lineItem.amount},
          categories.id,
          ${index}
        from categories
        where categories.name = ${lineItem.categoryName}
          and not exists (
            select 1
            from bill_line_items
            where bill_id = ${targetBill.id}
              and sort_order = ${index}
          )
      `));

      await sql`
        insert into bill_activity_log (bill_id, actor_id, action, metadata)
        select
          ${targetBill.id},
          ${owner.id},
          'draft_created',
          jsonb_build_object('source', 'seed', 'lineItemCount', ${bill.lineItems.length})
        where not exists (
          select 1
          from bill_activity_log
          where bill_id = ${targetBill.id}
            and action = 'draft_created'
            and metadata ->> 'source' = 'seed'
        )
      `;
    }
  }));
}

console.log(
  [
    'Seeded demo categories, vendors, and draft bills.',
    owner
      ? `Assigned vendor owner ${owner.id}.`
      : 'No users found; vendors were seeded without owners and bills were skipped.',
  ].join(' '),
);
