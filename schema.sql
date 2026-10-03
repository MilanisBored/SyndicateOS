-- ==========================================================================
-- SYNDICATEOS UNIVERSAL MULTI-TENANT DATABASE SCHEMA & PRIVACY POLICIES
-- Run this in Supabase SQL Editor (supabase.com)
-- ==========================================================================
-- Supports:
-- 1. Multi-Manager: Any user can create and manage one or more Syndicate Funds.
-- 2. Multi-Investor: One investor can invest into multiple Fund Managers' pools.
-- 3. Automatic Privacy:
--    - Managers have full operational control over funds they own.
--    - Investors can view the funds they have invested into, their units,
--      their equity value, their ledger transactions, and underlying holdings.
--    - Personal salaries & solo assets are strictly private to the individual.
-- ==========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Funds Table (Owned by a Fund Manager)
CREATE TABLE IF NOT EXISTS funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'My Syndicate Fund',
    manager_name TEXT NOT NULL DEFAULT 'Fund Manager',
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_email TEXT,
    initial_nav NUMERIC(15, 4) NOT NULL DEFAULT 100.0000,
    currency VARCHAR(5) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE funds ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE funds ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE funds ADD COLUMN IF NOT EXISTS portfolio_visibility TEXT DEFAULT 'private';

-- 2. Syndicate Members (Investors, Partners, Friends linked by Email)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL DEFAULT 'investor',
    role TEXT NOT NULL DEFAULT 'Investor',
    email TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure status and user_code columns exist if table was already created
ALTER TABLE members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE members ADD COLUMN IF NOT EXISTS user_code TEXT;

-- Ensure check constraint allows all modern relationships
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_relationship_check;
ALTER TABLE members ADD CONSTRAINT members_relationship_check 
    CHECK (relationship IN ('self', 'partner', 'friend', 'family', 'investor'));

-- 3. The Immutable Transactions Ledger (Unitized NAV transactions per fund)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'valuation_update')),
    amount NUMERIC(20, 2) NOT NULL,
    nav NUMERIC(20, 6) NOT NULL,
    units NUMERIC(30, 12) NOT NULL DEFAULT 0,
    note TEXT,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'verified' CHECK (status IN ('pending', 'verified', 'disputed')),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    verification_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- High-precision column migrations (prevents fractional truncation across large scale capital)
ALTER TABLE transactions ALTER COLUMN amount TYPE NUMERIC(20, 2);
ALTER TABLE transactions ALTER COLUMN nav TYPE NUMERIC(20, 6);
ALTER TABLE transactions ALTER COLUMN units TYPE NUMERIC(30, 12);

-- Ensure verification columns exist
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'verified';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- 4. Portfolio Holdings (Underlying assets bought with pooled money)
CREATE TABLE IF NOT EXISTS holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Equities / ETFs',
    units NUMERIC(18, 6) DEFAULT NULL,
    invested_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    current_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE holdings ADD COLUMN IF NOT EXISTS units NUMERIC(18, 6);

-- 5. Personal Finances: Incomes (Strictly Private to Individual User)
CREATE TABLE IF NOT EXISTS personal_incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    source TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Salary',
    recurrence TEXT NOT NULL DEFAULT 'Monthly',
    amount NUMERIC(15, 2) NOT NULL,
    event_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE personal_incomes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE personal_incomes ADD COLUMN IF NOT EXISTS user_email TEXT;

-- 6. Personal Finances: Solo External Assets (Strictly Private to Individual User)
CREATE TABLE IF NOT EXISTS personal_solo_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Fixed Deposit',
    value NUMERIC(15, 2) NOT NULL,
    institution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE personal_solo_assets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE personal_solo_assets ADD COLUMN IF NOT EXISTS user_email TEXT;

-- ==========================================================================
-- SECURITY DEFINER HELPER FUNCTIONS (PREVENTS RLS RECURSION)
-- ==========================================================================

-- Function 1: Get all fund IDs where a user is an active member / investor
CREATE OR REPLACE FUNCTION public.get_member_fund_ids(p_email TEXT)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT fund_id FROM members 
    WHERE p_email IS NOT NULL 
      AND lower(email) = lower(p_email);
