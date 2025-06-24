# New Systems Nexus

A modern, secure web application for tracking companies and their deal stages. Built to replace Airtable with a custom solution featuring robust authentication, role-based access control, and a clean, minimalistic design.

## Features

### Core Functionality
- **Company Management**: Track companies with deal stages, contact information, deal values, and notes
- **Views System**: Create custom filtered views similar to Airtable's base-level table tracking
- **Real-time Updates**: Changes sync across all views and users in real-time
- **Advanced Filtering**: Multiple filter operators (equals, contains, greater than, etc.)
- **Sorting & Search**: Sort by any column and search across all data

### Security & Authentication
- **Secure Authentication**: Powered by Clerk with email-based access control
- **Role-Based Access**: Admin and Member roles with different permissions
- **Domain Restrictions**: Automatic access for `@newsystemventures.com` emails
- **Permission Management**: Admins can manually add/remove users and assign roles

### User Interface
- **Clean Design**: Minimalistic interface with Inter font and modern styling
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Reusable Components**: Modular UI components built with Tailwind CSS
- **Accessibility**: WCAG 2.1 AA compliant design

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Supabase PostgreSQL
- **Authentication**: Clerk
- **UI Components**: Custom components with TanStack Table
- **Deployment**: Vercel
- **Database**: Supabase (PostgreSQL with Row Level Security)

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Clerk account
- Supabase account

### 1. Clone and Install
```bash
git clone <repository-url>
cd new-systems-nexus
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
ALLOWED_DOMAIN=newsystemventures.com
```

### 3. Database Setup
Run the database schema in your Supabase SQL editor:

```sql
-- Copy and paste the contents of supabase/schema.sql
```

### 4. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Setup Guide

### Clerk Authentication Setup

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Configure sign-in options (email recommended)
3. Add your domain to allowed origins
4. Copy the publishable key and secret key to your `.env.local`

### Supabase Database Setup

1. Create a new Supabase project
2. Go to the SQL editor and run `supabase/schema.sql`
3. Copy your project URL and anon key to `.env.local`
4. Generate a service role key and add it to `.env.local`

### Permission Management

The first user with an `@newsystemventures.com` email will automatically have admin access. Admins can:
- Access the admin panel at `/admin`
- Add/remove user permissions
- Assign admin or member roles

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   │   ├── companies/     # Company CRUD operations
│   │   ├── views/         # View management
│   │   └── permissions/   # User permission management
│   ├── dashboard/         # Main dashboard page
│   └── admin/            # Admin panel
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── CompanyTable.tsx  # Main data table
│   ├── ViewsSidebar.tsx  # Views management sidebar
│   └── Header.tsx        # App header
├── lib/                  # Utility libraries
│   ├── auth.ts          # Authentication helpers
│   ├── database.ts      # Database service layer
│   ├── supabase.ts      # Supabase client
│   └── utils.ts         # General utilities
└── types/               # TypeScript type definitions
```

## Architecture

### Authentication Flow
1. Users sign in via Clerk
2. Email domain is checked against `ALLOWED_DOMAIN`
3. Manual permissions are checked in the database
4. Role-based access is enforced on all protected routes

### Data Flow
1. React components fetch data via API routes
2. API routes authenticate requests using Clerk
3. Database operations use Supabase with RLS policies
4. Real-time updates propagate through React state

### Security Measures
- All API routes require authentication
- Row Level Security (RLS) policies on database tables
- Input validation using Zod schemas
- CSRF protection via Clerk middleware
- SQL injection prevention with parameterized queries

## Deployment

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

Required Vercel environment variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_DOMAIN`

### Custom Domain
Configure your custom domain (e.g., `nexus.newsystemventures.com`) in Vercel dashboard.

## Extending the Application

### Adding New Columns
1. Update the database schema in Supabase
2. Add the field to the `Company` type in `src/types/index.ts`
3. Update the `DatabaseService` methods in `src/lib/database.ts`
4. Add the column to the table component in `src/components/CompanyTable.tsx`

### Adding New Views
Views are automatically manageable through the UI, but you can add default views by:
1. Inserting them into the database with `is_default = true`
2. Setting `user_id = 'system'`

### Customizing UI
- Modify the color palette in `tailwind.config.js`
- Update component styles in `src/components/ui/`
- Add new icons to `src/components/ui/Icons.tsx`

## API Reference

### Companies
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Create a new company
- `PUT /api/companies/[id]` - Update a company
- `DELETE /api/companies/[id]` - Delete a company

### Views
- `GET /api/views` - Get user's views
- `POST /api/views` - Create a new view
- `PUT /api/views/[id]` - Update a view
- `DELETE /api/views/[id]` - Delete a view

### Permissions (Admin only)
- `GET /api/permissions` - Get all permissions
- `POST /api/permissions` - Add user permission
- `PUT /api/permissions/[id]` - Update user role
- `DELETE /api/permissions/[id]` - Remove user permission

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## Security

This application follows security best practices:
- Authentication required for all operations
- Role-based authorization
- Input validation and sanitization
- SQL injection prevention
- CSRF protection
- Secure session management

Report security vulnerabilities to the development team.

## Support

For questions or issues:
1. Check the documentation above
2. Review the codebase comments
3. Contact the development team

## License

Private repository - All rights reserved.
