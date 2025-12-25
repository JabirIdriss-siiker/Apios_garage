# Apios Garage - Execution Roadmap

This document outlines the step-by-step plan to build Apios Garage. Follow these phases in order to ensure a stable and scalable foundation.

## 🗓️ Phase 1: Foundation & Infrastructure
**Goal**: Get the "Hello World" of the SaaS running with database and styling.

- [ ] **1.1 Project Init**: Initialize Next.js 15, TypeScript, Tailwind, shadcn/ui.
- [ ] **1.2 Database Setup**: Set up Supabase project and get connection strings.
- [ ] **1.3 Prisma Setup**: Install Prisma, copy the `schema.prisma` (from architecture.md), and push to DB.
- [ ] **1.4 Repo Setup**: Push to GitHub.

## 🔐 Phase 2: Authentication & Multi-Tenancy (The Core)
**Goal**: Users can sign up, create a garage (Tenant), and log in.

- [ ] **2.1 NextAuth Setup**: Configure NextAuth.js with Credentials provider.
- [ ] **2.2 Tenant Onboarding Flow**: Create a `/register` page that creates a `User` AND a `Tenant` simultaneously.
- [ ] **2.3 Prisma Extension**: Implement the "Auto-Tenant-Filter" extension to secure data access.
- [ ] **2.4 Login Page**: Create a custom login page.
- [ ] **2.5 RBAC Middleware**: Implement middleware to redirect users based on Role (e.g., `/admin` vs `/app`).

## 🖥️ Phase 3: Dashboard & CRM (The Basics)
**Goal**: A Tenant Admin can manage their clients and vehicles.

- [ ] **3.1 App Layout**: Create the Sidebar and Dashboard Shell (shadcn/ui).
- [ ] **3.2 Clients CRUD**: List, Add, Edit, Delete Clients.
- [ ] **3.3 Vehicles CRUD**: List, Add, Edit, Delete Vehicles (linked to Clients).
- [ ] **3.4 Role Display**: Show current user role in the UI.

## 🔧 Phase 4: Workshop Operations (The Value)
**Goal**: Mechanics can work on cars.

- [ ] **4.1 Parts & Stock**: Manage inventory (Parts CRUD).
- [ ] **4.2 Interventions**: Create Interventions, assign Mechanics, add Parts/Labor.
- [ ] **4.3 Kanban Board**: Visual view of Interventions (Pending -> In Progress -> Done).
- [ ] **4.4 Quotes (Devis)**: Generate Quotes from Interventions.
- [ ] **4.5 Invoices**: Convert Quotes/Interventions to Invoices.

## 💳 Phase 5: SaaS Billing (Stripe)
**Goal**: You (SuperAdmin) get paid.

- [ ] **5.1 Stripe Init**: Set up Stripe account and products (Free, Basic, Pro).
- [ ] **5.2 Subscription Model**: Sync Stripe data to `Subscription` table.
- [ ] **5.3 Billing Portal**: Allow Tenants to upgrade/downgrade plans via Stripe Customer Portal.
- [ ] **5.4 Gating**: Restrict features based on `Tenant.plan`.

## 📅 Phase 6: Public Booking System
**Goal**: End-customers can book appointments.

- [ ] **6.1 Middleware Routing**: Configure `middleware.ts` to handle `*.apios.com`.
- [ ] **6.2 Booking Page**: Build `/_sites/[slug]/book` (Public form).
- [ ] **6.3 Booking Management**: Admin dashboard to review and confirm bookings.

## 🚀 Phase 7: Deployment & Polish
**Goal**: Go Live.

- [ ] **7.1 Vercel Deployment**: Connect GitHub to Vercel.
- [ ] **7.2 Domain Config**: Configure Wildcard DNS (`*.apios.com`).
- [ ] **7.3 SuperAdmin Dashboard**: Build the platform admin view to manage tenants.
- [ ] **7.4 Final Testing**: End-to-end testing of all flows.
