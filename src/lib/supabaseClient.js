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

const DEFAULT_SUPABASE_URL = 'https://bncqjgflhilmmhousnkr.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuY3FqZ2ZsaGlsbW1ob3VzbmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjIwMjgsImV4cCI6MjEwNjUzODAyOH0.MzHwp7QLjkKZQqM1g8qYPvZv9Jwj-r3hMXQg4412Vpc';

// Retrieve credentials from .env, localStorage, or fallback
export function getSupabaseCredentials() {
  const envUrl = import.meta.env?.VITE_SUPABASE_URL;
  const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
  const localUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('syndicate_sb_url') : null;
  const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem('syndicate_sb_key') : null;

  const rawUrl = (localUrl && localUrl.trim() !== '') 
    ? localUrl 
    : (envUrl && envUrl !== 'YOUR_SUPABASE_URL' && envUrl.trim() !== '') 
    ? envUrl 
    : DEFAULT_SUPABASE_URL;

  const rawKey = (localKey && localKey.trim() !== '') 
    ? localKey 
    : (envKey && envKey !== 'YOUR_SUPABASE_ANON_KEY' && envKey.trim() !== '') 
    ? envKey 
    : DEFAULT_SUPABASE_ANON_KEY;

  const url = cleanSupabaseUrl(rawUrl);
  const key = cleanSupabaseKey(rawKey);

  return { url, key };
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url.startsWith('http') && url.includes('supabase.co'));
}

let supabaseInstance = null;
let cachedKey = null;

