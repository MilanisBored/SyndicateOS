import { createClient } from '@supabase/supabase-js';

export function cleanSupabaseUrl(input) {
  if (!input) return '';
  const match = input.match(/https?:\/\/[a-z0-9_-]+\.supabase\.co/i);
  if (match) return match[0];
  return input.trim().replace(/[`'"\s]/g, '');
}

export function cleanSupabaseKey(input) {
  if (!input) return '';
  return input.trim().replace(/[`'"\s]/g, '');
}

// Retrieve credentials from .env or localStorage
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localUrl = localStorage.getItem('syndicate_sb_url');
  const localKey = localStorage.getItem('syndicate_sb_key');

  const rawUrl = (envUrl && envUrl !== 'YOUR_SUPABASE_URL' && envUrl.trim() !== '') ? envUrl : (localUrl || '');
  const rawKey = (envKey && envKey !== 'YOUR_SUPABASE_ANON_KEY' && envKey.trim() !== '') ? envKey : (localKey || '');

  const url = cleanSupabaseUrl(rawUrl);
  const key = cleanSupabaseKey(rawKey);

  return { url, key };
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url.startsWith('http') && url.includes('supabase.co'));
}

let supabaseInstance = null;

export function getSupabase() {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return null;

  if (!supabaseInstance || supabaseInstance.supabaseUrl !== url) {
    try {
      supabaseInstance = createClient(url, key);
    } catch (e) {
      console.error('Error creating Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

// ==========================================================================
// SUPABASE DIAGNOSTIC TEST
// ==========================================================================

export async function testSupabaseConnection() {
  const sb = getSupabase();
  if (!sb) {
    return { success: false, error: 'Supabase URL or Key is missing.' };
  }

  try {
    const [fRes, mRes, tRes, hRes, iRes, aRes] = await Promise.allSettled([
      sb.from('funds').select('id, name'),
      sb.from('members').select('id, name'),
      sb.from('transactions').select('*'),
      sb.from('holdings').select('*'),
      sb.from('personal_incomes').select('*'),
      sb.from('personal_solo_assets').select('*')
    ]);

    const funds = fRes.status === 'fulfilled' && !fRes.value.error ? fRes.value.data : [];
    const members = mRes.status === 'fulfilled' && !mRes.value.error ? mRes.value.data : [];
    const transactions = tRes.status === 'fulfilled' && !tRes.value.error ? tRes.value.data : [];
    const holdings = hRes.status === 'fulfilled' && !hRes.value.error ? hRes.value.data : [];
    const incomes = iRes.status === 'fulfilled' && !iRes.value.error ? iRes.value.data : [];
    const assets = aRes.status === 'fulfilled' && !aRes.value.error ? aRes.value.data : [];

    const errors = [];
    if (fRes.status === 'rejected' || fRes.value?.error) errors.push(`funds: ${fRes.value?.error?.message || fRes.reason?.message}`);
    if (mRes.status === 'rejected' || mRes.value?.error) errors.push(`members: ${mRes.value?.error?.message || mRes.reason?.message}`);
    if (tRes.status === 'rejected' || tRes.value?.error) errors.push(`transactions: ${tRes.value?.error?.message || tRes.reason?.message}`);
    if (hRes.status === 'rejected' || hRes.value?.error) errors.push(`holdings: ${hRes.value?.error?.message || hRes.reason?.message}`);
    if (iRes.status === 'rejected' || iRes.value?.error) errors.push(`incomes: ${iRes.value?.error?.message || iRes.reason?.message}`);
    if (aRes.status === 'rejected' || aRes.value?.error) errors.push(`assets: ${aRes.value?.error?.message || aRes.reason?.message}`);

    return {
      success: errors.length === 0,
      counts: {
        funds: funds.length,
        members: members.length,
        transactions: transactions.length,
        holdings: holdings.length,
        incomes: incomes.length,
        assets: assets.length
      },
      memberNames: members.map(m => m.name),
      errors: errors.length > 0 ? errors.join('; ') : null
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ==========================================================================
// SUPABASE DATA API FUNCTIONS
// ==========================================================================

export async function fetchAllFromSupabase() {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    // Fetch all tables concurrently using Promise.allSettled
    // This guarantees that one table failure or empty table NEVER stops other tables from loading
    const [fundRes, membersRes, txRes, holdingsRes, incomesRes, soloAssetsRes] = await Promise.allSettled([
      sb.from('funds').select('*').limit(1),
      sb.from('members').select('*'),
      sb.from('transactions').select('*'),
      sb.from('holdings').select('*'),
      sb.from('personal_incomes').select('*'),
      sb.from('personal_solo_assets').select('*')
    ]);

    // 1. Fund Info
    let fundsData = fundRes.status === 'fulfilled' && !fundRes.value.error ? fundRes.value.data : [];
    let fund = fundsData && fundsData.length > 0 ? fundsData[0] : null;

    // Auto-create initial fund row in Supabase if table is completely empty
    if (!fund) {
      try {
        const { data: newFund } = await sb.from('funds').insert([{
          name: 'Apex Growth Syndicate',
          manager_name: 'Milan',
          initial_nav: 100.0,
          currency: 'INR'
        }]).select().single();
        if (newFund) fund = newFund;
      } catch (insertErr) {
        console.warn('Could not auto-insert default fund:', insertErr);
      }
    }

    // 2. Members
    const rawMembers = membersRes.status === 'fulfilled' && !membersRes.value.error ? (membersRes.value.data || []) : [];
    const members = rawMembers.map(m => ({
      id: m.id,
      name: m.name || 'Member',
      relationship: (m.relationship || 'friend').toLowerCase(),
      role: m.role || 'Investor',
      email: m.email || '',
      notes: m.notes || m.note || '',
    }));

    // 3. Transactions (Defensively handle event_date vs date, snake_case vs camelCase)
    const rawTx = txRes.status === 'fulfilled' && !txRes.value.error ? (txRes.value.data || []) : [];
    const sortedTx = [...rawTx].sort((a, b) => {
      const dateA = a.event_date || a.date || a.created_at || '1970-01-01';
      const dateB = b.event_date || b.date || b.created_at || '1970-01-01';
      return new Date(dateA) - new Date(dateB);
    });

    const transactions = sortedTx.map(t => {
      const dateVal = t.event_date || t.date || (t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
      const typeVal = String(t.type || 'deposit').toLowerCase();
      const amountVal = Number(t.amount) || 0;
      const navVal = Number(t.nav) || 100.0;
      const unitsVal = Number(t.units) || (navVal > 0 && typeVal !== 'valuation_update' ? amountVal / navVal : 0);
      const memberIdVal = t.member_id || t.memberId || t.participant_id || null;
      const noteVal = t.note || t.memo || t.description || '';

      // Try to resolve memberName if missing
      let memberNameVal = t.member_name || t.memberName || null;
      if (!memberNameVal && memberIdVal) {
        const foundMem = members.find(m => m.id === memberIdVal || String(m.id).toLowerCase() === String(memberIdVal).toLowerCase());
        if (foundMem) memberNameVal = foundMem.name;
      }
      if (!memberIdVal && noteVal) {
        const foundByNote = members.find(m => noteVal.toLowerCase().includes(m.name.toLowerCase()));
        if (foundByNote) {
          memberNameVal = foundByNote.name;
        }
      }

      return {
        id: t.id || `tx_${Math.random()}`,
        date: dateVal,
        type: typeVal,
        memberId: memberIdVal,
        memberName: memberNameVal,
        amount: amountVal,
        nav: navVal,
        units: unitsVal,
        note: noteVal,
      };
    });

    // 4. Holdings (Defensively handle snake_case vs camelCase and units)
    const rawHoldings = holdingsRes.status === 'fulfilled' && !holdingsRes.value.error ? (holdingsRes.value.data || []) : [];
    const holdings = rawHoldings.map(h => {
      let parsedUnits = Number(h.units ?? h.quantity ?? 0);
      if ((!parsedUnits || isNaN(parsedUnits)) && h.notes) {
        const match = String(h.notes).match(/\[UNITS:\s*([\d\.]+)\]/i);
        if (match && match[1]) parsedUnits = Number(match[1]);
      }

      return {
        id: h.id,
        ticker: h.ticker || h.symbol || h.name || 'HOLD',
        name: h.name || h.ticker || 'Asset Position',
        category: h.category || 'Mutual Funds',
        investedAmount: Number(h.invested_amount ?? h.investedAmount ?? h.cost_price ?? 0),
        currentValue: Number(h.current_value ?? h.currentValue ?? h.market_value ?? 0),
        units: parsedUnits > 0 ? parsedUnits : (h.units ? Number(h.units) : null),
        notes: h.notes || h.note || '',
      };
    });

    // 5. Personal Incomes
    const rawIncomes = incomesRes.status === 'fulfilled' && !incomesRes.value.error ? (incomesRes.value.data || []) : [];
    const monthlyIncome = rawIncomes.map(i => ({
      id: i.id,
      source: i.source || i.name || 'Income Source',
      category: i.category || 'Salary',
      recurrence: i.recurrence || 'Monthly',
      amount: Number(i.amount) || 0,
      date: i.event_date || i.date || (i.created_at ? i.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    }));

    // 6. Personal Solo Assets
    const rawSoloAssets = soloAssetsRes.status === 'fulfilled' && !soloAssetsRes.value.error ? (soloAssetsRes.value.data || []) : [];
    const personalSoloAssets = rawSoloAssets.map(a => ({
      id: a.id,
      name: a.name || 'Personal Asset',
      category: a.category || 'Fixed Deposit',
      value: Number(a.value ?? a.amount ?? 0),
      institution: a.institution || a.bank || '',
    }));

    return {
      fundInfo: fund ? {
        id: fund.id,
        name: fund.name,
        managerName: fund.manager_name || fund.managerName || 'Milan',
        initialNav: Number(fund.initial_nav || fund.initialNav || 100.0),
        currency: fund.currency || 'INR',
      } : {
        name: 'Apex Growth Syndicate',
        managerName: 'Milan',
        initialNav: 100.0,
        currency: 'INR'
      },
      members,
      transactions,
      holdings,
      personalFinances: {
        monthlyIncome,
        personalSoloAssets,
      }
    };
  } catch (error) {
    console.error('Failed to fetch from Supabase:', error);
    return null;
  }
}

export function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

export async function insertTransactionToSupabase(tx, fundId) {
  const sb = getSupabase();
  if (!sb) return null;

  // Resolve valid fund_id
  let activeFundId = (fundId && isValidUUID(fundId)) ? fundId : null;
  if (!activeFundId) {
    try {
      const { data: fData } = await sb.from('funds').select('id').limit(1);
      if (fData && fData.length > 0) {
        activeFundId = fData[0].id;
      }
    } catch (e) {
      console.warn('Could not auto-resolve fund id:', e);
    }
  }

  // Resolve valid member_id
  let activeMemberId = (tx.memberId && isValidUUID(tx.memberId)) ? tx.memberId : null;
  if (!activeMemberId && tx.type !== 'valuation_update') {
    try {
      const { data: mems } = await sb.from('members').select('id, name');
      if (mems && mems.length > 0) {
        const found = mems.find(m => 
          m.id === tx.memberId || 
          m.name.toLowerCase() === (tx.memberName || '').toLowerCase() ||
          (tx.note && tx.note.toLowerCase().includes(m.name.toLowerCase()))
        ) || mems[0];
        activeMemberId = found?.id || null;
      }
    } catch (e) {
      console.warn('Could not auto-resolve member id:', e);
    }
  }

  const rawDate = tx.date || new Date().toISOString().split('T')[0];
  const normalizedType = String(tx.type || 'deposit').toLowerCase();
  const numAmount = Number(tx.amount) || 0;
  const numNav = Number(tx.nav) || 100.0;
  const numUnits = Number(tx.units) || (numNav > 0 && normalizedType !== 'valuation_update' ? numAmount / numNav : 0);

  // Attempt insert with event_date first
  const payload1 = {
    type: normalizedType,
    amount: numAmount,
    nav: numNav,
    units: numUnits,
    note: tx.note || null,
    event_date: rawDate,
  };
  if (activeFundId) payload1.fund_id = activeFundId;
  if (activeMemberId && normalizedType !== 'valuation_update') payload1.member_id = activeMemberId;

  let res = await sb.from('transactions').insert([payload1]).select().single();

  // If failed due to column event_date not existing, fallback to date
  if (res.error && res.error.message && (res.error.message.includes('event_date') || res.error.code === '42703')) {
    const payload2 = {
      type: normalizedType,
      amount: numAmount,
      nav: numNav,
      units: numUnits,
      note: tx.note || null,
      date: rawDate,
    };
    if (activeFundId) payload2.fund_id = activeFundId;
    if (activeMemberId && normalizedType !== 'valuation_update') payload2.member_id = activeMemberId;
    res = await sb.from('transactions').insert([payload2]).select().single();
  }

  if (res.error) {
    console.error('Error inserting transaction to Supabase:', res.error);
    throw res.error;
  }
  return res.data;
}

export async function insertMemberToSupabase(member, fundId) {
  const sb = getSupabase();
  if (!sb) return null;

  let activeFundId = (fundId && isValidUUID(fundId)) ? fundId : null;
  if (!activeFundId) {
    try {
      const { data: fData } = await sb.from('funds').select('id').limit(1);
      if (fData && fData.length > 0) {
        activeFundId = fData[0].id;
      }
    } catch (e) {
      // ignore
    }
  }

  const payload = {
    name: member.name,
    relationship: member.relationship || 'friend',
    role: member.role || 'Investor',
    email: member.email || null,
    notes: member.notes || null,
  };
  if (activeFundId) payload.fund_id = activeFundId;

  const { data, error } = await sb.from('members').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function upsertHoldingToSupabase(holding, fundId) {
  const sb = getSupabase();
  if (!sb) return null;

  let activeFundId = (fundId && isValidUUID(fundId)) ? fundId : null;
  if (!activeFundId) {
    try {
      const { data: fData } = await sb.from('funds').select('id').limit(1);
      if (fData && fData.length > 0) activeFundId = fData[0].id;
    } catch (e) {}
  }

  // Backup units in notes metadata in case Postgres schema lacks units column
  let notesVal = holding.notes || '';
  if (holding.units && Number(holding.units) > 0) {
    if (!notesVal.includes('[UNITS:')) {
      notesVal = notesVal ? `${notesVal} [UNITS: ${holding.units}]` : `[UNITS: ${holding.units}]`;
    } else {
      notesVal = notesVal.replace(/\[UNITS:\s*[\d\.]+\]/gi, `[UNITS: ${holding.units}]`);
    }
  }

  const payload = {
    ticker: holding.ticker || holding.symbol || 'HOLD',
    name: holding.name || holding.ticker || 'Asset Position',
    category: holding.category || 'Mutual Funds',
    invested_amount: Number(holding.investedAmount) || 0,
    current_value: Number(holding.currentValue) || 0,
    notes: notesVal || null,
  };
  if (activeFundId) payload.fund_id = activeFundId;

  if (holding.id && isValidUUID(holding.id)) {
    payload.id = holding.id;
  }

  if (holding.units && Number(holding.units) > 0) {
    payload.units = Number(holding.units);
  }

  try {
    const { data, error } = await sb.from('holdings').upsert([payload]).select().single();
    if (error) {
      if (error.message && error.message.includes('units')) {
        delete payload.units;
        const { data: retryData, error: retryErr } = await sb.from('holdings').upsert([payload]).select().single();
        if (retryErr) throw retryErr;
        return retryData;
      }
      throw error;
    }
    return data;
  } catch (err) {
    if (err.message && err.message.includes('units')) {
      delete payload.units;
      const { data: retryData, error: retryErr } = await sb.from('holdings').upsert([payload]).select().single();
      if (retryErr) throw retryErr;
      return retryData;
    }
    throw err;
  }
}

export async function deleteHoldingFromSupabase(id) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('holdings').delete().eq('id', id);
}

export async function insertIncomeToSupabase(income) {
  const sb = getSupabase();
  if (!sb) return null;

  const rawDate = income.date || new Date().toISOString().split('T')[0];
  const payload1 = {
    source: income.source,
    category: income.category,
    recurrence: income.recurrence,
    amount: Number(income.amount) || 0,
    event_date: rawDate,
  };

  let res = await sb.from('personal_incomes').insert([payload1]).select().single();
  if (res.error && res.error.message && (res.error.message.includes('event_date') || res.error.code === '42703')) {
    const payload2 = {
      source: income.source,
      category: income.category,
      recurrence: income.recurrence,
      amount: Number(income.amount) || 0,
      date: rawDate,
    };
    res = await sb.from('personal_incomes').insert([payload2]).select().single();
  }

  if (res.error) throw res.error;
  return res.data;
}

export async function deleteIncomeFromSupabase(id) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('personal_incomes').delete().eq('id', id);
}

export async function insertSoloAssetToSupabase(asset) {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb.from('personal_solo_assets').insert([{
    name: asset.name,
    category: asset.category,
    value: Number(asset.value) || 0,
    institution: asset.institution || null,
  }]).select().single();

  if (error) throw error;
  return data;
}

export async function deleteSoloAssetFromSupabase(id) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('personal_solo_assets').delete().eq('id', id);
}

export async function updateFundInSupabase(fundId, info) {
  const sb = getSupabase();
  if (!sb || !fundId) return;

  await sb.from('funds').update({
    name: info.name,
    manager_name: info.managerName,
    currency: info.currency,
  }).eq('id', fundId);
}

export async function wipeSupabaseDatabase() {
  const sb = getSupabase();
  if (!sb) return false;

  // Delete all rows from tables
  await sb.from('transactions').delete().neq('amount', -999999999);
  await sb.from('members').delete().neq('name', '___NON_EXISTENT___');
  await sb.from('holdings').delete().neq('ticker', '___NON_EXISTENT___');
  await sb.from('personal_incomes').delete().neq('source', '___NON_EXISTENT___');
  await sb.from('personal_solo_assets').delete().neq('name', '___NON_EXISTENT___');

  return true;
}

// ==========================================================================
// SUPABASE AUTH GATEWAY METHODS
// ==========================================================================

export async function signInWithEmail(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured yet. Check your URL and Key in Settings.');
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured yet. Check your URL and Key in Settings.');
  const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured yet. Check your URL and Key in Settings.');
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    }
  });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

export async function getAuthSession() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    return data?.session || null;
  } catch (e) {
    return null;
  }
}

export function onAuthChange(callback) {
  const sb = getSupabase();
  if (!sb) return { data: { subscription: { unsubscribe: () => {} } } };
  return sb.auth.onAuthStateChange(callback);
}

