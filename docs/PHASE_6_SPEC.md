# Phase 6 Specification: SaaS Monetization & Collaboration

## 1. Executive Summary 🚀

Phase 6, "Monetization & Collaboration," marks Coordino's evolution from a single-user productivity tool into a competitive, multi-tenant Software as a Service (SaaS) application. This phase introduces a freemium pricing model with distinct tiers, implements the necessary architectural changes for multi-tenancy and team collaboration, and integrates a payment system to handle subscriptions. The goal is to establish a scalable foundation for commercial growth while delivering significant new value to paying users and teams.

## 2. Market Positioning & Key Differentiators

Coordino will be positioned as the **integrated, context-aware workspace for focused teams.** While competitors specialize in either tasks (Asana), notes (Notion), or scheduling (Calendly), Coordino's unique value is the seamless unification of all three. Our key market differentiators are:

1.  **The Integrated Hub:** By combining tasks, notes, and scheduling, Coordino eliminates the friction of context-switching between different applications. The ability to link notes to tasks, create tasks from meetings, and see all related work in one place is our core advantage.
2.  **Human-Centric Scheduling:** The **Meeting Equity Score** is a powerful and unique feature that demonstrates a commitment to fair and respectful global collaboration. This positions Coordino as a leader in building healthy remote team cultures.
3.  **Speed & Focus:** Adhering to our design philosophy, Coordino offers a faster, more information-dense, and less bloated experience than many do-it-all competitors, helping users stay focused and productive.

## 3. Pricing & Tiering Model

We will adopt a standard 3-tier model to drive product-led growth.

| Tier | Price | Target User | Core Concept |
| :--- | :--- | :--- | :--- |
| **Personal (Free)** | $0 | Individuals & Students | "Organize Your Life" |
| **Pro (Paid)** | ~$8-12 / user / month | Power Users & Freelancers | "Automate Your Productivity" |
| **Teams (Paid)** | ~$15-20 / user / month | Collaborative Teams (2+ users) | "Synchronize Your Team" |

### Tier Feature Breakdown

#### 🪴 Personal Tier (Free)
*   **Features:** Access to all core modules (Tasks, Notes, Scheduling) for individual use.
*   **Limits:**
    *   3 Active "Projects" (a new organizational concept).
    *   200 Active Tasks.
    *   100 Notes.
    *   1 Saved Scheduling Configuration.
    *   Basic "Continue where you left off" history (last 3 items).

#### 🚀 Pro Tier (Paid)
*   **Everything in Personal, plus:**
    *   **Unlimited** personal projects, tasks, notes, and scheduling configurations.
    *   **AI-Enhanced Scheduling:** "Auto-Schedule" button that intelligently suggests optimal meeting times.
    *   **Advanced Note-Taking:** Full-text content search, version history, and Markdown/PDF export.
    *   **Advanced Task Management:** Recurring tasks and task dependencies.
    *   (Future) Calendar Sync (Google Calendar, Outlook).

####  협 Teams Tier (Paid)
*   **Everything in Pro, plus:**
    *   **Shared Workspaces:** Create or join team workspaces.
    *   **Collaborative Tasks:** Assign tasks to team members.
    *   **Collaborative Notes:** Real-time multi-user editing.
    *   **Team-Aware Scheduling:** View team availability in the scheduling assistant.
    *   **Roles & Permissions:** Owner, Admin, Member roles.
    *   **Centralized Billing & Audit Logs.**

## 4. Architectural Implementation Plan

### US-601: Implement Multi-Tenant Workspace Architecture

*   **As a developer**, I need to refactor the database schema and security policies to support multiple workspaces, **so that** user and team data is securely isolated.
*   **Acceptance Criteria:**
    *   ✅ A `workspaces` table is created to define tenancy.
    *   ✅ A `workspace_members` junction table with a `role` column (`owner`, `admin`, `member`) is created.
    *   ✅ All feature tables (`tasks`, `notes`, etc.) are migrated to include a `workspace_id` foreign key.
    *   ✅ A trigger function automatically creates a default "Personal" workspace for every new user.
    *   ✅ All Row Level Security (RLS) policies are rewritten to enforce data access based on workspace membership.
*   **Technical Details:** See "Database Schema Changes" section below.

### US-602: Integrate Subscription and Payment System

