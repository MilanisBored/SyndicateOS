-- ==========================================================================
-- WIPE ALL FALSE / DEMO DATA FROM SUPABASE
-- Run this in your Supabase SQL Editor to reset everything to 0
-- ==========================================================================

-- 1. Wipe all ledger transactions
TRUNCATE TABLE transactions CASCADE;

-- 2. Wipe all members
TRUNCATE TABLE members CASCADE;

-- 3. Wipe all portfolio holdings
TRUNCATE TABLE holdings CASCADE;

-- 4. Wipe all personal incomes and solo assets
TRUNCATE TABLE personal_incomes CASCADE;
TRUNCATE TABLE personal_solo_assets CASCADE;

-- 5. Reset the fund profile to a clean slate
UPDATE funds 
SET name = 'My Syndicate Fund', 
    manager_name = 'Milan', 
    initial_nav = 100.0000, 
    currency = 'INR'
WHERE id IN (SELECT id FROM funds LIMIT 1);

-- If no fund exists, insert 1 clean fund record
INSERT INTO funds (name, manager_name, initial_nav, currency)
SELECT 'My Syndicate Fund', 'Milan', 100.0000, 'INR'
WHERE NOT EXISTS (SELECT 1 FROM funds LIMIT 1);
