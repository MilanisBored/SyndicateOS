import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { 
  INITIAL_DEMO_DATA, 
  computeFundState 
} from './utils/navEngine';
import { 
  isSupabaseConfigured, 
  fetchAllFromSupabase,
  insertTransactionToSupabase,
  insertMemberToSupabase,
  deleteMemberFromSupabase,
  upsertHoldingToSupabase,
  deleteHoldingFromSupabase,
  insertIncomeToSupabase,
  deleteIncomeFromSupabase,
  insertSoloAssetToSupabase,
  deleteSoloAssetFromSupabase,
  updateFundInSupabase,
  createFundInSupabase,
  updateTransactionStatusInSupabase,
  acceptSyndicateInvitation,
  declineSyndicateInvitation,
  getSupabase,
  getAuthSession,
  getCachedAuthSession,
  signOutUser,
  onAuthChange
} from './lib/supabaseClient';

import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import AuthGateway from './components/AuthGateway';

// Code-split secondary views & modals for faster load and smaller initial bundle
const SyndicateView = lazy(() => import('./components/SyndicateView'));
const HoldingsView = lazy(() => import('./components/HoldingsView'));
const PersonalFinanceView = lazy(() => import('./components/PersonalFinanceView'));
const StatementsView = lazy(() => import('./components/StatementsView'));
const SettingsView = lazy(() => import('./components/SettingsView'));

const TransactionModal = lazy(() => import('./components/TransactionModal'));
const MemberModal = lazy(() => import('./components/MemberModal'));
const StatementModal = lazy(() => import('./components/StatementModal'));
const CreateFundModal = lazy(() => import('./components/CreateFundModal'));
const ActionCenterModal = lazy(() => import('./components/ActionCenterModal'));

import './App.css';

import ErrorBoundary from './components/ErrorBoundary';

