-- ==========================================================================
-- SYNDICATEVAULT DATABASE SCHEMA (CLEAN - ZERO MOCK DATA)
-- Run this in Supabase SQL Editor (supabase.com)
-- ==========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Fund Profile
CREATE TABLE IF NOT EXISTS funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'My Syndicate Fund',
    manager_name TEXT NOT NULL DEFAULT 'Milan',
    initial_nav NUMERIC(15, 4) NOT NULL DEFAULT 100.0000,
    currency VARCHAR(5) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Syndicate Members (Partner, Friends, Self)
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

-- 3. The Immutable Transactions Ledger (Unitized NAV transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL, -- NULL indicates fund-wide valuation
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

-- Migration helper if holdings table already exists:
-- ALTER TABLE holdings ADD COLUMN IF NOT EXISTS units NUMERIC(18, 6);

-- 5. Personal Finances: Incomes
CREATE TABLE IF NOT EXISTS personal_incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Salary',
    recurrence TEXT NOT NULL DEFAULT 'Monthly',
    amount NUMERIC(15, 2) NOT NULL,
    event_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Personal Finances: Solo External Assets (Outside pool)
CREATE TABLE IF NOT EXISTS personal_solo_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Fixed Deposit',
    value NUMERIC(15, 2) NOT NULL,
    institution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (Idempotent: Safe to re-run anytime)
-- ==========================================================================

ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_solo_assets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist before creating
DROP POLICY IF EXISTS "Public Read All Funds" ON funds;
DROP POLICY IF EXISTS "Public Read All Members" ON members;
DROP POLICY IF EXISTS "Public Read All Transactions" ON transactions;
DROP POLICY IF EXISTS "Public Read All Holdings" ON holdings;
DROP POLICY IF EXISTS "Public Read All Personal Incomes" ON personal_incomes;
DROP POLICY IF EXISTS "Public Read All Personal Assets" ON personal_solo_assets;

-- Allow full read/write access for application anon key
CREATE POLICY "Public Read All Funds" ON funds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read All Members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read All Transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read All Holdings" ON holdings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read All Personal Incomes" ON personal_incomes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read All Personal Assets" ON personal_solo_assets FOR ALL USING (true) WITH CHECK (true);

-- Ensure 1 clean default fund exists with 0 members and 0 transactions
INSERT INTO funds (name, manager_name, initial_nav, currency)
SELECT 'My Syndicate Fund', 'Milan', 100.0000, 'INR'
WHERE NOT EXISTS (SELECT 1 FROM funds LIMIT 1);
