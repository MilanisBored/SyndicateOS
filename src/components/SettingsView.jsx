import React, { useState, useRef } from 'react';
import { CURRENCIES, INITIAL_DEMO_DATA } from '../utils/navEngine';
import { 
  getSupabaseCredentials, 
  isSupabaseConfigured,
  cleanSupabaseUrl,
  cleanSupabaseKey,
  fetchAllFromSupabase,
  insertTransactionToSupabase,
  insertMemberToSupabase,
  upsertHoldingToSupabase,
  insertIncomeToSupabase,
  insertSoloAssetToSupabase,
  updateFundInSupabase,
  wipeSupabaseDatabase,
  testSupabaseConnection
} from '../lib/supabaseClient';

export default function SettingsView({ 
  fundInfo, 
  setFundInfo, 
  currency, 
  setCurrency, 
  allAppState, 
  onRestoreBackup, 
  onResetDemoData,
  onRefreshFromSupabase 
}) {
  const fileInputRef = useRef(null);
  const currentCredentials = getSupabaseCredentials();

  const [sbUrl, setSbUrl] = useState(currentCredentials.url);
  const [sbKey, setSbKey] = useState(currentCredentials.key);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [diagnostic, setDiagnostic] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

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

  const handleSaveCredentials = () => {
    const cleanedUrl = cleanSupabaseUrl(sbUrl);
    const cleanedKey = cleanSupabaseKey(sbKey);

    if (!cleanedUrl || !cleanedKey) {
      localStorage.removeItem('syndicate_sb_url');
      localStorage.removeItem('syndicate_sb_key');
      alert('Cleared Supabase credentials. Reverted to local storage.');
      window.location.reload();
      return;
    }

    if (!cleanedUrl.startsWith('http') || !cleanedUrl.includes('supabase.co')) {
      alert('Please enter a valid Supabase URL, for example: https://bncqjgflhilmmhousnkr.supabase.co');
      return;
    }

    localStorage.setItem('syndicate_sb_url', cleanedUrl);
    localStorage.setItem('syndicate_sb_key', cleanedKey);
    setSbUrl(cleanedUrl);
    setSbKey(cleanedKey);
    alert('Supabase credentials connected successfully!');
    window.location.reload();
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
            <span className="font-semibold text-xs text-muted uppercase">Supabase Cloud PostgreSQL</span>
            <span className={`badge ${isConnected ? 'badge-profit' : 'badge-neutral'} mono`}>
              {isConnected ? 'CONNECTED' : 'LOCAL STORAGE'}
            </span>
          </div>

          <p className="text-xs text-muted mb-3">
            Paste your Project URL & Anon Key from Supabase (<strong>Project Settings &gt; API</strong>) to sync data to the cloud.
          </p>

          <div className="form-group">
            <label className="form-label">Project URL</label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={sbUrl}
              onChange={(e) => setSbUrl(e.target.value)}
              className="form-input mono"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Anon / Public Key</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={sbKey}
              onChange={(e) => setSbKey(e.target.value)}
              className="form-input mono"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className="btn btn-primary btn-sm flex-1"
              onClick={handleSaveCredentials}
            >
              Save & Connect
            </button>
            {isConnected && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleRunDiagnostic}
                  disabled={isTesting}
                >
                  {isTesting ? 'Checking...' : 'Test DB & Sync'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSyncCurrentToSupabase}
                  disabled={isSyncing}
                >
                  {isSyncing ? 'Syncing...' : 'Upload Local Data'}
                </button>
              </>
            )}
          </div>
          {syncStatus && <div className="text-xs text-profit mt-2 mono">{syncStatus}</div>}

          {diagnostic && (
            <div className="mt-3 p-3 card bg-loss-subtle text-xs mono" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-secondary">Supabase Live Diagnostic:</span>
                <span className={`badge ${diagnostic.success ? 'badge-profit' : 'badge-loss'}`}>
                  {diagnostic.success ? 'Operational' : 'Issues Detected'}
                </span>
              </div>
              {diagnostic.counts && (
                <div className="grid grid-cols-3 gap-2 mt-2 text-muted">
                  <div>Funds: <strong className="text-primary">{diagnostic.counts.funds}</strong></div>
                  <div>Members: <strong className="text-primary">{diagnostic.counts.members}</strong></div>
                  <div>Transactions: <strong className="text-primary">{diagnostic.counts.transactions}</strong></div>
                  <div>Holdings: <strong className="text-primary">{diagnostic.counts.holdings}</strong></div>
                  <div>Incomes: <strong className="text-primary">{diagnostic.counts.incomes}</strong></div>
                  <div>Solo Assets: <strong className="text-primary">{diagnostic.counts.assets}</strong></div>
                </div>
              )}
              {diagnostic.memberNames && diagnostic.memberNames.length > 0 && (
                <div className="mt-2 text-muted">
                  Found Members: <strong className="text-primary">{diagnostic.memberNames.join(', ')}</strong>
                </div>
              )}
              {diagnostic.errors && (
                <div className="mt-2 text-loss">
                  {diagnostic.errors}
                </div>
              )}
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
              <span className="font-semibold text-xs text-muted uppercase">Clean Reset</span>
            </div>
            <p className="text-xs text-muted mb-3">
              Wipe all demo / false data from both your Supabase cloud database and local cache to start fresh.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--loss)' }}
              onClick={async () => {
                if (confirm('PERMANENT ACTION: Delete all members, transactions, holdings, and personal records from your Supabase database?')) {
                  setIsSyncing(true);
                  try {
                    await wipeSupabaseDatabase();
                    localStorage.removeItem('syndicatevault_state_v2');
                    localStorage.removeItem('syndicatevault_state_v1');
                    alert('Database wiped completely. You now have a clean slate.');
                    window.location.reload();
                  } catch (e) {
                    alert('Error wiping database: ' + e.message);
                  } finally {
                    setIsSyncing(false);
                  }
                }
              }}
            >
              Wipe Database to Clean Slate (0 Rows)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