export function getSupabase() {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return null;

  if (!supabaseInstance || supabaseInstance.supabaseUrl !== url || cachedKey !== key) {
    try {
      supabaseInstance = createClient(url, key);
      cachedKey = key;
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

export async function fetchAllFromSupabase(targetFundId = null, currentUser = null) {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const userEmail = currentUser?.email ? currentUser.email.toLowerCase().trim() : null;
    const userId = currentUser?.id || null;

    // Fetch all tables concurrently using Promise.allSettled
    const [fundRes, membersRes, txRes, holdingsRes, incomesRes, soloAssetsRes] = await Promise.allSettled([
      sb.from('funds').select('*'),
      sb.from('members').select('*'),
      sb.from('transactions').select('*'),
      sb.from('holdings').select('*'),
      sb.from('personal_incomes').select('*'),
      sb.from('personal_solo_assets').select('*')
    ]);

    const allFunds = fundRes.status === 'fulfilled' && !fundRes.value.error ? (fundRes.value.data || []) : [];
    const allMembers = membersRes.status === 'fulfilled' && !membersRes.value.error ? (membersRes.value.data || []) : [];
    const allTx = txRes.status === 'fulfilled' && !txRes.value.error ? (txRes.value.data || []) : [];
    const allHoldings = holdingsRes.status === 'fulfilled' && !holdingsRes.value.error ? (holdingsRes.value.data || []) : [];
    const allIncomes = incomesRes.status === 'fulfilled' && !incomesRes.value.error ? (incomesRes.value.data || []) : [];
    const allSoloAssets = soloAssetsRes.status === 'fulfilled' && !soloAssetsRes.value.error ? (soloAssetsRes.value.data || []) : [];

    // Helper to determine member verification status
    function parseMemberStatus(m) {
      if (!m) return 'active';
      const rel = (m.relationship || '').toLowerCase();
      const role = (m.role || '').toLowerCase();
      if (rel === 'self' || role === 'manager') return 'active';
      if (m.status) return m.status;
      const note = m.notes || m.note || '';
      if (note.includes('[STATUS: invited]')) return 'invited';
      if (note.includes('[STATUS: declined]')) return 'declined';
      if (note.includes('[STATUS: active]')) return 'active';
      return 'active';
    }

    // Filter accessible funds for this user & collect pending invitations
    let accessibleFunds = [];
    const pendingInvitations = [];

    if (!userEmail || userEmail === 'milan@localhost' || userEmail === 'dev@localhost') {
      // Local development or unauthenticated: access all available funds
      accessibleFunds = allFunds;
    } else {
      // Authenticated with email:
      // 1. Funds where user is manager/owner
      // 2. Funds where user is verified active member (NOT unverified pending invitation)
      accessibleFunds = allFunds.filter(f => {
        const ownerEmail = (f.owner_email || '').toLowerCase().trim();
        if (ownerEmail && ownerEmail === userEmail) return true;
        if (f.owner_id && userId && f.owner_id === userId) return true;

        // Check if user is linked by email as an investor in this fund's members
        const myMemberRecords = allMembers.filter(m => 
          m.fund_id === f.id && m.email && m.email.toLowerCase().trim() === userEmail
        );

        for (const m of myMemberRecords) {
          const status = parseMemberStatus(m);
          if (status === 'active') {
            return true;
          }
        }

        return false;
      });

      // Find any invitations pending verification for this user
      const myInvitedMembers = allMembers.filter(m => {
        if (!m.email || m.email.toLowerCase().trim() !== userEmail) return false;
        return parseMemberStatus(m) === 'invited';
      });

      for (const m of myInvitedMembers) {
        const f = allFunds.find(fundItem => fundItem.id === m.fund_id);
        if (f && !pendingInvitations.some(p => p.memberId === m.id)) {
          pendingInvitations.push({
            memberId: m.id,
            fundId: f.id,
            fundName: f.name || 'Syndicate Pool',
            managerName: f.manager_name || 'Fund Manager',
            currency: f.currency || 'INR',
            invitedEmail: m.email,
            date: m.created_at || new Date().toISOString()
          });
        }
      }
    }

    // Auto-create a clean, private fund profile for new users with no accessible funds and no pending invitations
    if (accessibleFunds.length === 0 && pendingInvitations.length === 0 && userEmail) {
      try {
        const userName = currentUser?.user_metadata?.full_name || userEmail.split('@')[0] || 'Fund Manager';
        const newFundPayload = {
          name: `${userName}'s Syndicate Pool`,
          manager_name: userName,
          initial_nav: 100.0,
          currency: 'INR',
          owner_email: userEmail
        };
        if (userId) newFundPayload.owner_id = userId;

        const { data: createdFund } = await sb.from('funds').insert([newFundPayload]).select().single();
        if (createdFund) {
          accessibleFunds = [createdFund];
          allFunds.push(createdFund);

          // Add user as Self/Manager member
          const { data: createdMem } = await sb.from('members').insert([{
            fund_id: createdFund.id,
            name: userName,
            relationship: 'self',
            role: 'Manager',
            email: userEmail,
            notes: 'Primary fund manager [STATUS: active]'
          }]).select().single();
          if (createdMem) allMembers.push(createdMem);
        }
      } catch (err) {
        console.warn('Could not auto-create personal fund for new user:', err);
      }
    }

    // Determine active fund
    let fund = null;
    if (targetFundId) {
      fund = accessibleFunds.find(f => f.id === targetFundId) || accessibleFunds[0];
    } else {
      fund = accessibleFunds[0] || null;
    }

    const activeFundId = fund?.id || null;

    // Filter members strictly by active fund
    const rawMembers = allMembers.filter(m => !activeFundId || m.fund_id === activeFundId);
    const members = rawMembers.map(m => {
      const isMe = userEmail && m.email && m.email.toLowerCase().trim() === userEmail;
      return {
        id: m.id,
        name: m.name || 'Member',
        relationship: (m.relationship || 'friend').toLowerCase(),
        role: m.role || 'Investor',
        email: m.email || '',
        notes: m.notes || m.note || '',
        status: parseMemberStatus(m),
        isMe: Boolean(isMe),
      };
    });

    const currentMemberRecord = members.find(m => m.isMe) || null;

    // Filter transactions strictly by active fund
    const rawTx = allTx.filter(t => !activeFundId || t.fund_id === activeFundId);
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

      let memberNameVal = t.member_name || t.memberName || null;
      if (!memberNameVal && memberIdVal) {
        const foundMem = members.find(m => m.id === memberIdVal || String(m.id).toLowerCase() === String(memberIdVal).toLowerCase());
        if (foundMem) memberNameVal = foundMem.name;
      }
      if (!memberIdVal && noteVal) {
        const foundByNote = members.find(m => noteVal.toLowerCase().includes(m.name.toLowerCase()));
        if (foundByNote) memberNameVal = foundByNote.name;
      }

      const isMyTx = currentMemberRecord ? (memberIdVal === currentMemberRecord.id) : false;

      // Two-way verification status: from column or parsed from note fallback
      let statusVal = t.status || 'verified';
      if (!t.status && noteVal) {
        if (noteVal.includes('[STATUS: pending]')) statusVal = 'pending';
        else if (noteVal.includes('[STATUS: disputed]')) statusVal = 'disputed';
        else if (noteVal.includes('[STATUS: verified]')) statusVal = 'verified';
      }

      const verifiedAtVal = t.verified_at || null;
      const verificationNotesVal = t.verification_notes || null;

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
        status: statusVal,
        verifiedAt: verifiedAtVal,
        verificationNotes: verificationNotesVal,
        isMyTx,
      };
    });

    // Retain fund valuation updates, active member transactions, and historical settled records
    const validTransactions = transactions.filter(t => {
      if (t.type === 'valuation_update') return true;
      if (t.memberId && members.some(m => String(m.id).toLowerCase() === String(t.memberId).toLowerCase())) return true;
      // Retain audited historical records with member name
      if (t.memberName || (t.note && (t.note.toLowerCase().includes('payout') || t.note.toLowerCase().includes('exit')))) {
        return true;
      }
      return false;
    });
    // Classify user's role in the currently selected fund
    const isCurrentFundOwner = Boolean(
      (userEmail && fund?.owner_email && fund.owner_email.toLowerCase().trim() === userEmail) ||
      (userId && fund?.owner_id && fund.owner_id === userId) ||
      (!fund?.owner_email && !fund?.owner_id) // unassigned default
    );

    // Read portfolio visibility for the active fund (default 'private')
    const storedVisibility = fund?.id ? localStorage.getItem(`syndicate_fund_${fund.id}_visibility`) : null;
    const portfolioVisibility = fund?.portfolio_visibility || storedVisibility || 'private';
    const isInvestorView = !isCurrentFundOwner;

    const rawHoldings = allHoldings.filter(h => !activeFundId || h.fund_id === activeFundId);
    const holdings = rawHoldings.map((h, idx) => {
      let parsedUnits = Number(h.units ?? h.quantity ?? 0);
      if ((!parsedUnits || isNaN(parsedUnits)) && h.notes) {
        const match = String(h.notes).match(/\[UNITS:\s*([\d\.]+)\]/i);
        if (match && match[1]) parsedUnits = Number(match[1]);
      }

      const investedAmt = Number(h.invested_amount ?? h.investedAmount ?? h.cost_price ?? 0);
      const currentVal = Number(h.current_value ?? h.currentValue ?? h.market_value ?? 0);

      // If investor view and private portfolio, redact confidential strategy details
      if (isInvestorView && portfolioVisibility === 'private') {
        return {
          id: h.id || `h_${idx}`,
          ticker: `ASSET-${idx + 1}`,
          name: `${h.category || 'Portfolio'} Allocation`,
          category: h.category || 'Asset Allocation',
          investedAmount: investedAmt,
          currentValue: currentVal,
          units: null,
          notes: 'Confidential Discretionary Mandate',
          isRedacted: true,
        };
      }

      if (isInvestorView && portfolioVisibility === 'summary') {
        return {
          id: h.id || `h_${idx}`,
          ticker: `${(h.category || 'ASSET').slice(0, 4).toUpperCase()}-${idx + 1}`,
          name: `${h.category || 'Asset Position'}`,
          category: h.category || 'Mutual Funds',
          investedAmount: investedAmt,
          currentValue: currentVal,
          units: null,
          notes: '',
          isRedacted: true,
        };
      }

      return {
        id: h.id,
        ticker: h.ticker || h.symbol || h.name || 'HOLD',
        name: h.name || h.ticker || 'Asset Position',
        category: h.category || 'Mutual Funds',
        investedAmount: investedAmt,
        currentValue: currentVal,
        units: parsedUnits > 0 ? parsedUnits : (h.units ? Number(h.units) : null),
        notes: h.notes || h.note || '',
        isRedacted: false,
      };
    });

    // Filter Personal Finances strictly by current user
    // Personal salary and solo assets are NEVER shared with other users
    const filteredIncomes = allIncomes.filter(i => {
      if (!userEmail) return true;
      if (i.user_email) return i.user_email.toLowerCase().trim() === userEmail;
      if (i.user_id && userId) return i.user_id === userId;
      return false;
    });

    const monthlyIncome = filteredIncomes.map(i => ({
      id: i.id,
      source: i.source || i.name || 'Income Source',
      category: i.category || 'Salary',
      recurrence: i.recurrence || 'Monthly',
      amount: Number(i.amount) || 0,
      date: i.event_date || i.date || (i.created_at ? i.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    }));

    const filteredSoloAssets = allSoloAssets.filter(a => {
      if (!userEmail) return true;
      if (a.user_email) return a.user_email.toLowerCase().trim() === userEmail;
      if (a.user_id && userId) return a.user_id === userId;
      return false;
    });

    const personalSoloAssets = filteredSoloAssets.map(a => ({
      id: a.id,
      name: a.name || 'Personal Asset',
      category: a.category || 'Fixed Deposit',
      value: Number(a.value ?? a.amount ?? 0),
      institution: a.institution || a.bank || '',
    }));

    const availableFunds = accessibleFunds.map(f => {
      const isFundOwner = Boolean(
        (userEmail && f.owner_email && f.owner_email.toLowerCase().trim() === userEmail) ||
        (userId && f.owner_id && f.owner_id === userId)
      );
      return {
        id: f.id,
        name: f.name || 'Syndicate Pool',
        managerName: f.manager_name || 'Manager',
        isOwner: isFundOwner,
        role: isFundOwner ? 'manager' : 'investor',
        currency: f.currency || 'INR',
      };
    });

    return {
      availableFunds,
      pendingInvitations,
      fundInfo: fund ? {
        id: fund.id,
        name: fund.name || 'Syndicate Pool',
        managerName: fund.manager_name || fund.managerName || 'Manager',
        initialNav: Number(fund.initial_nav || fund.initialNav || 100.0),
        currency: fund.currency || 'INR',
        ownerEmail: fund.owner_email || null,
        ownerId: fund.owner_id || null,
        isOwner: isCurrentFundOwner,
        userRole: isCurrentFundOwner ? 'manager' : 'investor',
        portfolioVisibility,
        myMemberId: currentMemberRecord?.id || null,
      } : {
        name: 'Syndicate Pool',
        managerName: 'Manager',
        initialNav: 100.0,
        currency: 'INR',
        isOwner: true,
        userRole: 'manager',
        portfolioVisibility: 'private',
        myMemberId: null,
      },
      members,
      transactions: validTransactions,
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
  const txStatus = tx.status || 'verified';

  // Construct note with embedded fallback tag if needed
  let noteText = tx.note || null;
  if (txStatus !== 'verified' && noteText && !noteText.includes('[STATUS:')) {
    noteText = `${noteText} [STATUS: ${txStatus}]`;
  } else if (txStatus !== 'verified' && !noteText) {
    noteText = `[STATUS: ${txStatus}]`;
  }

  // Attempt insert with status & event_date first
  const payload1 = {
    type: normalizedType,
    amount: numAmount,
    nav: numNav,
    units: numUnits,
    note: noteText,
    event_date: rawDate,
    status: txStatus,
  };
  if (activeFundId) payload1.fund_id = activeFundId;
  if (activeMemberId && normalizedType !== 'valuation_update') payload1.member_id = activeMemberId;

  let res = await sb.from('transactions').insert([payload1]).select().single();

  // If failed due to column status not existing, remove status and rely on note tag
  if (res.error && (res.error.message?.includes('status') || res.error.code === '42703')) {
    delete payload1.status;
    res = await sb.from('transactions').insert([payload1]).select().single();
  }

  // If failed due to column event_date not existing, fallback to date
  if (res.error && res.error.message && (res.error.message.includes('event_date') || res.error.code === '42703')) {
    const payload2 = {
      type: normalizedType,
      amount: numAmount,
      nav: numNav,
      units: numUnits,
      note: noteText,
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

export async function updateTransactionStatusInSupabase(txId, newStatus, verificationNotes = '', currentUser = null) {
  const sb = getSupabase();
  if (!sb || !txId) return null;

  const now = new Date().toISOString();
  let payload = {
    status: newStatus,
    verified_at: now,
    verification_notes: verificationNotes || null,
  };
  if (currentUser?.id) payload.verified_by = currentUser.id;

  let res = await sb.from('transactions').update(payload).eq('id', txId).select().single();

  // If status column doesn't exist yet in Supabase, fallback to updating the note
  if (res.error && (res.error.message?.includes('status') || res.error.code === '42703')) {
    const { data: existingTx } = await sb.from('transactions').select('note').eq('id', txId).single();
    let currentNote = existingTx?.note || '';
    currentNote = currentNote.replace(/\[STATUS:\s*\w+\]/g, '').trim();
    const updatedNote = `${currentNote} [STATUS: ${newStatus}]${verificationNotes ? ` (${verificationNotes})` : ''}`.trim();
    res = await sb.from('transactions').update({ note: updatedNote }).eq('id', txId).select().single();
  }

  if (res.error) {
    console.error('Error updating transaction status:', res.error);
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

  const isSelf = (member.relationship || '').toLowerCase() === 'self' || (member.role || '').toLowerCase() === 'manager';
  const initialStatus = isSelf ? 'active' : 'invited';

  let notesVal = member.notes || '';
  if (!isSelf && !notesVal.includes('[STATUS:')) {
    notesVal = notesVal ? `${notesVal} [STATUS: invited]` : `[STATUS: invited]`;
  } else if (isSelf && !notesVal.includes('[STATUS:')) {
    notesVal = notesVal ? `${notesVal} [STATUS: active]` : `[STATUS: active]`;
  }

  const payload = {
    name: member.name,
    relationship: member.relationship || 'friend',
    role: member.role || 'Investor',
    email: member.email || null,
    notes: notesVal || null,
    status: initialStatus,
  };
  if (activeFundId) payload.fund_id = activeFundId;

  let { data, error } = await sb.from('members').insert([payload]).select().single();
  if (error && (error.message?.includes('status') || error.code === '42703')) {
    delete payload.status;
    const retry = await sb.from('members').insert([payload]).select().single();
    if (retry.error) throw retry.error;
    return retry.data;
  }
  if (error) throw error;
  return data;
}

export async function acceptSyndicateInvitation(memberId) {
  const sb = getSupabase();
  if (!sb || !memberId) return null;

  // 1. Fetch current member record to preserve notes
  const { data: mem, error: fetchErr } = await sb.from('members').select('*').eq('id', memberId).single();
  if (fetchErr) throw fetchErr;

  let updatedNotes = (mem.notes || '').replace(/\[STATUS:\s*invited\]/gi, '[STATUS: active]').trim();
  if (!updatedNotes.includes('[STATUS: active]')) {
    updatedNotes = `${updatedNotes} [STATUS: active]`.trim();
  }

  const payload = {
    status: 'active',
    notes: updatedNotes
  };

  let { data, error } = await sb.from('members').update(payload).eq('id', memberId).select().single();
  if (error && (error.message?.includes('status') || error.code === '42703')) {
    delete payload.status;
    const retry = await sb.from('members').update(payload).eq('id', memberId).select().single();
    if (retry.error) throw retry.error;
    return retry.data;
  }
  if (error) throw error;
  return data;
}

export async function declineSyndicateInvitation(memberId) {
  const sb = getSupabase();
  if (!sb || !memberId) return null;

  // Decline by removing member from pool invitation roster
  const { error } = await sb.from('members').delete().eq('id', memberId);
  if (error) throw error;
  return true;
}

export async function deleteMemberFromSupabase(memberId, options = {}) {
  const sb = getSupabase();
  if (!sb || !memberId) return;

  if (options.action === 'purge') {
    // Purge mistake/test entries completely from ledger
    try {
      await sb.from('transactions').delete().eq('member_id', memberId);
    } catch (err) {
      console.warn('Could not purge member transactions:', err);
    }
  } else {
    // Member exited with payout recorded: disassociate transactions so audit trail remains in ledger
    try {
      await sb.from('transactions').update({ member_id: null }).eq('member_id', memberId);
    } catch (err) {}
  }

  // Delete member from members roster
  const { error } = await sb.from('members').delete().eq('id', memberId);
  if (error) throw error;
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

export async function insertIncomeToSupabase(income, currentUser = null) {
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
  if (currentUser?.email) payload1.user_email = currentUser.email.toLowerCase().trim();
  if (currentUser?.id) payload1.user_id = currentUser.id;

  let res = await sb.from('personal_incomes').insert([payload1]).select().single();
  if (res.error && (res.error.message?.includes('user_email') || res.error.message?.includes('user_id'))) {
    delete payload1.user_email;
    delete payload1.user_id;
    res = await sb.from('personal_incomes').insert([payload1]).select().single();
  }

  if (res.error && res.error.message && (res.error.message.includes('event_date') || res.error.code === '42703')) {
    const payload2 = {
      source: income.source,
      category: income.category,
      recurrence: income.recurrence,
      amount: Number(income.amount) || 0,
      date: rawDate,
    };
    if (currentUser?.email) payload2.user_email = currentUser.email.toLowerCase().trim();
    if (currentUser?.id) payload2.user_id = currentUser.id;
    res = await sb.from('personal_incomes').insert([payload2]).select().single();
    if (res.error && (res.error.message?.includes('user_email') || res.error.message?.includes('user_id'))) {
      delete payload2.user_email;
      delete payload2.user_id;
      res = await sb.from('personal_incomes').insert([payload2]).select().single();
    }
  }

  if (res.error) throw res.error;
  return res.data;
}

export async function deleteIncomeFromSupabase(id) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('personal_incomes').delete().eq('id', id);
}

export async function insertSoloAssetToSupabase(asset, currentUser = null) {
  const sb = getSupabase();
  if (!sb) return null;

  const payload = {
    name: asset.name,
    category: asset.category,
    value: Number(asset.value) || 0,
    institution: asset.institution || null,
  };
  if (currentUser?.email) payload.user_email = currentUser.email.toLowerCase().trim();
  if (currentUser?.id) payload.user_id = currentUser.id;

  let res = await sb.from('personal_solo_assets').insert([payload]).select().single();
  if (res.error && (res.error.message?.includes('user_email') || res.error.message?.includes('user_id'))) {
    delete payload.user_email;
    delete payload.user_id;
    res = await sb.from('personal_solo_assets').insert([payload]).select().single();
  }

  if (res.error) throw res.error;
  return res.data;
}

export async function deleteSoloAssetFromSupabase(id) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('personal_solo_assets').delete().eq('id', id);
}

export async function createFundInSupabase({ name, managerName, currency = 'INR', initialNav = 100.0 }, currentUser = null) {
  const sb = getSupabase();
  if (!sb) return null;

  const payload = {
    name: name?.trim() || 'My Syndicate Fund',
    manager_name: managerName?.trim() || currentUser?.user_metadata?.full_name || 'Fund Manager',
    initial_nav: Number(initialNav) || 100.0,
    currency: currency || 'INR',
  };

  if (currentUser?.email) payload.owner_email = currentUser.email.toLowerCase().trim();
  if (currentUser?.id) payload.owner_id = currentUser.id;

  const { data: newFund, error } = await sb.from('funds').insert([payload]).select().single();
  if (error) throw error;

  // Add the manager as a self member in the new fund
  if (newFund) {
    try {
      await sb.from('members').insert([{
        fund_id: newFund.id,
        name: payload.manager_name,
        relationship: 'self',
        role: 'Manager',
        email: currentUser?.email || null,
        notes: 'Primary fund manager'
      }]);
    } catch (e) {
      console.warn('Could not auto-add self member to new fund:', e);
    }
  }

  return newFund;
}

export async function updateFundInSupabase(fundId, info) {
  const sb = getSupabase();
  if (!fundId) return;

  if (info.portfolioVisibility) {
    try {
      localStorage.setItem(`syndicate_fund_${fundId}_visibility`, info.portfolioVisibility);
    } catch (e) {}
  }

  if (!sb) return;

  const updatePayload = {
    name: info.name,
    manager_name: info.managerName,
    currency: info.currency,
  };
  if (info.portfolioVisibility) {
    updatePayload.portfolio_visibility = info.portfolioVisibility;
  }

  const res = await sb.from('funds').update(updatePayload).eq('id', fundId);
  if (res.error && (res.error.message?.includes('portfolio_visibility') || res.error.code === '42703')) {
    delete updatePayload.portfolio_visibility;
    await sb.from('funds').update(updatePayload).eq('id', fundId);
  }
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