*   **As a user**, I want to be able to upgrade my plan, manage my subscription, and handle payments securely, **so that** I can access premium features.
*   **Acceptance Criteria:**
    *   ✅ Stripe is integrated as the payment processor.
    *   ✅ The Supabase Stripe Extension is configured, creating `customers`, `products`, `prices`, and `subscriptions` tables.
    *   ✅ Pricing plans from the Stripe Dashboard are synced with the Supabase `products` table.
    *   ✅ A secure checkout flow is implemented using Stripe Checkout, orchestrated by a Supabase Edge Function.
    *   ✅ A webhook handler (provided by the extension) correctly updates the `subscriptions` table based on events from Stripe (e.g., successful payment, cancellation).
    *   ✅ A "Manage Billing" button redirects authenticated users to the Stripe Customer Portal.
*   **Technical Details:** Utilize the official Supabase Stripe Extension and Stripe Checkout for a secure, low-maintenance implementation.

### US-603: Implement Feature Gating & Usage Limits

*   **As a developer**, I need a system to enable/disable features and enforce usage limits based on a user's subscription plan, **so that** the tiering model is correctly enforced.
*   **Acceptance Criteria:**
    *   ✅ A `useSubscription` composable or Pinia store provides reactive state about the current workspace's plan (e.g., `plan.name`, `plan.status`).
    *   ✅ UI elements for premium features are conditionally rendered using `v-if`.
    *   ✅ Action triggers (e.g., creating a new task) are disabled with a clear "Upgrade" prompt when a usage limit is reached.
    *   ✅ **Critical:** RLS policies and/or database triggers are implemented to enforce limits on the backend, preventing circumvention of frontend checks.
*   **Technical Details:**
    *   The `useSubscription` composable will be the single source of truth for permissions.
    *   Backend enforcement will be done via `check` constraints in RLS policies that call a function to get the current item count and plan limits.

### US-604: Implement Team Collaboration Features

*   **As a Teams user**, I want to collaborate with my teammates on tasks and notes, **so that** we can work together effectively.
*   **Acceptance Criteria:**
    *   ✅ Users can invite others to a workspace via email.
    *   ✅ Tasks can be assigned to any member of the workspace.
    *   ✅ The UI clearly indicates who is assigned to a task.
    *   ✅ Real-time multi-user editing is enabled for notes within a team workspace (e.g., showing other users' cursors and selections).
*   **Technical Details:**
    *   Task assignment requires adding an `assignee_id` (UUID) to the `tasks` table.
    *   Real-time note collaboration can be implemented using Supabase's Realtime Broadcast and Presence features to sync cursor positions and text changes between clients. Tiptap editor has extensions to support this.

## 5. Database Schema Changes

The following SQL statements outline the necessary database schema modifications for Phase 6.

```sql
-- 1. Create Workspace and Membership tables
CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE TABLE workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'member',
  PRIMARY KEY (workspace_id, user_id)
);
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- 2. Add workspace_id to all relevant tables
ALTER TABLE tasks ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE notes ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE topics ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE meetings ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
-- ... and so on for all user-centric data tables.

-- 3. Create RLS policies for workspaces and members
CREATE POLICY "Users can see workspaces they are a member of"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their workspace"
  ON workspaces FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can see members of their own workspaces"
  ON workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members AS wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- 4. Create Stripe subscription tables (handled by Supabase extension)
-- The Supabase Stripe Extension will create 'products', 'prices', 'subscriptions', etc.

-- 5. Create a function to handle new user setup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  workspace_id_new UUID;
BEGIN
  -- Create a personal workspace for the new user
  INSERT INTO public.workspaces (owner_id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name' || '''s Workspace')
  RETURNING id INTO workspace_id_new;

  -- Add the user as the owner of their new workspace
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (workspace_id_new, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 6. Testing Strategy

*   **Unit & Integration Tests:**
    *   All new store methods for subscriptions and permissions must have 100% test coverage.
    *   The `useSubscription` composable must be rigorously tested for all permission-checking logic.
*   **E2E Tests (Playwright):**
    *   **CRITICAL:** Create end-to-end tests for the entire subscription flow: `Select Plan -> Redirect to Stripe -> Mock Successful Payment -> Verify Premium Feature is Unlocked`. Playwright can handle the multi-page redirects to Stripe.
    *   **CRITICAL:** Create tests to validate multi-tenancy. Test A should log in as User A, create a task, and verify User B (in a different workspace) cannot see it. Test B should then add User B to User A's workspace and verify they *can* now see it.
*   **Security Testing:**
    *   Manually attempt to bypass feature gates and usage limits by calling store actions directly from the browser console.
    *   Verify that RLS policies correctly prevent unauthorized access and enforce usage limits at the database level.
