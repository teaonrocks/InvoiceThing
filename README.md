# InvoiceThing

A modern, full-featured invoice management system for freelancers and small businesses. Built with Next.js 15, Convex, Clerk, and a polished UI powered by Tailwind CSS and Shadcn/UI.

## ✨ Highlights

### Core Features

- 🔐 **Secure Authentication** – Seamless user management via Clerk
- 💼 **Client Management** – Create, edit, and track client records
- 📄 **Invoice Builder** – Structured invoices with line items and expenses
- 📊 **Dashboard** – At-a-glance KPIs for revenue and status tracking
- 📥 **PDF Export** – Generate professional PDFs (with embedded receipts)
- ⚙️ **Flexible Settings** – Configure tax, numbering, and due dates
- 🌓 **Dark Mode** – System-aware theming with persistent preference
- ⚡ **Real-time Sync** – Convex keeps data updated instantly across sessions

### Advanced Features

- 🤖 **Smart Client Creation** – Add clients inline during invoice creation
- 🔎 **Searchable Selector** – Quick combobox search for any client
- 🧾 **Receipt Images** – Attach and preview expense receipts
- 🧮 **Configurable Tax** – Support for 0–100% tax, per user
- 📬 **Email Invoices** – Optional email delivery to clients
- ✅ **Bulk Invoice Actions** – Multi-select invoices to update status, delete, or download PDFs in one go

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 3, Shadcn/UI, clsx, class-variance-authority
- **State & Data**: Convex mutations/queries with end-to-end type safety
- **Auth**: Clerk (JWT template integration for Convex)
- **Forms & Validation**: React Hook Form + Zod
- **PDF Generation**: @react-pdf/renderer
- **Tooling**: pnpm, ESLint, Prettier, TypeScript strict mode

