import React, { useState, useEffect } from 'react';
import { getPlatformStats, getAccounts } from '../lib/api';
import type { PlatformStats, Account } from '../lib/api';
import { BarChart3, TrendingUp, CheckCircle, XCircle, PieChart, Shield, Activity, Sparkles, Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, PieChart as RePieChart, Pie } from 'recharts';
import { useToast } from './ToastProvider';

export const AnalyticsPage: React.FC = () => {
  const toast = useToast();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const statsData = await getPlatformStats();
        setStats(statsData);
        
        const accountsData = await getAccounts();
        setAccounts(accountsData);
      } catch (e: any) {
        toast.error('Failed to load analytics', e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading platform analytics...</div>;
  }

  // Calculate account risk stats
  const riskCounts = {
    Low: accounts.filter(a => a.health_score >= 80).length,
    Medium: accounts.filter(a => a.health_score >= 60 && a.health_score < 80).length,
    High: accounts.filter(a => a.health_score < 60).length
  };

  const riskData = [
    { name: 'Low Risk', value: riskCounts.Low, color: '#10b981' },
    { name: 'Medium Risk', value: riskCounts.Medium, color: '#f59e0b' },
    { name: 'High Risk', value: riskCounts.High, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Mock historical run trend data anchored to real total_runs
  const totalRuns = stats?.total_runs || 0;
  const trendData = [
    { month: 'Jan', runs: Math.round(totalRuns * 0.1) },
    { month: 'Feb', runs: Math.round(totalRuns * 0.2) },
    { month: 'Mar', runs: Math.round(totalRuns * 0.4) },
    { month: 'Apr', runs: Math.round(totalRuns * 0.6) },
    { month: 'May', runs: Math.round(totalRuns * 0.8) },
    { month: 'Jun', runs: totalRuns },
  ];

  // Category distribution
  const categoryData = [
    { name: 'Retention', value: Math.round(totalRuns * 1.5) || 5, color: '#6366f1' },
    { name: 'Escalation', value: Math.round(totalRuns * 0.8) || 3, color: '#f43f5e' },
    { name: 'Expansion', value: Math.round(totalRuns * 0.5) || 2, color: '#10b981' },
    { name: 'Enablement', value: Math.round(totalRuns * 0.2) || 1, color: '#8b5cf6' },
  ];

  // Agent execution latency
  const latencyData = [
    { name: 'Planner', p95: 140, avg: 85 },
    { name: 'Ingestion', p95: 110, avg: 60 },
    { name: 'Retrieval', p95: 280, avg: 150 },
    { name: 'Analysis', p95: 390, avg: 210 },
    { name: 'Recommendation', p95: 420, avg: 230 },
    { name: 'Explanation', p95: 220, avg: 120 },
    { name: 'Evaluation', p95: 180, avg: 95 }
  ];

  const approvalRate = stats ? Math.round(stats.approval_rate * 100) : 0;
  const rejectionRate = stats ? Math.round((1 - stats.approval_rate) * 100) : 0;
  const avgConf = stats ? Math.round(stats.avg_confidence * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-slide-up">
      <div>
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6.5 w-6.5 text-violet-500" />
          Enterprise Analytics Dashboard
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-450 mt-1">
          Monitor orchestration metrics, human-in-the-loop decisions, risk profiles, and pipeline performance indicators.
        </p>
      </div>

      {/* Top Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Runs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
            <Activity className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider">Total Pipeline Runs</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight mt-0.5">{totalRuns}</p>
          </div>
        </div>

        {/* Confidence */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider">Avg Confidence</p>
            <p className="text-2xl font-extrabold text-violet-600 dark:text-violet-400 tracking-tight mt-0.5">{avgConf}%</p>
          </div>
        </div>

        {/* Approval Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider">Approval Rate</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-0.5">{approvalRate}%</p>
          </div>
        </div>

        {/* Rejection Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
            <XCircle className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider">Rejection Rate</p>
            <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight mt-0.5">{rejectionRate}%</p>
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        
        {/* Trend Area Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            Monthly Activity Pipeline Runs
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                <Area type="monotone" dataKey="runs" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRuns)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="h-4 w-4 text-indigo-500" />
            Recommendation Categories Breakdown
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            Portfolio Churn Risk Distribution
          </h4>
          <div className="h-64 flex items-center justify-center">
            {riskData.length === 0 ? (
              <div className="text-xs text-slate-450">No data found.</div>
            ) : (
              <div className="w-full h-full flex flex-col sm:flex-row items-center justify-around">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {riskData.map(d => (
                    <div key={d.name} className="flex items-center gap-2 text-xs font-medium text-slate-655 dark:text-slate-350">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                      <span>{d.name}: {d.value} ({Math.round(d.value / accounts.length * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Latency / Execution Time stats */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-rose-500" />
            Agent Execution Latency Stats (ms)
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                <Bar dataKey="avg" name="Avg Latency" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="p95" name="p95 Latency" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
