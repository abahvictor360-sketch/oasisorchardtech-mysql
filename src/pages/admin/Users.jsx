import { useState, useMemo, useEffect } from 'react';
import { Eye, Edit2, PlusCircle, Ban, Trash2, Search, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, UserCheck } from 'lucide-react';
import { users as usersApi, wallet as walletApi } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, getInitials } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const PAGE_SIZE = 10;

const PLAN_OPTIONS = [
  { value: 'basic',    label: 'Basic Connect',    price: 10 },
  { value: 'smart',    label: 'Smart Connect',    price: 15 },
  { value: 'business', label: 'Business Connect', price: 25 },
];

const statusBadge   = { active: 'success', suspended: 'danger' };
const planBadge     = { basic: 'default',  smart: 'info',       business: 'purple' };

export default function Users() {
  const { addToast } = useApp();

  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [search,       setSearch]       = useState('');
  const [planFilter,   setPlanFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page,         setPage]         = useState(1);

  // modals
  const [viewModal,     setViewModal]     = useState(null);
  const [planModal,     setPlanModal]     = useState(null);
  const [creditModal,   setCreditModal]   = useState(null);
  const [confirmModal,  setConfirmModal]  = useState(null);

  // form state
  const [selectedPlan,  setSelectedPlan]  = useState('');
  const [creditAmount,  setCreditAmount]  = useState('');
  const [creditNote,    setCreditNote]    = useState('');

  // ── Load users from Supabase ──
  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await usersApi.list();
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      addToast('Failed to load users: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  // ── Filter & paginate ──
  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      if (q && !u.name?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
      if (planFilter   && u.plan   !== planFilter)   return false;
      if (statusFilter && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, search, planFilter, statusFilter]);

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Actions ──
  const updateUser = async (id, updates) => {
    const current = users.find(u => u.id === id) || {};
    const { error } = await usersApi.update(id, { ...current, ...updates });
    if (error) throw error;
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  // Change subscription plan
  const handleSavePlan = async () => {
    if (!selectedPlan || !planModal) return;
    setSaving(true);
    try {
      await updateUser(planModal.id, { plan: selectedPlan });
      addToast(`Plan updated to ${PLAN_OPTIONS.find(p => p.value === selectedPlan)?.label}!`, 'success');
      setPlanModal(null);
    } catch (err) {
      addToast('Failed to update plan: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  // Credit wallet
  const handleCredit = async () => {
    const amount = parseFloat(creditAmount);
    if (!amount || amount <= 0) { addToast('Enter a valid amount.', 'error'); return; }
    setSaving(true);
    try {
      const user = users.find(u => u.id === creditModal.id);
      const newBalance = (user?.wallet_balance || 0) + amount;
      await updateUser(creditModal.id, { wallet_balance: newBalance });
      // Record transaction
      await walletApi.credit({
        user_id: creditModal.id,
        description: creditNote || 'Admin credit',
        amount,
      });
      addToast(`${formatCurrency(amount)} credited to ${creditModal.name}!`, 'success');
      setCreditModal(null); setCreditAmount(''); setCreditNote('');
    } catch (err) {
      addToast('Credit failed: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  // Toggle suspend
  const handleSuspend = async (user) => {
    setSaving(true);
    try {
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      await updateUser(user.id, { status: newStatus });
      addToast(`User ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}.`, 'success');
      setConfirmModal(null);
    } catch (err) {
      addToast('Action failed: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  // Delete user (removes profile; auth user remains)
  const handleDelete = async (user) => {
    setSaving(true);
    try {
      await usersApi.remove(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      addToast('User removed.', 'success');
      setConfirmModal(null);
    } catch (err) {
      addToast('Delete failed: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0a1628]">User Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} registered users</p>
        </div>
        <Button variant="outline" onClick={loadUsers} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40" />
        </div>
        <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40">
          <option value="">All Plans</option>
          {PLAN_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['User','Email','Plan','Status','Wallet','Joined','Actions'].map(h => (
                      <th key={h} className={`text-left px-4 py-3 text-gray-500 font-medium ${['Email','Joined'].includes(h) ? 'hidden lg:table-cell' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">No users found.</td></tr>
                  ) : paginated.map(u => (
                    <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0a1628] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {getInitials(u.name || u.email)}
                          </div>
                          <div>
                            <div className="font-medium text-[#0a1628]">{u.name || '—'}</div>
                            <div className="text-xs text-gray-400 lg:hidden">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={planBadge[u.plan] || 'default'} size="sm">
                          {PLAN_OPTIONS.find(p => p.value === u.plan)?.label ?? u.plan ?? '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadge[u.status] || 'default'} size="sm">
                          {u.status ?? 'active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#0a1628]">
                        {formatCurrency(u.wallet_balance || 0)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button title="View" onClick={() => setViewModal(u)}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition-colors"><Eye size={14} /></button>
                          <button title="Change Plan" onClick={() => { setPlanModal(u); setSelectedPlan(u.plan || 'basic'); }}
                            className="p-1.5 rounded hover:bg-purple-50 text-purple-500 transition-colors"><Edit2 size={14} /></button>
                          <button title="Credit Wallet" onClick={() => setCreditModal(u)}
                            className="p-1.5 rounded hover:bg-green-50 text-green-500 transition-colors"><PlusCircle size={14} /></button>
                          <button title={u.status === 'active' ? 'Suspend' : 'Reactivate'}
                            onClick={() => setConfirmModal({ type: 'suspend', user: u })}
                            className={`p-1.5 rounded transition-colors ${u.status === 'active' ? 'hover:bg-orange-50 text-orange-500' : 'hover:bg-green-50 text-green-500'}`}>
                            {u.status === 'active' ? <Ban size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button title="Delete" onClick={() => setConfirmModal({ type: 'delete', user: u })}
                            className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"><ChevronLeft size={16} /></button>
                  {Array.from({length: totalPages}, (_,i) => (
                    <button key={i+1} onClick={() => setPage(i+1)}
                      className={`w-8 h-8 text-sm rounded-lg transition-colors ${page===i+1 ? 'bg-[#1bb0ce] text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                      {i+1}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* View User Modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="User Details" size="md">
        {viewModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#0a1628] flex items-center justify-center text-white text-xl font-bold">
                {getInitials(viewModal.name || viewModal.email)}
              </div>
              <div>
                <div className="font-semibold text-[#0a1628] text-lg">{viewModal.name || '—'}</div>
                <div className="text-gray-500 text-sm">{viewModal.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Phone',    viewModal.phone || '—'],
                ['Plan',     PLAN_OPTIONS.find(p => p.value === viewModal.plan)?.label ?? viewModal.plan ?? '—'],
                ['Status',   viewModal.status ?? 'active'],
                ['Balance',  formatCurrency(viewModal.wallet_balance || 0)],
                ['Role',     viewModal.role ?? 'user'],
                ['Joined',   formatDate(viewModal.created_at)],
              ].map(([label, val]) => (
                <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                  <div className="font-medium text-[#0a1628] capitalize">{val}</div>
                </div>
              ))}
            </div>
            {viewModal.address && (
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <div className="text-xs text-gray-400 mb-0.5">Address</div>
                <div className="text-[#0a1628]">{viewModal.address}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Change Plan Modal */}
      <Modal isOpen={!!planModal} onClose={() => setPlanModal(null)} title="Change Subscription Plan"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPlanModal(null)}>Cancel</Button>
            <Button onClick={handleSavePlan} loading={saving}>Save Plan</Button>
          </>
        }>
        {planModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Changing plan for <strong>{planModal.name || planModal.email}</strong>.
              Current plan: <Badge variant={planBadge[planModal.plan] || 'default'} size="sm" className="ml-1">
                {PLAN_OPTIONS.find(p => p.value === planModal.plan)?.label ?? planModal.plan}
              </Badge>
            </p>
            <div className="space-y-2">
              {PLAN_OPTIONS.map(plan => (
                <label key={plan.value} className={[
                  'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors',
                  selectedPlan === plan.value ? 'border-[#1bb0ce] bg-[#1bb0ce]/5' : 'border-gray-100 hover:border-gray-200',
                ].join(' ')}>
                  <input type="radio" name="plan" value={plan.value} checked={selectedPlan === plan.value}
                    onChange={() => setSelectedPlan(plan.value)} className="accent-[#1bb0ce]" />
                  <div className="flex-1">
                    <div className="font-medium text-[#0a1628]">{plan.label}</div>
                    <div className="text-sm text-gray-500">${plan.price}/month</div>
                  </div>
                  {selectedPlan === plan.value && <CheckCircle size={18} className="text-[#1bb0ce]" />}
                </label>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Credit Wallet Modal */}
      <Modal isOpen={!!creditModal} onClose={() => setCreditModal(null)} title="Credit Wallet"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreditModal(null)}>Cancel</Button>
            <Button onClick={handleCredit} loading={saving}>Add Funds</Button>
          </>
        }>
        {creditModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Add funds to <strong>{creditModal.name || creditModal.email}</strong>'s wallet.
              Current balance: <strong className="text-green-600">{formatCurrency(creditModal.wallet_balance || 0)}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount ($)</label>
              <input type="number" min="1" step="0.01" value={creditAmount}
                onChange={e => setCreditAmount(e.target.value)} placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Note (optional)</label>
              <input value={creditNote} onChange={e => setCreditNote(e.target.value)} placeholder="e.g. Promotional credit"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40" />
            </div>
            <div className="flex gap-2">
              {[10, 25, 50, 100].map(amt => (
                <button key={amt} onClick={() => setCreditAmount(String(amt))}
                  className="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:border-[#1bb0ce] hover:text-[#1bb0ce] transition-colors">
                  ${amt}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Modal (Suspend / Delete) */}
      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)}
        title={confirmModal?.type === 'delete' ? 'Delete User' : confirmModal?.user?.status === 'active' ? 'Suspend User' : 'Reactivate User'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button
              variant={confirmModal?.type === 'delete' ? 'danger' : 'primary'}
              loading={saving}
              onClick={() => confirmModal?.type === 'delete'
                ? handleDelete(confirmModal.user)
                : handleSuspend(confirmModal.user)
              }>
              Confirm
            </Button>
          </>
        }>
        {confirmModal && (
          <p className="text-sm text-gray-600">
            {confirmModal.type === 'delete'
              ? <>Are you sure you want to <strong>permanently delete</strong> <strong>{confirmModal.user.name || confirmModal.user.email}</strong>? This cannot be undone.</>
              : confirmModal.user.status === 'active'
                ? <>Suspend <strong>{confirmModal.user.name || confirmModal.user.email}</strong>? They will lose access to their dashboard.</>
                : <>Reactivate <strong>{confirmModal.user.name || confirmModal.user.email}</strong>? They will regain full access.</>
            }
          </p>
        )}
      </Modal>
    </div>
  );
}
