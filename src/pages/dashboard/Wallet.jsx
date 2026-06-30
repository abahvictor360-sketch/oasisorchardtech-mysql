import { useState } from 'react';
import { Wallet as WalletIcon } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

const QUICK_AMOUNTS = [10, 20, 50];

const txTypeVariant = { credit: 'success', debit: 'danger' };

export default function Wallet() {
  const { balance, filteredTransactions, filter, setFilter, topUp, loading } = useWallet();
  const { addToast } = useApp();
  const [showTopUp, setShowTopUp] = useState(false);
  const [amount, setAmount] = useState('');

  const handleTopUp = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      addToast('Please enter a valid amount.', 'error');
      return;
    }
    try {
      await topUp(num);
      addToast('Wallet topped up successfully!', 'success');
      setShowTopUp(false);
      setAmount('');
    } catch (e) {
      addToast(e.message || 'Top-up failed.', 'error');
    }
  };

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'credit', label: 'Credits' },
    { key: 'debit', label: 'Debits' },
  ];

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <div className="rounded-xl bg-gradient-to-r from-[#0a1628] to-[#1bb0ce] p-7 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <WalletIcon size={28} />
          </div>
          <div>
            <p className="text-white/70 text-sm mb-1">Available Balance</p>
            <p className="text-4xl font-bold">{formatCurrency(balance)}</p>
          </div>
        </div>
        <Button
          variant="outline"
          variant="white-outline" className="self-start sm:self-auto"
          onClick={() => setShowTopUp(true)}
        >
          Top Up Wallet
        </Button>
      </div>

      {/* Filter tabs + transaction table */}
      <Card>
        <div className="flex items-center gap-2 px-5 pt-5 pb-4 border-b border-gray-100">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={[
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
                filter === tab.key
                  ? 'bg-[#1bb0ce] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={WalletIcon}
            title="No transactions found"
            description="Your transaction history will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Description</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Type</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium hidden md:table-cell">Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(txn => (
                  <tr key={txn.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{formatDate(txn.date)}</td>
                    <td className="px-5 py-3 text-gray-700">{txn.description}</td>
                    <td className={`px-5 py-3 font-semibold whitespace-nowrap ${txn.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                      {txn.type === 'credit' ? '+' : ''}{formatCurrency(txn.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={txTypeVariant[txn.type] || 'default'} size="sm">
                        {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-600 hidden md:table-cell whitespace-nowrap">
                      {txn.balance !== undefined ? formatCurrency(txn.balance) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Top Up Modal */}
      <Modal
        isOpen={showTopUp}
        onClose={() => { setShowTopUp(false); setAmount(''); }}
        title="Top Up Wallet"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowTopUp(false); setAmount(''); }}>
              Cancel
            </Button>
            <Button loading={loading} onClick={handleTopUp} disabled={!amount || parseFloat(amount) <= 0}>
              Add Funds
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">Quick select:</p>
            <div className="flex gap-2">
              {QUICK_AMOUNTS.map(q => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className={[
                    'flex-1 py-2 rounded-lg border text-sm font-semibold transition-all duration-150',
                    String(amount) === String(q)
                      ? 'bg-[#1bb0ce] text-white border-[#1bb0ce]'
                      : 'border-gray-200 text-gray-700 hover:border-[#1bb0ce] hover:text-[#1bb0ce]',
                  ].join(' ')}
                >
                  ${q}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Or enter custom amount ($)
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:border-[#1bb0ce]"
            />
          </div>
          {amount && parseFloat(amount) > 0 && (
            <p className="text-sm text-gray-500">
              You will add <span className="font-semibold text-green-600">{formatCurrency(parseFloat(amount))}</span> to your wallet.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
