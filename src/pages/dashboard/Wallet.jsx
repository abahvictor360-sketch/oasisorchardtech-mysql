import { useState, useEffect, useRef, useMemo } from 'react';
import { Wallet as WalletIcon, CreditCard, Plus, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useWallet } from '../../context/WalletContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { wallet as walletApi, payments as paymentsApi } from '../../lib/api';

const QUICK_AMOUNTS = [10, 25, 50, 100];
const txTypeVariant = { credit: 'success', debit: 'danger' };

// ── Stripe card form (must live inside <Elements>) ────────────────
function StripeTopUpForm({ amount, onSuccess, onError, onCancel }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) { onError('Stripe not ready.'); return; }
    setPaying(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/dashboard/wallet' },
      redirect: 'if_required',
    });
    if (error) { setPaying(false); onError(error.message); return; }
    if (paymentIntent?.status === 'succeeded') {
      // Confirm server-side and credit wallet
      const { data, error: cErr } = await walletApi.topupConfirm(paymentIntent.id);
      setPaying(false);
      if (cErr) { onError(cErr.message); return; }
      onSuccess(data.new_balance, amount);
    } else {
      setPaying(false);
      onError('Payment did not complete. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} disabled={paying}
          className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          Cancel
        </button>
        <button onClick={handlePay} disabled={paying}
          className="flex-1 bg-[#0a1628] text-white rounded-xl py-3 text-sm font-bold hover:bg-[#1bb0ce] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
          {paying ? <><Loader2 size={16} className="animate-spin" />Processing…</> : `Pay ${formatCurrency(amount)}`}
        </button>
      </div>
    </div>
  );
}