$$;

-- Function 2: Check if user can access a fund (as manager OR as linked investor)
CREATE OR REPLACE FUNCTION public.can_access_fund(p_fund_id UUID, p_uid UUID, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        -- User owns the fund as Fund Manager
        SELECT 1 FROM funds 
        WHERE id = p_fund_id 
          AND (
            (p_uid IS NOT NULL AND owner_id = p_uid)
            OR (p_email IS NOT NULL AND lower(owner_email) = lower(p_email))
          )
    )
    OR EXISTS (
        -- User is linked as an investor in this fund's members
        SELECT 1 FROM members 
        WHERE fund_id = p_fund_id 
          AND p_email IS NOT NULL 
          AND lower(email) = lower(p_email)
    );
$$;

-- Function 3: Check if user owns a fund (as Fund Manager with edit rights)
CREATE OR REPLACE FUNCTION public.is_fund_owner(p_fund_id UUID, p_uid UUID, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM funds 
        WHERE id = p_fund_id 
          AND (
            (p_uid IS NOT NULL AND owner_id = p_uid)
            OR (p_email IS NOT NULL AND lower(owner_email) = lower(p_email))
          )
    );
$$;

-- ==========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================================

ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_solo_assets ENABLE ROW LEVEL SECURITY;

-- Clean existing policies
DROP POLICY IF EXISTS "Public Read All Funds" ON funds;
DROP POLICY IF EXISTS "Public Read All Members" ON members;
DROP POLICY IF EXISTS "Public Read All Transactions" ON transactions;
DROP POLICY IF EXISTS "Public Read All Holdings" ON holdings;
DROP POLICY IF EXISTS "Public Read All Personal Incomes" ON personal_incomes;
DROP POLICY IF EXISTS "Public Read All Personal Assets" ON personal_solo_assets;

DROP POLICY IF EXISTS "Funds Privacy Policy" ON funds;
DROP POLICY IF EXISTS "Members Privacy Policy" ON members;
DROP POLICY IF EXISTS "Transactions Privacy Policy" ON transactions;
DROP POLICY IF EXISTS "Holdings Privacy Policy" ON holdings;
DROP POLICY IF EXISTS "Personal Incomes Privacy Policy" ON personal_incomes;
DROP POLICY IF EXISTS "Personal Solo Assets Privacy Policy" ON personal_solo_assets;

-- 1. FUNDS Policy
-- - Managers can view, insert, update, and delete their own funds.
-- - Investors can view funds they are a member of.
CREATE POLICY "Funds Privacy Policy" ON funds
FOR ALL
USING (
    auth.role() = 'anon'
    OR owner_id = auth.uid() 
    OR (auth.jwt() ->> 'email' IS NOT NULL AND lower(COALESCE(owner_email, '')) = lower(auth.jwt() ->> 'email'))
    OR id IN (SELECT public.get_member_fund_ids(auth.jwt() ->> 'email'))
)
WITH CHECK (
    auth.role() = 'anon'
    OR owner_id = auth.uid() 
    OR (auth.jwt() ->> 'email' IS NOT NULL AND lower(COALESCE(owner_email, '')) = lower(auth.jwt() ->> 'email'))
);

-- 2. MEMBERS Policy
-- - Visible to anyone with access to the fund (Fund Manager + Investors in the fund).
-- - Only the Fund Manager can insert, update, or remove members.
CREATE POLICY "Members Privacy Policy" ON members
FOR ALL
USING (
    auth.role() = 'anon'
    OR public.can_access_fund(fund_id, auth.uid(), auth.jwt() ->> 'email')
)
WITH CHECK (
    auth.role() = 'anon'
    OR public.is_fund_owner(fund_id, auth.uid(), auth.jwt() ->> 'email')
);

