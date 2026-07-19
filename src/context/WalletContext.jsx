import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { getWalletTransactions, topUpWallet, deductWallet } from '../lib/db';
import { wallet as walletApi } from '../lib/api';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  // Derive balance from user profile (source of truth)
  const balance = user?.walletBalance ?? 0;

  // Load transactions when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setLoading(true);
      getWalletTransactions(user.id)
        .then(setTransactions)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setTransactions([]);
    }
  }, [isAuthenticated, user?.id]);

  async function topUp(amount) {
    if (!user?.id) throw new Error('Not authenticated');
    const { transaction, newBalance } = await topUpWallet(user.id, amount);
    setTransactions(prev => [transaction, ...prev]);
    await updateUser({ walletBalance: newBalance });
    return { newBalance };
  }

  async function updateBalance(newBalance) {
    await updateUser({ walletBalance: newBalance });
    if (user?.id) {
      const { data } = await walletApi.transactions(user.id);
      if (data) setTransactions(data);
    }
  }

  async function deduct(amount, description) {
    if (!user?.id) throw new Error('Not authenticated');
    const { transaction, newBalance } = await deductWallet(user.id, amount, description);
    setTransactions(prev => [transaction, ...prev]);
    await updateUser({ walletBalance: newBalance });
    return { newBalance };
  }

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.type === filter);
  }, [transactions, filter]);

  return (
    <WalletContext.Provider value={{
      balance,
      transactions,
      filteredTransactions,
      loading,
      filter,
      setFilter,
      topUp,
      deduct,
      updateBalance,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
