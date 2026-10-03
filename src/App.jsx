import React, { useState, useEffect, useCallback } from 'react';
import { 
  INITIAL_DEMO_DATA, 
  computeFundState 
} from './utils/navEngine';
import { 
  isSupabaseConfigured, 
  fetchAllFromSupabase,
  insertTransactionToSupabase,
  insertMemberToSupabase,
  upsertHoldingToSupabase,
  deleteHoldingFromSupabase,
  insertIncomeToSupabase,
  deleteIncomeFromSupabase,
  insertSoloAssetToSupabase,
  deleteSoloAssetFromSupabase,
  updateFundInSupabase,
  getAuthSession,
  signOutUser,
  onAuthChange
} from './lib/supabaseClient';

import Navbar from './components/Navbar';
import AuthGateway from './components/AuthGateway';
import LandingPage from './components/LandingPage';
import DashboardView from './components/DashboardView';
import SyndicateView from './components/SyndicateView';
import HoldingsView from './components/HoldingsView';
import PersonalFinanceView from './components/PersonalFinanceView';
import StatementsView from './components/StatementsView';
import SettingsView from './components/SettingsView';

import TransactionModal from './components/TransactionModal';
import MemberModal from './components/MemberModal';
import StatementModal from './components/StatementModal';

import './App.css';

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

  // View & Auth Gateway State: 'landing' | 'auth' | 'app'
  const [viewMode, setViewMode] = useState('landing');
  const [session, setSession] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const currentSession = await getAuthSession();
        if (isMounted && currentSession) {
          setSession(currentSession);
          setViewMode('app');
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
        setSession(newSession);
        if (newSession) {
          setIsGuestMode(false);
          setViewMode('app');
          // Clean up URL hash after Google OAuth redirect
          if (window.location.hash && window.location.hash.includes('access_token')) {
            window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
          }
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
    setSession(null);
    setIsGuestMode(false);
    setViewMode('landing');
  };

  const isConnectedToCloud = isSupabaseConfigured();
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudError, setCloudError] = useState('');

  // Primary application data state
  const [appState, setAppState] = useState(() => {
    // If Supabase is configured, start clean and await DB fetch
    if (isConnectedToCloud) {
      return {
        fundInfo: { name: 'Syndicate Fund', managerName: 'Milan', initialNav: 100, currency: 'INR' },
        members: [],
        transactions: [],
        holdings: [],
        personalFinances: { monthlyIncome: [], personalSoloAssets: [] }
      };
    }
    // Otherwise fallback to local storage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DEMO_DATA;
  });

  // Supabase Fetcher (Direct from Database, no mock fallback)
  const refreshFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    setIsLoadingCloud(true);
    setCloudError('');

    try {
      const cloudData = await fetchAllFromSupabase();
      if (cloudData) {
        setAppState({
          fundInfo: cloudData.fundInfo || { name: 'Syndicate Fund', managerName: 'Milan', initialNav: 100, currency: 'INR' },
          members: cloudData.members, // EXACTLY from DB
          transactions: cloudData.transactions, // EXACTLY from DB
          holdings: cloudData.holdings, // EXACTLY from DB
          personalFinances: cloudData.personalFinances, // EXACTLY from DB
        });

        if (cloudData.fundInfo?.currency) {
          setCurrency(cloudData.fundInfo.currency);
        }
      }
    } catch (err) {
      console.error('Error fetching live data from Supabase:', err);
      setCloudError(err.message || 'Failed to fetch from Supabase. Ensure schema.sql was run.');
    } finally {
      setIsLoadingCloud(false);
    }
  }, []);

  useEffect(() => {
    if (isConnectedToCloud) {
      refreshFromSupabase();
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
  const [selectedMemberForStatement, setSelectedMemberForStatement] = useState(null);

  const fundMetrics = computeFundState(
    appState.fundInfo,
    appState.members,
    appState.transactions,
    appState.holdings
  );

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
        const inserted = await insertIncomeToSupabase(newInc);
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
        const inserted = await insertSoloAssetToSupabase(newAst);
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
        await refreshFromSupabase();
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
        await refreshFromSupabase();
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

  const activeStatementMember = selectedMemberForStatement 
    ? fundMetrics.members.find((m) => m.id === selectedMemberForStatement.id) || selectedMemberForStatement
    : null;

  // 1. Session initialization screen
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

  // 2. Landing Page (Default first screen if not logged in)
  if (!session && viewMode === 'landing') {
    return (
      <LandingPage
        onLaunchTerminal={() => setViewMode('auth')}
        theme={theme}
        toggleTheme={toggleTheme}
        isAuthenticated={Boolean(session)}
      />
    );
  }

  // 3. Auth Gateway Login/Register Guard
  if (!session && viewMode === 'auth') {
    return (
      <AuthGateway
        onAuthenticated={(user) => {
          setSession({ user });
          setViewMode('app');
          refreshFromSupabase();
        }}
        onBackToLanding={() => setViewMode('landing')}
      />
    );
  }

  return (
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
        isCloudConnected={isConnectedToCloud}
        isLoadingCloud={isLoadingCloud}
        onRefreshCloud={refreshFromSupabase}
        currentUser={session?.user}
        onSignOut={handleSignOut}
        isGuest={isGuestMode}
        onOpenLanding={() => setViewMode('landing')}
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
        {activeTab === 'dashboard' && (
          <DashboardView
            fundMetrics={fundMetrics}
            fundInfo={appState.fundInfo}
            currency={currency}
            transactions={appState.transactions}
            members={appState.members}
            holdings={appState.holdings}
            personalFinances={appState.personalFinances}
            onOpenTransactionModal={handleOpenTransactionModal}
            onSelectMember={(m) => setSelectedMemberForStatement(m)}
          />
        )}

        {activeTab === 'syndicate' && (
          <SyndicateView
            fundMetrics={fundMetrics}
            fundInfo={appState.fundInfo}
            currency={currency}
            transactions={appState.transactions}
            holdings={appState.holdings}
            onOpenTransactionModal={handleOpenTransactionModal}
            onOpenMemberModal={() => setIsMemberModalOpen(true)}
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
          />
        )}
      </main>

      {/* Modals */}
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
    </div>
  );
}