## 📋 Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- [Clerk account](https://clerk.com) for authentication
- [Convex account](https://convex.dev) for database + functions

## 🛠️ Installation & Setup

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd invoicething
pnpm install
```

### 2. Set up Clerk authentication

1. Open the [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application (or reuse an existing one)
3. Enable Email + Password auth
4. Copy the publishable and secret keys

### 3. Initialize Convex

```bash
pnpm convex dev
```

Follow the prompt to create a new Convex project. When complete, copy the deployment URL.

### 4. Configure environment variables

Create `.env.local` in the project root:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
```

### 5. Configure the Clerk JWT template

1. In Clerk, go to **JWT Templates**
2. Create a template named `convex`
3. Add the claim:

   ```json
   {
   	"userId": "{{user.id}}"
   }
   ```

4. Save the template and ensure it is active

### 6. Run the app locally

#### Terminal 1 – Next.js

```bash
pnpm dev
```

#### Terminal 2 – Convex

```bash
pnpm convex dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in with your Clerk user.

## 📁 Project Structure

```text
invoicething/
├── src/
│   ├── app/
│   │   ├── dashboard/            # Revenue + status overview
│   │   ├── clients/              # Client CRUD UI
│   │   ├── invoices/             # Invoice list + detail pages
│   │   │   ├── new/              # Create invoice flow
│   │   │   ├── [id]/             # Invoice read-only view
│   │   │   └── [id]/edit/        # Invoice edit form
│   │   ├── settings/             # User-specific defaults
│   │   ├── sign-in/              # Clerk sign-in page
│   │   └── sign-up/              # Clerk sign-up page
│   ├── components/
│   │   ├── ui/                   # Shadcn/UI primitives
│   │   ├── invoice-pdf.tsx       # PDF renderer template
│   │   ├── invoice-table.tsx     # Invoice list table + bulk actions
│   │   └── providers.tsx         # Top-level providers
│   └── lib/                      # Utilities, helpers, constants
├── convex/                       # Convex backend functions + schema
│   ├── schema.ts                 # Convex data model
│   ├── invoices.ts               # Invoice queries + mutations
│   ├── clients.ts                # Client endpoints
│   ├── files.ts                  # File storage helpers
│   └── users.ts                  # User bootstrap + metadata
├── public/                       # Static assets
├── tailwind.config.ts            # Tailwind configuration
└── README.md                     # Project documentation (this file)
```

## 🗄️ Data Model Overview

### Users

- Mirrors Clerk users
- Tracks user-level settings and metadata

### Clients

- Name, email, billing address, contact person
- Linked one-to-many with invoices

### Invoices

- Invoice number, issue/due dates, status, totals
- Tied to clients, line items, and optional claims
- Supports bulk operations and PDF downloads

### Line Items

- Description, quantity, unit price, total
- Multiple entries per invoice

### Claims / Expenses

- Description, amount, date, optional receipt image
- Calculated totals roll into invoice summary

### Settings

- Invoice prefix, starting number
- Default due date offset and tax rate (0–100%)

## 🎯 Feature Deep Dive

### Dark Mode

- Toggle via navigation switch (light, dark, system)
- Persists using `next-themes`
- Smooth transitions via Tailwind animations

### Tax & Numbering Settings

- Configurable defaults on the Settings page
- Applied to new invoices while preserving existing ones

### Bulk Invoice Actions

- Multi-select rows in the invoice table
- Update status, delete invoices, or download combined PDFs
- Optimistic UI updates with Convex mutations

### Receipt & Expense Tracking

- Upload images up to 5 MB (JPG, PNG, GIF, WebP)
- Inline previews with modal expansion
- Included automatically in generated PDFs

## 📜 Available Scripts

```bash
pnpm dev              # Run Next.js in development mode
pnpm build            # Create a production build
pnpm start            # Serve the production build
pnpm lint             # Run ESLint + TypeScript checks
pnpm convex dev       # Start Convex in dev mode
pnpm convex deploy    # Deploy Convex backend
```

## 🔧 Configuration Notes

### Invoice Settings

- **Invoice Prefix** – Custom text before invoice numbers (e.g. `INV`)
- **Starting Number** – Initial invoice counter value
- **Due Date Offset** – Default days until payment is due
- **Tax Rate** – Default percentage added to invoices (0 disables tax)

### Next.js Image Domains

Add Convex storage domains in `next.config.ts`:

```typescript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "*.convex.cloud",
    },
  ],
}
```

## 🐛 Troubleshooting

### Authentication Issues

- Double-check Clerk keys in `.env.local`
- Ensure the JWT template is named `convex`
- Confirm the `userId` claim is present

### Convex Connection Issues

- Run `pnpm convex dev` in its own terminal
- Verify `NEXT_PUBLIC_CONVEX_URL` matches your deployment
- Make sure your Convex project is deployed if testing production builds

### Image Upload Problems

- File size must be ≤ 5 MB
- Supported MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Check Convex storage quota usage

### PDF Generation Errors

- Ensure all required invoice fields are filled
- Large embedded images can increase render time—consider compressing receipts

## 📚 Helpful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Clerk Documentation](https://clerk.com/docs)
- [Shadcn/UI Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 🚦 Roadmap

### Completed ✅

- [x] User authentication
- [x] Client CRUD
- [x] Invoice creation & editing
- [x] Dashboard metrics
- [x] PDF generation with embedded receipts
- [x] Expense/claims tracking
- [x] Configurable tax & numbering
- [x] Dark mode
- [x] Bulk invoice actions

### Upcoming 🔮

- [ ] Payment tracking
- [ ] Recurring invoices
- [ ] Multi-currency support
- [ ] Reporting & analytics
- [ ] Invoice templates
- [ ] Expense categories
- [ ] Email customization
- [ ] Client portal
- [ ] CSV/Excel exports

## 📄 License

Released under the MIT License. Use it freely for personal or commercial projects.

## 🤝 Contributing

Contributions are welcome! Open an issue or submit a pull request with your improvements.

---

Crafted with ❤️ using Next.js, Convex, and Clerk.
