import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { transactions as mockTransactions, users } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
const txTypeVariant = { credit: 'success', debit: 'danger' };

export default function AdminWallet() {
  const { addToast } = useApp();
  const [transactions, setTransactions] = useState(
    [...mockTransactions].sort((a, b) => new Date(b.date) - new Date(a.date))
  );
  const [filter, setFilter] = useState('all');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDesc, setCreditDesc] = useState('');

  const totalCredits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebits = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(t.amount), 0);
  const netRevenue = totalCredits - totalDebits;

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.type === filter);
  }, [transactions, filter]);

  const handleCredit = () => {
    const num = parseFloat(creditAmount);
    if (!num || num <= 0) { addToast('Enter a valid amount.', 'error'); return; }
    const newTx = {
      id: `TXN-ADM-${Date.now()}`,
      userId: selectedUserId,
      date: new Date().toISOString().split('T')[0],
      description: creditDesc || 'Admin credit',
      amount: num,
      type: 'credit',
      balance: 0,
    };
    setTransactions(prev => [newTx, ...prev]);
    addToast(`Credited ${formatCurrency(num)} to ${userMap[selectedUserId]}!`, 'success');
    setShowCreditModal(false); setCreditAmount(''); setCreditDesc('');
  };

  const summaryCards = [
    { label: 'Total Credits', value: formatCurrency(totalCredits), icon: TrendingUp, color: 'bg-green-50 text-green-600' },
    { label: 'Total Debits', value: formatCurrency(totalDebits), icon: TrendingDown, color: 'bg-red-50 text-red-500' },
    { label: 'Net Revenue', value: formatCurrency(netRevenue), icon: DollarSign, color: 'bg-[#1bb0ce]/10 text-[#1bb0ce]' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0a1628]">Wallet Management</h2>
        <Button onClick={() => setShowCreditModal(true)}><Plus size={16} /> Credit User Wallet</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-base font-bold text-[#0a1628]">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[{ key: 'all', label: 'All' }, { key: 'credit', label: 'Credits' }, { key: 'debit', label: 'Debits' }].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
              filter === tab.key ? 'bg-[#1bb0ce] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transactions table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-gray-500 font-medium">User</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Description</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Amount</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(txn => (
                <tr key={txn.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-[#0a1628]">{userMap[txn.userId] || txn.userId}</td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(txn.date)}</td>
                  <td className="px-5 py-3 text-gray-600">{txn.description}</td>
                  <td className={`px-5 py-3 font-semibold whitespace-nowrap ${txn.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                    {txn.type === 'credit' ? '+' : ''}{formatCurrency(txn.amount)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={txTypeVariant[txn.type] || 'default'} size="sm">
                      {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Credit Modal */}
      <Modal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        title="Credit User Wallet"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreditModal(false)}>Cancel</Button>
            <Button onClick={handleCredit}>Credit Wallet</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select User</label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50"
            >
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount ($)</label>
            <input
              type="number" min="1" step="0.01"
              value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <input
              value={creditDesc} onChange={e => setCreditDesc(e.target.value)}
              placeholder="Reason for credit..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