// ── Top-Up modal ──────────────────────────────────────────────────
function TopUpModal({ onClose, onSuccess }) {
  const [step, setStep]         = useState('amount');  // 'amount' | 'pay'
  const [amount, setAmount]     = useState('');
  const [method, setMethod]     = useState('stripe');
  const [payConfig, setPayConfig]   = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError]       = useState('');
  const [loadingIntent, setLoadingIntent] = useState(false);

  const numAmount = parseFloat(amount) || 0;

  // Load payment config
  useEffect(() => {
    paymentsApi.config().then(({ data }) => {
      if (data) {
        setPayConfig(data);
        if (data.stripe_enabled) setMethod('stripe');
      }
    });
  }, []);

  const stripePromise = useMemo(() => {
    if (payConfig?.stripe_enabled && payConfig?.stripe_publishable_key) {
      return loadStripe(payConfig.stripe_publishable_key);
    }
    return null;
  }, [payConfig?.stripe_enabled, payConfig?.stripe_publishable_key]);

  const proceedToPayment = async () => {
    if (numAmount < 1) { setError('Minimum top-up is $1.00.'); return; }
    setError('');
    if (method === 'stripe') {
      setLoadingIntent(true);
      const { data, error: err } = await walletApi.topupStripe(numAmount);
      setLoadingIntent(false);
      if (err) { setError(err.message); return; }
      setClientSecret(data.clientSecret);
    }
    setStep('pay');
  };

  const stripeOptions = clientSecret
    ? { clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#1bb0ce', borderRadius: '10px' } } }
    : null;

  const noPayments = payConfig && !payConfig.stripe_enabled;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a1628] to-[#1bb0ce] p-5 text-white flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs mb-0.5">Add funds to your wallet</p>
            <h2 className="font-bold text-lg">Top Up Wallet</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {noPayments && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              Online payments are not enabled. Contact support to top up your wallet.
            </div>
          )}

          {/* Step 1: Choose amount */}
          {step === 'amount' && !noPayments && (
            <>
              {/* Quick amounts */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick select</p>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_AMOUNTS.map(q => (
                    <button key={q} onClick={() => setAmount(String(q))}
                      className={[
                        'py-2.5 rounded-xl border-2 text-sm font-bold transition-all',
                        String(amount) === String(q)
                          ? 'border-[#1bb0ce] bg-[#f0fbff] text-[#1bb0ce]'
                          : 'border-gray-200 text-gray-700 hover:border-[#1bb0ce]/50',
                      ].join(' ')}>
                      ${q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Or enter amount (CAD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  <input type="number" min="1" step="0.01" value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full border-2 border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#1bb0ce]" />
                </div>
              </div>

              {/* Payment method tabs */}
              {payConfig && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pay with</p>
                  <div className="flex gap-2">
                    {payConfig.stripe_enabled && (
                      <button onClick={() => setMethod('stripe')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium flex-1 justify-center transition-all
                          ${method === 'stripe' ? 'border-[#1bb0ce] bg-[#f0fbff] text-[#1bb0ce]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        <CreditCard size={15} />Card
                      </button>
                    )}
                  </div>
                </div>
              )}

              {numAmount > 0 && (
                <p className="text-sm text-gray-500">
                  You will add <span className="font-bold text-emerald-600">{formatCurrency(numAmount)}</span> to your wallet.
                </p>
              )}

              <button onClick={proceedToPayment} disabled={numAmount < 1 || loadingIntent}
                className="w-full bg-[#0a1628] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1bb0ce] disabled:opacity-40 flex items-center justify-center gap-2 transition-colors mt-2">
                {loadingIntent ? <><Loader2 size={16} className="animate-spin" />Loading payment form…</> : `Continue → ${numAmount > 0 ? formatCurrency(numAmount) : ''}`}
              </button>
            </>
          )}

          {/* Step 2: Payment */}
          {step === 'pay' && (
            <>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2">
                <span className="text-sm text-gray-600">Amount to add</span>
                <span className="font-bold text-[#0a1628] text-lg">{formatCurrency(numAmount)}</span>
              </div>

              {method === 'stripe' && stripePromise && stripeOptions && (
                <Elements stripe={stripePromise} options={stripeOptions}>
                  <StripeTopUpForm
                    amount={numAmount}
                    onSuccess={onSuccess}
                    onError={msg => setError(msg)}
                    onCancel={() => { setStep('amount'); setClientSecret(null); setError(''); }}
                  />
                </Elements>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Success overlay ───────────────────────────────────────────────
function SuccessOverlay({ amount, newBalance, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={36} className="text-emerald-500" />
        </div>
        <h2 className="font-bold text-gray-900 text-xl mb-1">Payment Successful!</h2>
        <p className="text-gray-500 text-sm mb-4">
          <span className="font-bold text-emerald-600">{formatCurrency(amount)}</span> has been added to your wallet.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-500 mb-1">New balance</p>
          <p className="text-3xl font-bold text-[#0a1628]">{formatCurrency(newBalance)}</p>
        </div>
        <button onClick={onClose}
          className="w-full bg-[#0a1628] text-white py-3 rounded-xl font-bold hover:bg-[#1bb0ce] transition-colors">
          Done
        </button>
      </div>
    </div>
  );
}

// ── Main Wallet page ──────────────────────────────────────────────
export default function Wallet() {
  const { balance, filteredTransactions, filter, setFilter, loading, updateBalance } = useWallet();
  const [showTopUp,  setShowTopUp]  = useState(false);
  const [successData, setSuccessData] = useState(null); // { amount, newBalance }

  const filterTabs = [
    { key: 'all',    label: 'All' },
    { key: 'credit', label: 'Credits' },
    { key: 'debit',  label: 'Debits' },
  ];

  const handleSuccess = (newBalance, amount) => {
    setShowTopUp(false);
    setSuccessData({ amount, newBalance });
    // Refresh balance in context
    if (typeof updateBalance === 'function') updateBalance(newBalance);
  };

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#1bb0ce] p-7 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0 shadow-inner">
            <WalletIcon size={28} />
          </div>
          <div>
            <p className="text-white/60 text-sm mb-0.5">Available Balance</p>
            <p className="text-4xl font-bold tracking-tight">{formatCurrency(balance)}</p>
            <p className="text-white/50 text-xs mt-0.5">CAD · Oasis Orchard Wallet</p>
          </div>
        </div>
        <button
          onClick={() => setShowTopUp(true)}
          className="flex items-center gap-2 bg-white text-[#0a1628] font-bold px-6 py-3 rounded-xl text-sm shadow hover:bg-[#e0f7fb] hover:text-[#1bb0ce] transition-colors self-start sm:self-auto flex-shrink-0">
          <Plus size={16} />Top Up Wallet
        </button>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Transaction History</h3>
          <div className="flex gap-1.5">
            {filterTabs.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={[
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  filter === tab.key
                    ? 'bg-[#1bb0ce] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                ].join(' ')}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-400 text-sm">
            <Loader2 size={18} className="animate-spin" />Loading transactions…
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState icon={WalletIcon} title="No transactions yet"
            description="Your transaction history will appear here after your first top-up or purchase." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((txn, i) => (
                  <tr key={txn.id ?? i} className="border-t border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(txn.created_at || txn.date)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 max-w-[200px] truncate">{txn.description}</td>
                    <td className={`px-5 py-3.5 font-bold whitespace-nowrap ${txn.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {txn.type === 'credit' ? '+' : '−'}{formatCurrency(Math.abs(txn.amount))}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs hidden md:table-cell whitespace-nowrap">
                      {txn.balance_after != null ? formatCurrency(txn.balance_after) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showTopUp && (
        <TopUpModal
          onClose={() => setShowTopUp(false)}
          onSuccess={handleSuccess}
        />
      )}
      {successData && (
        <SuccessOverlay
          amount={successData.amount}
          newBalance={successData.newBalance}
          onClose={() => setSuccessData(null)}
        />
      )}
    </div>
  );
}
