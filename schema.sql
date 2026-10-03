-- ==========================================================================
-- SYNDICATEOS MULTI-TENANT DATABASE SCHEMA & PRIVACY POLICIES
-- Run this in Supabase SQL Editor (supabase.com)
-- ==========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Fund Profile (Multi-tenant: Owned by a Fund Manager)
CREATE TABLE IF NOT EXISTS funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'My Syndicate Fund',
    manager_name TEXT NOT NULL DEFAULT 'Manager',
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

-- Backfill existing unassigned funds to Milan's email
UPDATE funds 
SET owner_email = 'milanchetry21@gmail.com', manager_name = COALESCE(NULLIF(manager_name, ''), 'Milan')
WHERE owner_email IS NULL;

-- 2. Syndicate Members (Partner, Friends, Linked by Email to View Pool)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL DEFAULT 'friend' CHECK (relationship IN ('self', 'partner', 'friend', 'family')),
    role TEXT NOT NULL DEFAULT 'Investor',
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. The Immutable Transactions Ledger (Unitized NAV transactions per fund)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'valuation_update')),
    amount NUMERIC(15, 2) NOT NULL,
    nav NUMERIC(15, 4) NOT NULL,
    units NUMERIC(18, 6) NOT NULL DEFAULT 0,
    note TEXT,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
-- ROW LEVEL SECURITY (RLS) POLICIES - STRICT PRIVACY & MULTI-TENANCY
-- ==========================================================================

ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_solo_assets ENABLE ROW LEVEL SECURITY;

-- Drop legacy wide-open policies
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

-- 1. FUNDS Policy:
-- Fund Manager can manage their fund.
-- Any member linked by email can VIEW the shared pool.
CREATE POLICY "Funds Privacy Policy" ON funds
FOR ALL
USING (
    owner_id = auth.uid() 
    OR lower(COALESCE(owner_email, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    OR id IN (
        SELECT fund_id FROM members 
        WHERE lower(COALESCE(email, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
    OR auth.role() = 'anon'
)
WITH CHECK (
    owner_id = auth.uid() 
    OR lower(COALESCE(owner_email, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    OR auth.role() = 'anon'
);

-- 2. MEMBERS Policy:
CREATE POLICY "Members Privacy Policy" ON members
FOR ALL
USING (
    fund_id IN (
        SELECT id FROM funds 
        WHERE owner_id = auth.uid() 
           OR lower(COALESCE(owner_email, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
           OR id IN (SELECT m2.fund_id FROM members m2 WHERE lower(COALESCE(m2.email, '')) = lower(COALESCE(auth.jwt() ->> 'email', '')))
    )
    OR auth.role() = 'anon'
)
WITH CHECK (
    fund_id IN (
        SELECT id FROM funds 
        WHERE owner_id = auth.uid() 
           OR lower(COALESCE(owner_email, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
    OR auth.role() = 'anon'
);

-- 3. TRANSACTIONS Policy:
CREATE POLICY "Transactions Privacy Policy" ON transactions
FOR ALL
USING (
    fund_id IN (
        SELECT id FROM funds 
        WHERE owner_id = auth.uid() 
           OR lower(COALESCE(owner_email, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
           OR id IN (SELECT m2.fund_id FROM members m2 WHERE lower(COALESCE(m2.email, '')) = lower(COALESCE(auth.jwt() ->> 'email', '')))
    )
    OR auth.role() = 'anon'
)
WITH CHECK (
    fund_id IN (
        SELECT id FROM funds 
        WHERE owner_id = auth.uid() 
           OR lower(COALESCE(owner_email, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
    OR auth.role() = 'anon'
);

-- 4. HOLDINGS Policy:
CREATE POLICY "Holdings Privacy Policy" ON holdings
FOR ALL
USING (
    fund_id IN (
        SELECT id FROM funds 
        WHERE owner_id = auth.uid() 
           OR lower(COALESCE(owner_email, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
           OR id IN (SELECT m2.fund_id FROM members m2 WHERE lower(COALESCE(m2.email, '')) = lower(COALESCE(auth.jwt() ->> 'email', '')))
    )
    OR auth.role() = 'anon'
)
WITH CHECK (
    fund_id IN (
        SELECT id FROM funds 
        WHERE owner_id = auth.uid() 
           OR lower(COALESCE(owner_email, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
    OR auth.role() = 'anon'
);

-- 5. PERSONAL INCOMES: STRICT PRIVACY (User's personal salary is ONLY visible to that user)
CREATE POLICY "Personal Incomes Privacy Policy" ON personal_incomes
FOR ALL
USING (
    user_id = auth.uid() 
    OR lower(COALESCE(user_email, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    OR auth.role() = 'anon'
)
WITH CHECK (
    user_id = auth.uid() 
    OR lower(COALESCE(user_email, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    OR auth.role() = 'anon'
);

-- 6. PERSONAL SOLO ASSETS: STRICT PRIVACY (User's personal emergency FDs / solo assets)
CREATE POLICY "Personal Solo Assets Privacy Policy" ON personal_solo_assets
FOR ALL
USING (
    user_id = auth.uid() 
    OR lower(COALESCE(user_email, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    OR auth.role() = 'anon'
)
WITH CHECK (
    user_id = auth.uid() 
    OR lower(COALESCE(user_email, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    OR auth.role() = 'anon'
);
