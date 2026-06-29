import React, { useState, useEffect } from 'react';
import { getAccounts, addAccount, updateAccount, deleteAccount } from '../lib/api';
import type { Account } from '../lib/api';
import { Users, Plus, Edit2, Trash2, Shield, ShieldCheck, ShieldAlert, DollarSign, Calendar, Landmark, Clock, X } from 'lucide-react';
import { useToast } from './ToastProvider';

export const AccountsPage: React.FC<{ onAccountsChange?: () => void }> = ({ onAccountsChange }) => {
  const toast = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formIndustry, setFormIndustry] = useState('Technology');
  const [formArr, setFormArr] = useState(100000);
  const [formHealthScore, setFormHealthScore] = useState(80);
  const [formTenureMonths, setFormTenureMonths] = useState(12);
  const [formRenewalDate, setFormRenewalDate] = useState('2026-12-31');
  const [formRiskLevel, setFormRiskLevel] = useState('Low');
  const [formLastInteraction, setFormLastInteraction] = useState('2026-06-01');

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await getAccounts();
      setAccounts(data);
    } catch (e: any) {
      toast.error('Failed to load accounts', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openAddModal = () => {
    setEditingAccount(null);
    setFormName('');
    setFormIndustry('Technology');
    setFormArr(100000);
    setFormHealthScore(80);
    setFormTenureMonths(12);
    setFormRenewalDate('2026-12-31');
    setFormRiskLevel('Low');
    setFormLastInteraction('2026-06-01');
    setShowModal(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setFormName(acc.name);
    setFormIndustry(acc.industry || 'Technology');
    setFormArr(acc.arr);
    setFormHealthScore(acc.health_score);
    setFormTenureMonths(acc.tenure_months);
    setFormRenewalDate(acc.renewal_date || '2026-12-31');
    setFormRiskLevel(acc.risk_level || 'Low');
    setFormLastInteraction(acc.last_interaction || '2026-06-01');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formName,
      arr: Number(formArr),
      health_score: Number(formHealthScore),
      tenure_months: Number(formTenureMonths),
      industry: formIndustry,
      renewal_date: formRenewalDate,
      risk_level: formRiskLevel,
      last_interaction: formLastInteraction
    };

    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, payload);
        toast.success('Customer Updated', `"${formName}" has been successfully modified.`);
      } else {
        await addAccount(payload);
        toast.success('Customer Added', `"${formName}" has been added to the database.`);
      }
      setShowModal(false);
      fetchAccounts();
      if (onAccountsChange) onAccountsChange();
    } catch (e: any) {
      toast.error('Operation Failed', e.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete customer "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteAccount(id);
      toast.success('Customer Deleted', `"${name}" was successfully removed.`);
      fetchAccounts();
      if (onAccountsChange) onAccountsChange();
    } catch (e: any) {
      toast.error('Deletion Failed', e.message);
    }
  };

  const getHealthStyle = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/30';
    if (score >= 60) return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30';
    return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-900/30';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <ShieldCheck className="h-4 w-4" />;
    if (score >= 60) return <Shield className="h-4 w-4" />;
    return <ShieldAlert className="h-4 w-4" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
            <Users className="h-6.5 w-6.5 text-violet-500" />
            Customer Portfolio Accounts
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-450 mt-1">
            Manage your customer success accounts, ARR health scores, contract renewal timelines, and historical risk status.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-violet-600/10 hover:scale-[1.02] active:scale-[0.98] border-0"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading accounts portfolio...</div>
      ) : accounts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-550 max-w-lg mx-auto space-y-3">
          <Users className="h-10 w-10 text-slate-350 mx-auto opacity-60" />
          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Customers Added</h4>
          <p className="text-xs text-slate-400 dark:text-slate-550">Click the button above to register your first CS customer portfolio account.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs text-slate-700 dark:text-slate-350">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/30">
                  <th className="px-6 py-3.5">Client Account</th>
                  <th className="px-6 py-3.5">Industry</th>
                  <th className="px-6 py-3.5">ARR Value</th>
                  <th className="px-6 py-3.5">Health Score</th>
                  <th className="px-6 py-3.5">Renewal Date</th>
                  <th className="px-6 py-3.5">Tenure</th>
                  <th className="px-6 py-3.5">Risk Level</th>
                  <th className="px-6 py-3.5">Last Touch</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{acc.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{acc.id}</div>
                    </td>
                    <td className="px-6 py-4 font-medium flex items-center gap-1.5 mt-1.5">
                      <Landmark className="h-3.5 w-3.5 text-slate-400" />
                      {acc.industry || 'Technology'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-50">
                      <div className="flex items-center">
                        <DollarSign className="h-3.5 w-3.5 text-slate-455 shrink-0" />
                        <span>{formatCurrency(acc.arr)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${getHealthStyle(acc.health_score)}`}>
                        {getHealthIcon(acc.health_score)}
                        {acc.health_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {acc.renewal_date || '2026-12-31'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {acc.tenure_months} months
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        (acc.risk_level || 'Low') === 'High' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-250/20' : 
                        (acc.risk_level || 'Low') === 'Medium' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-250/20' :
                        'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-250/20'
                      }`}>
                        {(acc.risk_level || 'Low').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-550 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {acc.last_interaction || '2026-06-01'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(acc)}
                          className="p-1.5 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-all cursor-pointer bg-transparent border-0"
                          title="Edit Customer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(acc.id, acc.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-all cursor-pointer bg-transparent border-0"
                          title="Delete Customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border-0"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-500" />
              {editingAccount ? 'Edit Customer Details' : 'Add Client Account'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. GreenLeaf"
                  className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Industry</label>
                  <input
                    type="text"
                    value={formIndustry}
                    onChange={e => setFormIndustry(e.target.value)}
                    placeholder="e.g. Finance"
                    className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ARR Value ($)</label>
                  <input
                    type="number"
                    required
                    value={formArr}
                    onChange={e => setFormArr(Number(e.target.value))}
                    className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Health (%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formHealthScore}
                    onChange={e => setFormHealthScore(Number(e.target.value))}
                    className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tenure (mo)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formTenureMonths}
                    onChange={e => setFormTenureMonths(Number(e.target.value))}
                    className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Risk Level</label>
                  <select
                    value={formRiskLevel}
                    onChange={e => setFormRiskLevel(e.target.value)}
                    className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Renewal Date</label>
                  <input
                    type="date"
                    required
                    value={formRenewalDate}
                    onChange={e => setFormRenewalDate(e.target.value)}
                    className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Last Touch</label>
                  <input
                    type="date"
                    required
                    value={formLastInteraction}
                    onChange={e => setFormLastInteraction(e.target.value)}
                    className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer border-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-violet-600/10 border-0"
                >
                  {editingAccount ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