const STORAGE_KEY = 'syndicatevault_state_v2';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('syndicatevault_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('syndicatevault_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [session, setSession] = useState(() => getCachedAuthSession());
  const [isAuthChecking, setIsAuthChecking] = useState(() => !getCachedAuthSession());

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const currentSession = await getAuthSession();
        if (isMounted) {
          if (currentSession) {
            setSession((prev) => {
              if (prev?.user?.id === currentSession?.user?.id && prev?.user?.email === currentSession?.user?.email) {
                return prev;
              }
              return currentSession;
            });
            try {
              localStorage.setItem('syndicate_cached_session', JSON.stringify(currentSession));
            } catch (e) {}
          } else {
            setSession(null);
            try {
              localStorage.removeItem('syndicate_cached_session');
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    }

    initAuth();

    const { data: authListener } = onAuthChange((event, newSession) => {
      if (isMounted) {
        if (newSession) {
          setSession(newSession);
          try {
            localStorage.setItem('syndicate_cached_session', JSON.stringify(newSession));
          } catch (e) {}
          if (window.location.hash && window.location.hash.includes('access_token')) {
            window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
          }
        } else {
          setSession(null);
          try {
            localStorage.removeItem('syndicate_cached_session');
          } catch (e) {}
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    try {
      localStorage.removeItem('syndicate_cached_session');
      localStorage.removeItem('syndicate_cached_fund_state');
      localStorage.removeItem('syndicate_cached_funds_list');
    } catch (e) {}
    setSession(null);
    setAppState({
      fundInfo: { name: 'Syndicate Pool', managerName: 'Manager', initialNav: 100, currency: 'INR' },
      members: [],
      transactions: [],
      holdings: [],
      personalFinances: { monthlyIncome: [], personalSoloAssets: [] }
    });
    setAvailableFunds([]);
    setPendingInvitations([]);
  };

  const isConnectedToCloud = isSupabaseConfigured();
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudError, setCloudError] = useState('');

  // Primary application data state: instantaneous load from cache without layout shift
  const [appState, setAppState] = useState(() => {
    try {
      const cached = localStorage.getItem('syndicate_cached_fund_state');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.fundInfo) return parsed;
      }
    } catch (e) {}

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return {
      fundInfo: { name: 'Syndicate Pool', managerName: 'Manager', initialNav: 100, currency: 'INR' },
      members: [],
      transactions: [],
      holdings: [],
      personalFinances: { monthlyIncome: [], personalSoloAssets: [] }
    };
  });

  const [availableFunds, setAvailableFunds] = useState(() => {
    try {
      const saved = localStorage.getItem('syndicate_cached_funds_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const isFetchingRef = useRef(false);

  // Supabase Fetcher (Multi-tenant: scoped to current user session, deduplicated)
  const refreshFromSupabase = useCallback(async (targetFundId = null, force = false) => {
    if (!isSupabaseConfigured()) return;

    if (isFetchingRef.current && !force) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoadingCloud(true);
    setCloudError('');

    try {
      const cloudData = await fetchAllFromSupabase(targetFundId, session?.user);
      if (cloudData) {
        if (cloudData.availableFunds) {
          setAvailableFunds(cloudData.availableFunds);
          try {
            localStorage.setItem('syndicate_cached_funds_list', JSON.stringify(cloudData.availableFunds));
          } catch (e) {}
        }
        if (cloudData.pendingInvitations) {
          setPendingInvitations(cloudData.pendingInvitations);
        } else {
          setPendingInvitations([]);
        }

        const newAppState = {
          fundInfo: cloudData.fundInfo || { name: 'Syndicate Pool', managerName: 'Manager', initialNav: 100, currency: 'INR' },
          members: cloudData.members,
          transactions: cloudData.transactions,
          holdings: cloudData.holdings,
          personalFinances: cloudData.personalFinances,
        };

        setAppState(newAppState);

        try {
          localStorage.setItem('syndicate_cached_fund_state', JSON.stringify(newAppState));
        } catch (e) {}

        if (cloudData.fundInfo?.currency) {
          setCurrency(cloudData.fundInfo.currency);
        }
      }
    } catch (err) {
      console.error('Error fetching live data from Supabase:', err);
      setCloudError(err.message || 'Failed to fetch from Supabase. Ensure schema.sql was run.');
    } finally {
      isFetchingRef.current = false;
      setIsLoadingCloud(false);
    }
  }, [session?.user?.id, session?.user?.email]);

  const handleAcceptInvitation = async (inv) => {
    try {
      await acceptSyndicateInvitation(inv.memberId);
      await refreshFromSupabase(inv.fundId, true);
    } catch (err) {
      alert('Failed to accept syndicate invitation: ' + err.message);
    }
  };

  const handleDeclineInvitation = async (inv) => {
    try {
      await declineSyndicateInvitation(inv.memberId);
      await refreshFromSupabase(null, true);
    } catch (err) {
      alert('Failed to decline invitation: ' + err.message);
    }
  };

  useEffect(() => {
    if (isConnectedToCloud) {
      refreshFromSupabase(appState.fundInfo?.id);
    }
  }, [isConnectedToCloud, refreshFromSupabase]);

  // Persist locally if offline or local mode
  useEffect(() => {
    if (!isConnectedToCloud) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      } catch (e) {
        console.error(e);
      }
    }
  }, [appState, isConnectedToCloud]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [currency, setCurrency] = useState(appState.fundInfo?.currency || 'INR');

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalInitial, setTxModalInitial] = useState({});
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isCreateFundModalOpen, setIsCreateFundModalOpen] = useState(false);
  const [selectedMemberForStatement, setSelectedMemberForStatement] = useState(null);
  const [isActionCenterOpen, setIsActionCenterOpen] = useState(false);

  // Dual Perspective: 'auto' adapts to whether user owns this fund; manager can toggle preview
  const [perspectiveMode, setPerspectiveMode] = useState('auto');
  const effectivePerspective = perspectiveMode === 'auto'
    ? (appState.fundInfo?.userRole || 'manager')
    : perspectiveMode;

  const togglePerspective = () => {
    setPerspectiveMode((prev) => (prev === 'investor' ? 'manager' : 'investor'));
  };

  // Live Supabase Realtime synchronization
  // When fund manager adds a transaction for an investor, it immediately reflects on their screen
  useEffect(() => {
    if (!isConnectedToCloud) return;
    const sb = getSupabase();
    if (!sb) return;

    const channel = sb
      .channel('public_syndicate_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        refreshFromSupabase(appState.fundInfo?.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        refreshFromSupabase(appState.fundInfo?.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'holdings' }, () => {
        refreshFromSupabase(appState.fundInfo?.id);
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [isConnectedToCloud, refreshFromSupabase, appState.fundInfo?.id]);

  const handleCreateFund = async (fundData) => {
    if (isConnectedToCloud) {
      try {
        const created = await createFundInSupabase(fundData, session?.user);
        if (created) {
          await refreshFromSupabase(created.id);
          setIsCreateFundModalOpen(false);
        }
      } catch (err) {
        console.error('Failed to create fund:', err);
        setCloudError(`Failed to create fund: ${err.message}`);
      }
    }
  };

  const fundMetrics = useMemo(() => {
    return computeFundState(
      appState.fundInfo,
      appState.members,
      appState.transactions,
      appState.holdings
    );
  }, [appState.fundInfo, appState.members, appState.transactions, appState.holdings]);

  const setFundInfo = (newInfo) => {
    setAppState((prev) => ({ ...prev, fundInfo: newInfo }));
    if (isConnectedToCloud) {
      updateFundInSupabase(newInfo.id, newInfo).catch(console.error);
    }
  };

  const handleSaveHolding = async (holding) => {
    let resolved = holding;
    if (isConnectedToCloud) {
      try {
        const saved = await upsertHoldingToSupabase(holding, appState.fundInfo?.id);
        if (saved) resolved = { ...holding, id: saved.id };
      } catch (err) {
        console.error('Failed to save holding to Supabase:', err);
        setCloudError(`Could not save holding to database: ${err.message}`);
      }
    }

    setAppState((prev) => {
      const exists = prev.holdings.some(h => h.id === resolved.id);
      const updated = exists 
        ? prev.holdings.map(h => h.id === resolved.id ? resolved : h)
        : [...prev.holdings, resolved];
      return { ...prev, holdings: updated };
    });
  };

  const handleDeleteHolding = async (id) => {
    if (isConnectedToCloud) {
      try {
        await deleteHoldingFromSupabase(id);
      } catch (err) {
        console.error('Failed to delete holding from Supabase:', err);
      }
    }

    setAppState((prev) => ({
      ...prev,
      holdings: prev.holdings.filter(h => h.id !== id),
    }));
  };

  const setPersonalFinances = (newFinancesAction) => {
    setAppState((prev) => {
      const updated = typeof newFinancesAction === 'function' ? newFinancesAction(prev.personalFinances) : newFinancesAction;
      return { ...prev, personalFinances: updated };
    });
  };

  const handleAddIncome = async (newInc) => {
    let resolved = newInc;
    if (isConnectedToCloud) {
      try {
        const inserted = await insertIncomeToSupabase(newInc, session?.user);
        if (inserted) resolved = { ...newInc, id: inserted.id };
      } catch (err) {
        console.error('Failed to save income to Supabase:', err);
        setCloudError(`Could not save income to database: ${err.message}`);
      }
    }
    setAppState((prev) => ({
      ...prev,
      personalFinances: {
        ...prev.personalFinances,
        monthlyIncome: [resolved, ...prev.personalFinances.monthlyIncome],
      }
    }));
  };

  const handleDeleteIncome = async (id) => {
    if (isConnectedToCloud) {
      try {
        await deleteIncomeFromSupabase(id);
      } catch (err) {
        console.error('Failed to delete income from Supabase:', err);
      }
    }
    setAppState((prev) => ({
      ...prev,
      personalFinances: {
        ...prev.personalFinances,
        monthlyIncome: prev.personalFinances.monthlyIncome.filter(i => i.id !== id),
      }
    }));
  };

  const handleAddSoloAsset = async (newAst) => {
    let resolved = newAst;
    if (isConnectedToCloud) {
      try {
        const inserted = await insertSoloAssetToSupabase(newAst, session?.user);
        if (inserted) resolved = { ...newAst, id: inserted.id };
      } catch (err) {
        console.error('Failed to save solo asset to Supabase:', err);
        setCloudError(`Could not save solo asset to database: ${err.message}`);
      }
    }
    setAppState((prev) => ({
      ...prev,
      personalFinances: {
        ...prev.personalFinances,
        personalSoloAssets: [...prev.personalSoloAssets, resolved],
      }
    }));
  };

  const handleDeleteSoloAsset = async (id) => {
    if (isConnectedToCloud) {
      try {
        await deleteSoloAssetFromSupabase(id);
      } catch (err) {
        console.error('Failed to delete solo asset from Supabase:', err);
      }
    }
    setAppState((prev) => ({
      ...prev,
      personalFinances: {
        ...prev.personalFinances,
        personalSoloAssets: prev.personalSoloAssets.filter(a => a.id !== id),
      }
    }));
  };

  const handleAddMember = async (newMember) => {
    if (isConnectedToCloud) {
      try {
        const inserted = await insertMemberToSupabase(newMember, appState.fundInfo?.id);
        const resolvedMember = inserted ? { ...newMember, id: inserted.id } : newMember;
        setAppState((prev) => ({
          ...prev,
          members: [...prev.members, resolvedMember],
        }));
        await refreshFromSupabase(appState.fundInfo?.id, true);
        return;
      } catch (e) {
        console.error('Supabase member insert failed:', e);
        setCloudError(`Failed to save member to database: ${e.message}`);
      }
    }

    setAppState((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
  };

  const handleDeleteMember = async (memberId, options = {}) => {
    // 1. If an exit payout transaction was specified by the gatekeeper, record it first
    if (options.exitTransaction) {
      await handleAddTransaction(options.exitTransaction);
    }

    if (isConnectedToCloud) {
      try {
        await deleteMemberFromSupabase(memberId, options);
        await refreshFromSupabase(appState.fundInfo?.id);
        return;
      } catch (err) {
        console.error('Failed to delete member from Supabase:', err);
        setCloudError(`Failed to delete member: ${err.message}`);
      }
    }
    setAppState((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== memberId),
      transactions: options.action === 'purge'
        ? prev.transactions.filter((t) => t.memberId !== memberId)
        : prev.transactions,
    }));
  };

  const handleAddTransaction = async (newTx) => {
    if (isConnectedToCloud) {
      try {
        const inserted = await insertTransactionToSupabase(newTx, appState.fundInfo?.id);
        const resolvedTx = inserted ? { 
          ...newTx, 
          id: inserted.id,
          memberId: inserted.member_id || newTx.memberId,
          nav: Number(inserted.nav) || newTx.nav,
          units: Number(inserted.units) || newTx.units,
          amount: Number(inserted.amount) || newTx.amount,
          date: inserted.event_date || newTx.date
        } : newTx;

        setAppState((prev) => ({
          ...prev,
          transactions: [...prev.transactions, resolvedTx],
        }));
        await refreshFromSupabase(appState.fundInfo?.id, true);
        return;
      } catch (e) {
        console.error('Supabase transaction insert failed:', e);
        setCloudError(`Failed to save transaction to database: ${e.message}`);
      }
    }

    setAppState((prev) => ({
      ...prev,
      transactions: [...prev.transactions, newTx],
    }));
  };

  const handleConfirmTransaction = async (txId, newStatus, notes = '') => {
    // Optimistic local state update
    setAppState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx) =>
        tx.id === txId
          ? {
              ...tx,
              status: newStatus,
              verifiedAt: new Date().toISOString(),
              verificationNotes: notes || tx.verificationNotes,
            }
          : tx
      ),
    }));

    if (isConnectedToCloud) {
      try {
        await updateTransactionStatusInSupabase(txId, newStatus, notes, session?.user);
        await refreshFromSupabase(appState.fundInfo?.id, true);
      } catch (e) {
        console.error('Failed to update transaction status in Supabase:', e);
        setCloudError(`Failed to update transaction status: ${e.message}`);
      }
    }
  };

  const handleSyncHoldingsToNAV = () => {
    const totalValue = appState.holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
    if (totalValue <= 0) return;

    const newTx = {
      id: `tx_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'valuation_update',
      memberId: null,
      amount: totalValue,
      nav: fundMetrics.totalUnits > 0 ? totalValue / fundMetrics.totalUnits : fundMetrics.currentNav,
      units: 0,
      note: `Holdings valuation sync (${appState.holdings.length} positions)`,
    };

    handleAddTransaction(newTx);
  };

  const handleRestoreBackup = (restoredState) => {
    setAppState(restoredState);
    if (restoredState.fundInfo?.currency) {
      setCurrency(restoredState.fundInfo.currency);
    }
  };

  const handleResetDemoData = () => {
    setAppState(INITIAL_DEMO_DATA);
    setCurrency(INITIAL_DEMO_DATA.fundInfo.currency);
  };

  const handleOpenTransactionModal = (initial = {}) => {
    setTxModalInitial(initial);
    setIsTxModalOpen(true);
  };

  // Calculate Action Center counts (Approvals & Discrepancies) with memoization
  // Note: MUST be called unconditionally before any early returns to satisfy React Rules of Hooks
  const userEmail = (session?.user?.email || '').toLowerCase().trim();
  const myMember = useMemo(() => {
    if (!fundMetrics?.members?.length) return null;
    return fundMetrics.members.find(m => 
      m.isMe || 
      (userEmail && m.email && m.email.toLowerCase().trim() === userEmail) ||
      m.id === appState.fundInfo?.myMemberId
    ) || null;
  }, [fundMetrics?.members, userEmail, appState.fundInfo?.myMemberId]);

  const isInvestorUser = effectivePerspective === 'investor' || appState.fundInfo?.userRole === 'investor';
  
  const { pendingActionsCount, disputedActionsCount } = useMemo(() => {
    const txs = appState.transactions || [];
    const pending = isInvestorUser && myMember
      ? txs.filter(t => (t.memberId === myMember.id || t.isMyTx) && t.status === 'pending').length
      : txs.filter(t => t.status === 'pending').length;

    const disputed = isInvestorUser && myMember
      ? txs.filter(t => (t.memberId === myMember.id || t.isMyTx) && t.status === 'disputed').length
      : txs.filter(t => t.status === 'disputed').length;

    return { pendingActionsCount: pending, disputedActionsCount: disputed };
  }, [isInvestorUser, myMember, appState.transactions]);

  const activeStatementMember = selectedMemberForStatement 
    ? (fundMetrics?.members || []).find((m) => m.id === selectedMemberForStatement.id) || selectedMemberForStatement
    : null;

  // 1. Session initialization check
  if (isAuthChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
          INITIALIZING SYNDICATE_OS GATEWAY...
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: directly render AuthGateway without blank screen or dev page loop
  if (!session) {
    return (
      <AuthGateway
        onAuthenticated={(newSession) => {
          const validSession = newSession?.user ? newSession : { user: newSession };
          setSession(validSession);
          try {
            localStorage.setItem('syndicate_cached_session', JSON.stringify(validSession));
          } catch (e) {}
          refreshFromSupabase(null, true);
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="app-wrapper">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          fundInfo={appState.fundInfo}
          currency={currency}
          setCurrency={setCurrency}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenTransactionModal={() => handleOpenTransactionModal()}
          onOpenStatementModal={() => {
            const myMem = fundMetrics.members.find(m => m.isMe || (session?.user?.email && m.email?.toLowerCase() === session?.user?.email?.toLowerCase()));
            if (myMem) setSelectedMemberForStatement(myMem);
            else setActiveTab('statements');
          }}
          onOpenActionCenter={() => setIsActionCenterOpen(true)}
          pendingActionCount={pendingActionsCount}
          disputedCount={disputedActionsCount}
          perspective={effectivePerspective}
          onTogglePerspective={togglePerspective}
          onCreateFund={() => setIsCreateFundModalOpen(true)}
          isCloudConnected={isConnectedToCloud}
          isLoadingCloud={isLoadingCloud}
          onRefreshCloud={refreshFromSupabase}
          currentUser={session?.user}
          onSignOut={handleSignOut}
          isGuest={false}
          availableFunds={availableFunds}
          onSwitchFund={(fId) => refreshFromSupabase(fId)}
        />

      {cloudError && (
        <div 
          className="p-3 bg-loss-subtle text-loss text-xs flex justify-between items-center"
          style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--loss-subtle)' }}
        >
          <span>
            <strong>Database Notice:</strong> {cloudError}
          </span>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => setCloudError('')}
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="main-content">
        <Suspense fallback={<div className="loading-state mono p-4 text-center text-xs text-muted">Loading module...</div>}>
          {activeTab === 'dashboard' && (
            <DashboardView
              fundMetrics={fundMetrics}
              fundInfo={appState.fundInfo}
              currency={currency}
              transactions={appState.transactions}
              members={appState.members}
              holdings={appState.holdings}
              personalFinances={appState.personalFinances}
              currentUser={session?.user}
              perspective={effectivePerspective}
              onOpenTransactionModal={handleOpenTransactionModal}
              onConfirmTransaction={handleConfirmTransaction}
              onSelectMember={(m) => setSelectedMemberForStatement(m)}
              onOpenActionCenter={() => setIsActionCenterOpen(true)}
            />
          )}

          {activeTab === 'syndicate' && (
            <SyndicateView
              fundMetrics={fundMetrics}
              fundInfo={appState.fundInfo}
              currency={currency}
              transactions={appState.transactions}
              holdings={appState.holdings}
              currentUser={session?.user}
              perspective={effectivePerspective}
              onOpenTransactionModal={handleOpenTransactionModal}
              onOpenMemberModal={() => setIsMemberModalOpen(true)}
              onDeleteMember={handleDeleteMember}
              onConfirmTransaction={handleConfirmTransaction}
              onSelectMember={(m) => setSelectedMemberForStatement(m)}
            />
          )}

          {activeTab === 'holdings' && (
            <HoldingsView
              holdings={appState.holdings}
              onSaveHolding={handleSaveHolding}
              onDeleteHolding={handleDeleteHolding}
              fundMetrics={fundMetrics}
              currency={currency}
              fundInfo={appState.fundInfo}
              perspective={effectivePerspective}
              onSyncValuationToNAV={handleSyncHoldingsToNAV}
            />
          )}

          {activeTab === 'personal' && (
            <PersonalFinanceView
              personalFinances={appState.personalFinances}
              setPersonalFinances={setPersonalFinances}
              fundMetrics={fundMetrics}
              currency={currency}
              onAddIncome={handleAddIncome}
              onDeleteIncome={handleDeleteIncome}
              onAddSoloAsset={handleAddSoloAsset}
              onDeleteSoloAsset={handleDeleteSoloAsset}
            />
          )}

          {activeTab === 'statements' && (
            <StatementsView
              fundMetrics={fundMetrics}
              fundInfo={appState.fundInfo}
              currency={currency}
              currentUser={session?.user}
              perspective={effectivePerspective}
              onSelectMember={(m) => setSelectedMemberForStatement(m)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              fundInfo={appState.fundInfo}
              setFundInfo={setFundInfo}
              currency={currency}
              setCurrency={setCurrency}
              allAppState={appState}
              onRestoreBackup={handleRestoreBackup}
              onResetDemoData={handleResetDemoData}
              onRefreshFromSupabase={refreshFromSupabase}
              currentUser={session?.user}
            />
          )}
        </Suspense>
      </main>

      {/* Lazy Modals with Suspense */}
      <Suspense fallback={null}>
        {isTxModalOpen && (
          <TransactionModal
            initialData={txModalInitial}
            members={appState.members}
            fundMetrics={fundMetrics}
            fundInfo={appState.fundInfo}
            currency={currency}
            onSave={handleAddTransaction}
            onClose={() => setIsTxModalOpen(false)}
          />
        )}

        {isMemberModalOpen && (
          <MemberModal
            onAddMember={handleAddMember}
            onClose={() => setIsMemberModalOpen(false)}
          />
        )}

        {activeStatementMember && (
          <StatementModal
            member={activeStatementMember}
            fundInfo={appState.fundInfo}
            currentNav={fundMetrics.currentNav}
            currency={currency}
            onClose={() => setSelectedMemberForStatement(null)}
          />
        )}

        {isCreateFundModalOpen && (
          <CreateFundModal
            isOpen={isCreateFundModalOpen}
            onClose={() => setIsCreateFundModalOpen(false)}
            onCreateFund={handleCreateFund}
            currentUser={session?.user}
          />
        )}

        {isActionCenterOpen && (
          <ActionCenterModal
            isOpen={isActionCenterOpen}
            onClose={() => setIsActionCenterOpen(false)}
            transactions={appState.transactions}
            members={appState.members}
            fundInfo={appState.fundInfo}
            fundMetrics={fundMetrics}
            currency={currency}
            perspective={effectivePerspective}
            currentUser={session?.user}
            onConfirmTransaction={handleConfirmTransaction}
            onOpenTransactionModal={() => {
              setIsActionCenterOpen(false);
              handleOpenTransactionModal();
            }}
          />
        )}
      </Suspense>
      </div>
    </ErrorBoundary>
  );
}
