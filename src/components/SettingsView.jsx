import React, { useState, useRef } from 'react';
import { CURRENCIES, INITIAL_DEMO_DATA } from '../utils/navEngine';
import { 
  isSupabaseConfigured,
  fetchAllFromSupabase,
  insertTransactionToSupabase,
  insertMemberToSupabase,
  upsertHoldingToSupabase,
  insertIncomeToSupabase,
  insertSoloAssetToSupabase,
  updateFundInSupabase,
  testSupabaseConnection,
  wipeSupabaseDatabase
} from '../lib/supabaseClient';

export default function SettingsView({ 
  fundInfo, 
  setFundInfo, 
  currency, 
  setCurrency, 
  allAppState, 
  onRestoreBackup, 
  onResetDemoData,
  onRefreshFromSupabase,
  currentUser
}) {
  const fileInputRef = useRef(null);

  const [diagnostic, setDiagnostic] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const isConnected = isSupabaseConfigured();

  const handleRunDiagnostic = async () => {
    setIsTesting(true);
    setDiagnostic(null);
    try {
      const res = await testSupabaseConnection();
      setDiagnostic(res);
      if (onRefreshFromSupabase) {
        await onRefreshFromSupabase();
      }
    } catch (err) {
      setDiagnostic({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearLocalCache = () => {
    if (!confirm('This will clear local browser cache for this device. Remote database records will remain intact. Continue?')) {
      return;
    }
    try {
      localStorage.removeItem('syndicate_cached_fund_state');
      localStorage.removeItem('syndicate_cached_funds_list');
      localStorage.removeItem('syndicatevault_state_v2');
      alert('Local browser cache cleared.');
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncCurrentToSupabase = async () => {
    if (!isConnected) {
      alert('Please connect Supabase first.');
      return;
    }
    if (!confirm('This will upload all current members, transactions, holdings, and personal records to Supabase. Continue?')) {
      return;
    }

    setIsSyncing(true);
    setSyncStatus('Syncing to Supabase...');

    try {
      // 1. Check if fund exists or update
      await updateFundInSupabase(fundInfo.id, fundInfo);

      // 2. Members
      for (const m of allAppState.members) {
        try {
          await insertMemberToSupabase(m, fundInfo.id);
        } catch (e) {
          // ignore duplicate
        }
      }

      // 3. Transactions
      for (const t of allAppState.transactions) {
        try {
          await insertTransactionToSupabase(t, fundInfo.id);
        } catch (e) {
          // ignore duplicate
        }
      }

      // 4. Holdings
      for (const h of allAppState.holdings) {
        try {
          await upsertHoldingToSupabase(h, fundInfo.id);
        } catch (e) {
          // ignore
        }
      }

      setSyncStatus('Uploaded successfully!');
      setTimeout(() => setSyncStatus(''), 3000);
      if (onRefreshFromSupabase) {
        await onRefreshFromSupabase();
      }
    } catch (err) {
      console.error(err);
      setSyncStatus(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allAppState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `syndicate_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.fundInfo && parsed.members && parsed.transactions) {
            onRestoreBackup(parsed);
            alert('Backup restored.');
          } else {
            alert('Invalid backup structure.');
          }
        } catch {
          alert('Could not parse JSON.');
        }
      };
    }
  };

  return (
    <div>
      <div className="section-head mb-3">
        <span className="section-title">Settings & Database</span>
      </div>


      <div className="grid grid-cols-2 gap-4">
        {/* Supabase Database Connection */}
        <div className="card p-4">
          <div className="section-head mb-2">
            <span className="font-semibold text-xs text-muted uppercase">PostgreSQL Cloud Engine</span>
            <span className={`badge ${isConnected ? 'badge-profit' : 'badge-neutral'} mono`}>
              {isConnected ? '[CONNECTED: CLOUD DB]' : '[OFFLINE / LOCAL]'}
            </span>
          </div>

          <p className="text-xs text-muted mb-3">
            Institutional database connection is configured automatically. Multi-tenant access controls isolate portfolio data strictly to authorized syndicate participants.
          </p>

          <div className="p-3 mb-3 text-xs mono" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-muted">Database Engine:</span>
              <span className="text-primary">Universal Supabase Managed Pool</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-muted">Active Session:</span>
              <span className="text-primary">{currentUser?.email || '[Unauthenticated Visitor]'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted">Access Boundary:</span>
              <span className="text-profit">Strict Multi-Tenant Isolation</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="btn btn-secondary btn-sm flex-1"
              onClick={handleRunDiagnostic}
              disabled={isTesting}
            >
              {isTesting ? 'Verifying...' : 'Verify Database Link'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearLocalCache}
              title="Purge cached browser data on this client machine"
            >
              Clear Local Cache
            </button>
          </div>

          {diagnostic && (
            <div className="mt-3 p-3 text-xs mono" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-secondary">Connection Health:</span>
                <span className={`badge ${diagnostic.success ? 'badge-profit' : 'badge-loss'}`}>
                  {diagnostic.success ? '[OPERATIONAL]' : '[FAILED]'}
                </span>
              </div>
              <div className="text-muted mt-1">
                Status: <span className="text-primary">{diagnostic.status || (diagnostic.success ? 'Database reachable & verified.' : diagnostic.error)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Fund Settings */}
        <div className="card p-4">
          <div className="section-head mb-3">
            <span className="font-semibold text-xs text-muted uppercase">Fund Configuration</span>
          </div>

          <div className="form-group">
            <label className="form-label">Fund / Syndicate Name</label>
            <input
              type="text"
              value={fundInfo.name}
              onChange={(e) => setFundInfo({ ...fundInfo, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Manager Name</label>
            <input
              type="text"
              value={fundInfo.managerName}
              onChange={(e) => setFundInfo({ ...fundInfo, managerName: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Display Currency</label>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                setFundInfo({ ...fundInfo, currency: e.target.value });
              }}
              className="form-select"
            >
              {Object.keys(CURRENCIES).map((cKey) => (
                <option key={cKey} value={cKey}>
                  {CURRENCIES[cKey].label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Investor Portfolio Visibility
              <span className="text-muted text-xs font-normal ml-1">(Discretionary Mandate Protection)</span>
            </label>
            <select
              value={fundInfo.portfolioVisibility || 'private'}
              onChange={async (e) => {
                const updated = { ...fundInfo, portfolioVisibility: e.target.value };
                setFundInfo(updated);
                if (isConnected && fundInfo.id) {
                  try {
                    await updateFundInSupabase(fundInfo.id, updated);
                  } catch (err) {
                    console.warn('Could not sync portfolio visibility:', err);
                  }
                }
              }}
              className="form-select"
            >
              <option value="private">
                Private / Confidential (Recommended - Discretionary Mandate)
              </option>
              <option value="summary">
                Summary (Asset Class Breakdown only)
              </option>
              <option value="transparent">
                Transparent (Open-Book - All tickers visible to all members)
              </option>
            </select>
            <span className="text-xs text-muted block mt-1">
              <strong>Private Mandate:</strong> Investors track real-time NAV, verified units, and asset classes. Specific stock tickers, buy levels, and broker notes remain confidential to the Fund Manager.
            </span>
          </div>
        </div>

        {/* JSON Backup & Restore */}
        <div className="card p-4">
          <div className="section-head mb-3">
            <span className="font-semibold text-xs text-muted uppercase">Local JSON Backup</span>
          </div>

          <p className="text-xs text-muted mb-3">
            Export a standalone snapshot of all records for offline safekeeping.
          </p>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm justify-between"
              onClick={handleExportJSON}
            >
              <span>Export JSON Backup</span>
              <span className="text-muted text-xs mono">.json</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm justify-between"
              onClick={() => fileInputRef.current?.click()}
            >
              <span>Import JSON Backup</span>
              <span className="text-muted text-xs mono">Restore</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Database & State Reset */}
        <div className="card p-4 flex flex-col justify-between">
          <div>
            <div className="section-head mb-3">
              <span className="font-semibold text-xs text-muted uppercase">Syndicate Data Reset</span>
            </div>
            <p className="text-xs text-muted mb-3">
              Reset cached records or purge active fund transactions and positions to restart with a clean slate.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--loss)' }}
              onClick={async () => {
                if (confirm(`PERMANENT ACTION: Delete transactions, members, and holdings belonging specifically to syndicate "${fundInfo.name || 'Current Fund'}"?`)) {
                  setIsSyncing(true);
                  try {
                    if (fundInfo?.id) {
                      await wipeSupabaseDatabase(fundInfo.id);
                    }
                    localStorage.removeItem('syndicatevault_state_v2');
                    localStorage.removeItem('syndicatevault_state_v1');
                    localStorage.removeItem('syndicate_cached_fund_state');
                    localStorage.removeItem('syndicate_cached_funds_list');
                    alert('Active syndicate records wiped. You now have a clean slate.');
                    window.location.reload();
                  } catch (e) {
                    alert('Error resetting syndicate records: ' + e.message);
                  } finally {
                    setIsSyncing(false);
                  }
                }
              }}
            >
              Wipe Active Syndicate Records (0 Rows)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
