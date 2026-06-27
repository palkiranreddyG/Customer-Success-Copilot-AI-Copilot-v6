import { useEffect, useState } from 'react';
import { getAccounts, searchKB } from './lib/api';
import type { Account, ChunkResult, PipelineStatusResponse } from './lib/api';
import { AccountList } from './components/AccountList';
import { TranscriptUpload } from './components/TranscriptUpload';
import { AgentActivityStream } from './components/AgentActivityStream';
import { AuditLogTable } from './components/AuditLogTable';
import { PlatformStatsPanel } from './components/PlatformStatsPanel';
import { ToastProvider } from './components/ToastProvider';
import { EmptyState } from './components/EmptyState';
import { DashboardLayout } from './components/DashboardLayout';
import { RecommendationsSkeleton } from './components/skeletons/Skeletons';
import { ApprovalQueue } from './components/ApprovalQueue';

import {
  BookOpen,
  Users,
  Search,
  FileText,
  AlertCircle,
  Award
} from 'lucide-react';

function AppContent() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChunkResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<PipelineStatusResponse | null>(null);
  
  const [refreshAuditTrigger, setRefreshAuditTrigger] = useState(0);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  useEffect(() => {
    async function loadAccounts() {
      try {
        setAccountsLoading(true);
        const data = await getAccounts();
        setAccounts(data);
        if (data.length > 0) setSelectedAccount(data[0]);
      } catch (err: any) {
        setAccountsError(err.message || 'Failed to connect to the backend server.');
      } finally {
        setAccountsLoading(false);
      }
    }
    loadAccounts();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearchLoading(true);
      setSearchError(null);
      setHasSearched(true);
      const res = await searchKB(searchQuery);
      setSearchResults(res.chunks);
    } catch (err: any) {
      setSearchError(err.message || 'Error searching the knowledge base.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDecisionRecorded = () => {
    setRefreshAuditTrigger(prev => prev + 1);
    setStatsRefreshKey(prev => prev + 1);
  };

  const handleStatusChange = (data: PipelineStatusResponse | null) => {
    setStatusData(data);
  };

  // Determine whether recommendations are loading or populated
  const isPipelineRunning = statusData?.status === 'running';
  const hasRecommendations = statusData && statusData.recommendations && statusData.recommendations.length > 0;

  return (
    <DashboardLayout selectedAccountName={selectedAccount?.name}>
      {/* ── Scrollable Dashboard Body ─────────────────────────────── */}
      <main className="p-6 lg:p-8 space-y-8">
        
        {/* Platform Stats */}
        <section>
          <PlatformStatsPanel refreshKey={statsRefreshKey} />
        </section>

        {/* Section 1: Account Portfolio */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-500" />
                Portfolio Accounts
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Live accounts from SQLite. Select to set the active session context.
              </p>
            </div>
          </div>

          {accountsError ? (
            <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 flex items-start gap-3 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Backend connection failed</p>
                <p className="text-xs mt-0.5">{accountsError} — is uvicorn running on port 8000?</p>
              </div>
            </div>
          ) : accounts.length === 0 && !accountsLoading ? (
            <EmptyState variant="noAccounts" />
          ) : (
            <AccountList
              accounts={accounts}
              loading={accountsLoading}
              error={accountsError}
              selectedAccountId={selectedAccount?.id}
              onSelectAccount={acc => {
                setSelectedAccount(acc);
                // Clear active session to avoid showing stale data from prior selected account
                setActiveSessionId(null);
                setStatusData(null);
              }}
            />
          )}
        </section>

        {/* Section 2: Pipeline + KB Search */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Main Area — 3/5 */}
          <div className="lg:col-span-3 space-y-6">
            {/* Conditional recommendations display */}
            {activeSessionId && (
              <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Generated Next-Best Actions
                </h3>
                
                {isPipelineRunning && !hasRecommendations && (
                  <RecommendationsSkeleton />
                )}
                
                {!isPipelineRunning && !hasRecommendations && (
                  <EmptyState variant="noRecs" />
                )}
                
                {hasRecommendations && (
                  <ApprovalQueue
                    recommendations={statusData.recommendations}
                    onDecisionRecorded={handleDecisionRecorded}
                  />
                )}
              </section>
            )}

            {/* KB Search always visible in left panel */}
            <section className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-500" />
                  Knowledge Base Retrieval
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Semantic search against playbooks in ChromaDB collection{' '}
                  <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-xs">org_demo_kb</code>.
                </p>
              </div>

              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder='Try "churn risk health score", "renewal discount", "onboarding"…'
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-colors flex items-center gap-2 shadow-md shadow-indigo-600/10 disabled:opacity-50 border-0 cursor-pointer"
                >
                  {searchLoading ? 'Searching…' : 'Search'}
                </button>
              </form>

              {searchError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {searchResults.length > 0 ? (
                  searchResults.map((result, idx) => (
                    <div key={idx} className="card-lift p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-200 dark:hover:border-slate-700 transition-colors animate-step-appear" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{result.source}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">
                            {result.section}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-indigo-500 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 shrink-0">
                          {result.score.toFixed(4)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed italic">"{result.text}"</p>
                    </div>
                  ))
                ) : hasSearched ? (
                  <EmptyState variant="noResults" />
                ) : (
                  <div className="h-40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                    <Search className="h-8 w-8 opacity-40" />
                    <span className="text-xs">Search results will appear here</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Transcript Upload + Agent Activity — 2/5 */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <TranscriptUpload
              accounts={accounts}
              onUploadSuccess={sessionId => {
                setActiveSessionId(sessionId);
                setStatusData(null); // Reset state for a new run
              }}
            />
            <AgentActivityStream
              sessionId={activeSessionId}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>

        {/* Section 3: Audit Log */}
        {selectedAccount && (
          <section className="space-y-4">
            <AuditLogTable
              accountId={selectedAccount.id}
              refreshTrigger={refreshAuditTrigger}
            />
          </section>
        )}
      </main>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
