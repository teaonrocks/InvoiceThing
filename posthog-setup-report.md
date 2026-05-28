<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into InvoiceThing. The project already had a solid foundation — `posthog-js` and `posthog-node` were installed, `PostHogProvider` was configured in `__root.tsx`, user identification was in place via `use-store-user.ts`, and 11 events were already being captured across invoice, client, expense, and settings flows. The wizard audited every business-critical flow, found four gaps in the invoices and clients list pages, filled them, confirmed environment variable values, and built a fresh dashboard with 5 insights.

**Environment variables**: `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` confirmed and set in `.env`.

**User identification**: `posthog.identify()` is called in `src/hooks/use-store-user.ts` whenever Clerk syncs a user to Convex, linking PostHog events to the authenticated Clerk user ID with email and name as person properties.

**New events added this session**: `invoice_status_updated` (from invoices list), `invoice_bulk_status_updated`, `invoice_bulk_deleted`, `client_deleted` (from clients list).

## Events

| Event | Description | File |
|---|---|---|
| `invoice_created` | Invoice successfully created | `src/app/invoices/new.tsx` |
| `invoice_updated` | Invoice edits saved | `src/app/invoices_/$id/edit.tsx` |
| `invoice_viewed` | Invoice detail page loaded | `src/app/invoices/$id.tsx` |
| `invoice_status_updated` | Invoice status changed from detail page | `src/app/invoices/$id.tsx` |
| `invoice_status_updated` | Invoice status changed from list page (`source: invoices_list`) — **added** | `src/app/invoices/index.tsx` |
| `invoice_bulk_status_updated` | Multiple invoices bulk-updated to a new status — **added** | `src/app/invoices/index.tsx` |
| `invoice_bulk_deleted` | Multiple invoices bulk-deleted — **added** | `src/app/invoices/index.tsx` |
| `invoice_deleted` | Single invoice deleted | `src/app/invoices/$id.tsx` |
| `invoice_pdf_downloaded` | Invoice PDF generated and downloaded | `src/components/download-invoice-pdf.tsx` |
| `client_created` | New client created (from clients page or new-invoice modal) | `src/app/clients/index.tsx`, `src/app/invoices/new.tsx` |
| `client_updated` | Client details edited and saved | `src/app/clients/$id.tsx` |
| `client_deleted` | Client deleted from detail page | `src/app/clients/$id.tsx` |
| `client_deleted` | Client deleted from clients list (`source: clients_list`) — **added** | `src/app/clients/index.tsx` |
| `expense_added` | Reimbursable expense/receipt added to an invoice | `src/components/quick-receipt-sheet.tsx` |
| `settings_saved` | Invoice and branding settings saved | `src/app/settings/index.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1640878)
- [Invoices created over time](/insights/hQ88Z5eZ)
- [Invoice PDF downloads](/insights/ekUU1wMp)
- [Invoice status changes](/insights/0mdO9XeX)
- [Client growth](/insights/J4fwotER)
- [Expense receipts added](/insights/IFdU8q7O)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-tanstack-start/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
