# InvoiceThing

A modern, full-featured invoice management system for freelancers and small businesses. Built with TanStack Start, Convex, Clerk, and a polished UI powered by Tailwind CSS v4 and Shadcn/UI.

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

- **Frontend**: TanStack Start + TanStack Router + React 19 + TypeScript
- **Bundler**: Vite 7
- **Styling**: Tailwind CSS v4, Shadcn/UI, clsx, class-variance-authority
- **State & Data**: Convex mutations/queries with end-to-end type safety
- **Auth**: Clerk (JWT template integration for Convex)
- **Forms & Validation**: React Hook Form + Zod
- **PDF Generation**: @react-pdf/renderer
- **Routing**: TanStack Router (file-based routing)
- **Tooling**: pnpm, ESLint, TypeScript strict mode

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

Create `.env` in the project root:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
# Note: Clerk secret key is not needed for client-side usage

# Convex Backend
VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
```

**Note**: TanStack Start uses Vite, which requires the `VITE_` prefix for environment variables. The app also supports `NEXT_PUBLIC_` prefix for backwards compatibility.

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

#### Terminal 1 – TanStack Start (Vite)

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
│   ├── app/                        # TanStack Router file-based routes
│   │   ├── __root.tsx              # Root layout route
│   │   ├── index.tsx               # Home page (/)
│   │   ├── dashboard/              # Dashboard routes
│   │   │   └── index.tsx           # /dashboard
│   │   ├── clients/                # Client routes
│   │   │   ├── -columns.tsx        # Helper file (excluded from routes)
│   │   │   ├── index.tsx           # /clients
│   │   │   └── $id.tsx             # /clients/$id
│   │   ├── invoices/               # Invoice routes
│   │   │   ├── -columns.tsx        # Helper file (excluded from routes)
│   │   │   ├── index.tsx           # /invoices
│   │   │   ├── $id.tsx             # /invoices/$id
│   │   │   ├── $id.edit.tsx        # /invoices/$id/edit
│   │   │   └── new.tsx             # /invoices/new
│   │   ├── settings/               # Settings routes
│   │   │   └── index.tsx           # /settings
│   │   ├── sign-in/                # Sign-in routes
│   │   │   └── $.tsx               # /sign-in/$ (splat route)
│   │   └── sign-up/                # Sign-up routes
│   │       └── $.tsx               # /sign-up/$ (splat route)
│   ├── components/
│   │   ├── ui/                     # Shadcn/UI primitives
│   │   ├── invoice-pdf.tsx          # PDF renderer template
│   │   ├── invoice-table.tsx       # Invoice list table + bulk actions
│   │   └── providers.tsx           # Top-level providers (Clerk, Convex, Theme)
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utilities, helpers, constants
│   ├── router.tsx                   # TanStack Router configuration
│   └── routeTree.gen.ts            # Auto-generated route tree (do not edit)
├── convex/                         # Convex backend functions + schema
│   ├── schema.ts                   # Convex data model
│   ├── invoices.ts                 # Invoice queries + mutations
│   ├── clients.ts                  # Client endpoints
│   ├── files.ts                    # File storage helpers
│   └── users.ts                    # User bootstrap + metadata
├── public/                         # Static assets
├── vite.config.ts                  # Vite configuration
├── tailwind.config.ts              # Tailwind CSS v4 configuration
└── README.md                       # Project documentation (this file)
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
- Smooth transitions via Tailwind CSS v4 animations

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
pnpm dev              # Run TanStack Start (Vite) in development mode
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

### Environment Variables

TanStack Start uses Vite, which requires the `VITE_` prefix for environment variables to be exposed to the client. The app supports both `VITE_` and `NEXT_PUBLIC_` prefixes for compatibility.

### Routing

Routes are organized using TanStack Router's file-based routing system:

- Files in `src/app/` become routes automatically
- Use `-` prefix to exclude files from route generation (e.g., `-columns.tsx`)
- Dynamic routes use `$` prefix (e.g., `$id.tsx` for `/invoices/$id`)
- Splat routes use `$.tsx` (e.g., `$.tsx` for `/sign-in/$`)

## 🐛 Troubleshooting

### Authentication Issues

- Double-check Clerk keys in `.env` (use `VITE_CLERK_PUBLISHABLE_KEY`)
- Ensure the JWT template is named `convex`
- Confirm the `userId` claim is present

### Convex Connection Issues

- Run `pnpm convex dev` in its own terminal
- Verify `VITE_CONVEX_URL` matches your deployment
- Make sure your Convex project is deployed if testing production builds

### Image Upload Problems

- File size must be ≤ 5 MB
- Supported MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Check Convex storage quota usage

### PDF Generation Errors

- Ensure all required invoice fields are filled
- Large embedded images can increase render time—consider compressing receipts

## 📚 Helpful Links

- [TanStack Start Documentation](https://tanstack.com/start/latest)
- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [Convex Documentation](https://docs.convex.dev)
- [Clerk Documentation](https://clerk.com/docs)
- [Shadcn/UI Docs](https://ui.shadcn.com)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev)

Crafted with ❤️ using TanStack Start, Convex, and Clerk.
