# Convex migrations

One-off data migrations and seed scripts for local development.

## Seed mock dashboard data

Creates sample clients, invoices, and line items for the signed-in user so the dashboard charts and stats have something to display.

**Prerequisites**

1. Convex dev server running (`npx convex dev`)
2. You have signed into the app at least once (so your Clerk user exists in Convex)

**Find your Clerk user ID**

From the Clerk dashboard, or run in the browser console while signed in:

```js
await window.Clerk?.user?.id
```

**Run the seed**

```bash
npx convex run migrations/seedMockDashboardData:seedMockDashboardData \
  '{"clerkId":"user_REPLACE_ME"}'
```

Re-run safely if data already exists (returns skipped):

```bash
npx convex run migrations/seedMockDashboardData:seedMockDashboardData \
  '{"clerkId":"user_REPLACE_ME","force":true}'
```

Or use the npm script (set `CLERK_ID` first):

```bash
CLERK_ID=user_REPLACE_ME pnpm seed:mock
```

### What gets created

- **2 clients:** Northwind Design Co., Acme Studio
- **7 invoices:** mix of paid, sent, overdue, and draft statuses
- **Line items** for each invoice
- **Settings** updated so the next invoice number starts at `INV-1008`

Issue dates are spread across the last ~7 weeks so the revenue chart populates.