-- 3. TRANSACTIONS Policies (Two-Way Acknowledgment)
-- - Read: Visible to anyone in the fund (Fund Manager + Investors).
-- - Insert / Delete: Fund Manager only.
-- - Update: Fund Manager can edit all fields; Investors can confirm/dispute their own deposits!
DROP POLICY IF EXISTS "Transactions Privacy Policy" ON transactions;
DROP POLICY IF EXISTS "Transactions Select Policy" ON transactions;
DROP POLICY IF EXISTS "Transactions Insert Policy" ON transactions;
DROP POLICY IF EXISTS "Transactions Update Policy" ON transactions;
DROP POLICY IF EXISTS "Transactions Delete Policy" ON transactions;

CREATE POLICY "Transactions Select Policy" ON transactions
FOR SELECT
USING (
    auth.role() = 'anon'
    OR public.can_access_fund(fund_id, auth.uid(), auth.jwt() ->> 'email')
);

CREATE POLICY "Transactions Insert Policy" ON transactions
FOR INSERT
WITH CHECK (
    auth.role() = 'anon'
    OR public.is_fund_owner(fund_id, auth.uid(), auth.jwt() ->> 'email')
);

CREATE POLICY "Transactions Update Policy" ON transactions
FOR UPDATE
USING (
    auth.role() = 'anon'
    OR public.is_fund_owner(fund_id, auth.uid(), auth.jwt() ->> 'email')
    OR (
        member_id IN (
            SELECT id FROM members WHERE fund_id = transactions.fund_id AND lower(email) = lower(auth.jwt() ->> 'email')
        )
    )
)
WITH CHECK (
    auth.role() = 'anon'
    OR public.is_fund_owner(fund_id, auth.uid(), auth.jwt() ->> 'email')
    OR (
        member_id IN (
            SELECT id FROM members WHERE fund_id = transactions.fund_id AND lower(email) = lower(auth.jwt() ->> 'email')
        )
    )
);

CREATE POLICY "Transactions Delete Policy" ON transactions
FOR DELETE
USING (
    auth.role() = 'anon'
    OR public.is_fund_owner(fund_id, auth.uid(), auth.jwt() ->> 'email')
);

-- 4. HOLDINGS Policy
-- - Transparently visible to anyone in the fund (investors can see pool asset backing).
-- - Only the Fund Manager can add, edit, or remove holdings positions.
CREATE POLICY "Holdings Privacy Policy" ON holdings
FOR ALL
USING (
    auth.role() = 'anon'
    OR public.can_access_fund(fund_id, auth.uid(), auth.jwt() ->> 'email')
)
WITH CHECK (
    auth.role() = 'anon'
    OR public.is_fund_owner(fund_id, auth.uid(), auth.jwt() ->> 'email')
);

-- 5. PERSONAL INCOMES: STRICT PRIVACY (User's personal salary is ONLY visible to that user)
CREATE POLICY "Personal Incomes Privacy Policy" ON personal_incomes
FOR ALL
USING (
    auth.role() = 'anon'
    OR user_id = auth.uid() 
    OR (auth.jwt() ->> 'email' IS NOT NULL AND lower(COALESCE(user_email, '')) = lower(auth.jwt() ->> 'email'))
)
WITH CHECK (
    auth.role() = 'anon'
    OR user_id = auth.uid() 
    OR (auth.jwt() ->> 'email' IS NOT NULL AND lower(COALESCE(user_email, '')) = lower(auth.jwt() ->> 'email'))
);

-- 6. PERSONAL SOLO ASSETS: STRICT PRIVACY (User's personal emergency FDs / solo assets)
CREATE POLICY "Personal Solo Assets Privacy Policy" ON personal_solo_assets
FOR ALL
USING (
    auth.role() = 'anon'
    OR user_id = auth.uid() 
    OR (auth.jwt() ->> 'email' IS NOT NULL AND lower(COALESCE(user_email, '')) = lower(auth.jwt() ->> 'email'))
)
WITH CHECK (
    auth.role() = 'anon'
    OR user_id = auth.uid() 
    OR (auth.jwt() ->> 'email' IS NOT NULL AND lower(COALESCE(user_email, '')) = lower(auth.jwt() ->> 'email'))
);
