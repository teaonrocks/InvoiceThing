# Changelog

## [Current] - 2025-10-07

### Added

- **Dark Mode** - System-aware theme toggle with light/dark/auto modes
- **Receipt Images** - Attach photos to expense claims (5MB max)
- **PDF Generation** - Download invoices with embedded receipt images
- **Configurable Tax** - Set custom tax rates (0-100%) or disable entirely
- **Smart Client Creation** - Create clients during invoice creation
- **Expense Claims** - Track reimbursable expenses with receipts
- **Settings Page** - Configure invoice numbering, tax, and due dates
- **Email Support** - Optional email field for clients
- **Image Storage** - Convex file storage for receipt uploads

### Changed

- Tax now defaults to 0% (was 10%)
- Tax only shows when > 0%
- Email is optional for clients
- Consolidated all documentation into README.md

### Technical

- Next.js 15 with App Router
- React 19
- Convex real-time backend
- Clerk authentication
- Shadcn/UI components
- Tailwind CSS v3
- next-themes for dark mode
- @react-pdf/renderer for PDFs

## Features Summary

### Authentication & Users

- Clerk-based authentication
- User profile management
- Secure session handling

### Client Management

- Create, edit, delete clients
- Optional email field
- Client search/filtering
- Smart creation during invoice flow

### Invoice Management

- Create invoices with line items
- Add expense claims with receipts
- Configurable tax rates
- Invoice status tracking (Draft/Sent/Paid/Overdue)
- Edit existing invoices
- PDF download with images
- Email to clients

### Dashboard

- Total earnings
- Outstanding payments
- Recent invoices
- Quick stats

### Settings

- Invoice prefix customization
- Starting invoice number
- Default due date (days)
- Tax rate configuration

### UI/UX

- Dark mode support
- Responsive design
- Real-time updates
- Professional PDF exports
- Receipt image uploads
- Date picker
- Client combobox search

## Documentation

All documentation has been consolidated into `README.md`. Previous feature-specific documentation files have been removed to reduce clutter.

### Removed Files

- BUILD_FIX.md
- SMART_CLIENT_CREATION.md
- CONVEX_AUTH_FIX.md
- CLERK_JWT_SETUP.md
- CLIENT_COMBOBOX_FEATURE.md
- PRIORITY_1_COMPLETE.md
- DATE_PICKER_UPDATE.md
- UPDATE_EDIT_CLIENTS.md
- CLAIMS_FEATURE.md
- JWT_FIX.md
- CHECKLIST.md
- COMPLETED_PRIORITY_1.md
- INDEX.md
- PDF_GENERATION_FEATURE.md
- SETTINGS_FEATURE.md
- OPTIONAL_EMAIL_UPDATE.md
- NEXTJS_15_PARAMS_FIX.md
- SETUP_COMPLETE.md
- QUICK_REFERENCE.md
- WHATS_NEW.md
- TAX_CONFIGURATION.md
- DARK_MODE_FEATURE.md
- PROJECT_OVERVIEW.md
- ARCHITECTURE.md
- SETUP.md
- SUMMARY.md

All information from these files has been incorporated into the main README.
