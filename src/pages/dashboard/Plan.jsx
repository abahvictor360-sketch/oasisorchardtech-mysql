import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Check, ArrowRight, AlertTriangle, CreditCard, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useApp } from '../../context/AppContext';
import { payments as paymentsApi, plan as planApi } from '../../lib/api';
import { servicePlans } from '../../data/products';
import { formatCurrency } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const planColorMap = {
  basic: { border: 'border-blue-200', badge: 'info', btn: 'bg-blue-500 hover:bg-blue-600' },
  smart: { border: 'border-[#1bb0ce]', badge: 'info', btn: 'bg-[#1bb0ce] hover:bg-[#159ab5]' },
  business: { border: 'border-purple-200', badge: 'purple', btn: 'bg-purple-500 hover:bg-purple-600' },
};

// ── Stripe card form (must live inside <Elements>) ────────────────
function StripePlanForm({ amount, onSuccess, onError, onCancel }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) { onError('Stripe not ready.'); return; }
    setPaying(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/dashboard/plan' },
      redirect: 'if_required',
    });
    if (error) { setPaying(false); onError(error.message); return; }
    if (paymentIntent?.status === 'succeeded') {
      const { data, error: cErr } = await paymentsApi.confirmPlan(paymentIntent.id);
      setPaying(false);
      if (cErr) { onError(cErr.message); return; }
      onSuccess(data);
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

// ── Stripe subscribe modal ────────────────────────────────────────
function StripeSubscribeModal({ targetPlan, onClose, onSuccess }) {
  const [payConfig, setPayConfig]       = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    paymentsApi.config().then(({ data }) => {
      setPayConfig(data);
      if (!data?.stripe_enabled) { setLoading(false); return; }
      paymentsApi.createPlanIntent(targetPlan.id).then(({ data: intent, error: err }) => {
        setLoading(false);
        if (err) { setError(err.message); return; }
        setClientSecret(intent.clientSecret);
      });
    });
  }, [targetPlan.id]);

  const stripePromise = useMemo(() => {
    if (payConfig?.stripe_enabled && payConfig?.stripe_publishable_key) {
      return loadStripe(payConfig.stripe_publishable_key);
    }
    return null;
  }, [payConfig?.stripe_enabled, payConfig?.stripe_publishable_key]);

  const stripeOptions = clientSecret
    ? { clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#1bb0ce', borderRadius: '10px' } } }
    : null;

  return (
    <Modal isOpen onClose={onClose} title={`Subscribe to ${targetPlan.name}`}>
      <div className="space-y-4">
        {error && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm">
            <Loader2 size={18} className="animate-spin" />Loading secure payment form…
          </div>
        )}

        {!loading && payConfig && !payConfig.stripe_enabled && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            Online payments are not enabled yet. Please use "Pay with Wallet" instead, or contact support.
          </div>
        )}

        {!loading && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-sm text-gray-600">Plan price (added to your wallet)</span>
            <span className="font-bold text-[#0a1628] text-lg">{formatCurrency(targetPlan.price)}</span>
          </div>
        )}

        <p className="text-xs text-gray-400">
          This payment is credited to your wallet balance and used to pay for calls on the platform.
          When your balance runs low, top up any time from the Wallet page.
        </p>

        {stripePromise && stripeOptions && (
          <Elements stripe={stripePromise} options={stripeOptions}>
            <StripePlanForm
              amount={targetPlan.price}
              onSuccess={onSuccess}
              onError={setError}
              onCancel={onClose}
            />
          </Elements>
        )}
      </div>
    </Modal>
  );
}

export default function Plan() {
  const { user, refreshUser } = useAuth();
  const { balance } = useWallet();
  const { addToast } = useApp();
  const location = useLocation();

  const [upgradeTarget, setUpgradeTarget] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [stripeTarget, setStripeTarget] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('welcome') === '1') {
      setShowWelcome(true);
      window.history.replaceState({}, '', '/dashboard/plan');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActivePlan = !!user?.plan && user.plan !== 'none';
  const currentPlan = hasActivePlan ? servicePlans.find(p => p.id === user.plan) : null;
  const otherPlans = hasActivePlan ? servicePlans.filter(p => p.id !== user.plan) : servicePlans;

  const canAfford = upgradeTarget ? balance >= upgradeTarget.price : false;
  const priceDiff = upgradeTarget && currentPlan ? (upgradeTarget.price - currentPlan.price) : 0;

  const handleUpgrade = async () => {
    if (!upgradeTarget || !canAfford) return;
    setUpgrading(true);
    try {
      const { error } = await planApi.upgrade(upgradeTarget.id);
      if (error) throw new Error(error.message);
      await refreshUser();
      addToast(`${hasActivePlan ? 'Plan upgraded to' : 'Subscribed to'} ${upgradeTarget.name}!`, 'success');
      setUpgradeTarget(null);
    } catch (e) {
      addToast(e.message || 'Upgrade failed.', 'error');
    } finally {
      setUpgrading(false);
    }
  };

  const handleStripeSuccess = async (data) => {
    setStripeTarget(null);
    await refreshUser();
    addToast(`Subscribed! ${formatCurrency(data.amount)} was added to your wallet for calls.`, 'success');
  };

  const handleCancelPlan = async () => {
    setCancelling(true);
    try {
      const { error } = await planApi.cancel();
      if (error) throw new Error(error.message);
      await refreshUser();
      addToast('Your plan has been cancelled.', 'success');
      setShowCancelConfirm(false);
    } catch (e) {
      addToast(e.message || 'Cancel failed.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {showWelcome && (
        <div className="flex items-start justify-between gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          <div>
            <p className="font-semibold text-green-900 mb-1">🎉 Welcome to Oasis Orchard!</p>
            <p>Your account is ready. Choose a plan below and subscribe to activate your service.</p>
          </div>
          <button onClick={() => setShowWelcome(false)} className="text-green-500 hover:text-green-700 flex-shrink-0 text-lg leading-none" aria-label="Dismiss">×</button>
        </div>
      )}

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <CreditCard size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Plan payments go to your wallet.</span> When you subscribe or upgrade,
          the amount is credited to your wallet balance and used to pay for calls on the platform.
        </div>
      </div>

      {/* Current plan */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Current Plan</h3>
        {hasActivePlan ? (
          <Card className={`border-2 ${planColorMap[currentPlan.id]?.border || 'border-gray-200'} relative`}>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-[#0a1628]">{currentPlan.name}</h2>
                    <Badge variant="success" size="sm">Current Plan</Badge>
                  </div>
                  <p className="text-3xl font-extrabold text-[#1bb0ce]">
                    ${currentPlan.price}<span className="text-base font-medium text-gray-400">/mo</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
                >
                  <XCircle size={15} /> Cancel Plan
                </button>
              </div>
              <ul className="mt-4 grid sm:grid-cols-2 gap-2">
                {currentPlan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check size={14} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ) : (
          <Card className="border-2 border-dashed border-gray-200">
            <div className="p-6 text-center">
              <p className="font-semibold text-[#0a1628] mb-1">No Active Plan</p>
              <p className="text-sm text-gray-500">Subscribe to a plan below to activate phone service.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Available plans */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {hasActivePlan ? 'Available Upgrades' : 'Choose a Plan'}
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {otherPlans.map(plan => (
            <Card key={plan.id} className={`border-2 ${planColorMap[plan.id]?.border || 'border-gray-200'}`} hover>
              <div className="p-6">
                <h3 className="text-lg font-bold text-[#0a1628] mb-1">{plan.name}</h3>
                <p className="text-2xl font-extrabold text-[#1bb0ce] mb-4">
                  ${plan.price}<span className="text-sm font-medium text-gray-400">/mo</span>
                </p>
                <ul className="space-y-1.5 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={13} className="text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2">
                  <Button fullWidth onClick={() => setStripeTarget(plan)} className="gap-2">
                    <CreditCard size={15} /> Subscribe with Stripe
                  </Button>
                  <Button fullWidth variant="outline" onClick={() => setUpgradeTarget(plan)} className="gap-2">
                    Pay with Wallet <ArrowRight size={15} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Wallet payment modal */}
      <Modal
        isOpen={!!upgradeTarget}
        onClose={() => setUpgradeTarget(null)}
        title={hasActivePlan ? 'Confirm Plan Upgrade' : 'Confirm Subscription'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setUpgradeTarget(null)}>Cancel</Button>
            <Button loading={upgrading} disabled={!canAfford} onClick={handleUpgrade}>
              {hasActivePlan ? 'Upgrade' : 'Subscribe'}
            </Button>
          </>
        }
      >
        {upgradeTarget && (
          <div className="space-y-4">
            {currentPlan && (
              <div className="flex items-center gap-3 text-sm font-medium">
                <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-[#0a1628]">{currentPlan.name}</span>
                <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />
                <span className="px-3 py-1.5 bg-[#1bb0ce]/10 text-[#1bb0ce] rounded-lg">{upgradeTarget.name}</span>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Plan price</span>
                <span className="font-semibold">{formatCurrency(upgradeTarget.price)}/mo</span>
              </div>
              {priceDiff !== 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Price difference</span>
                  <span className={`font-semibold ${priceDiff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff)}/mo
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-500">Your wallet balance</span>
                <span className={`font-bold ${canAfford ? 'text-green-600' : 'text-red-500'}`}>
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>

            {!canAfford && (
              <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                Insufficient balance. Top up your wallet first, or subscribe with Stripe instead.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Stripe subscribe modal */}
      {stripeTarget && (
        <StripeSubscribeModal
          targetPlan={stripeTarget}
          onClose={() => setStripeTarget(null)}
          onSuccess={handleStripeSuccess}
        />
      )}

      {/* Cancel confirmation */}
      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Cancel Your Plan?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCancelConfirm(false)}>Keep Plan</Button>
            <Button variant="danger" loading={cancelling} onClick={handleCancelPlan}>Cancel Plan</Button>
          </>
        }
      >
        <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            Cancelling stops your {currentPlan?.name} service. Your wallet balance is not affected and can still be used for calls.
            You can subscribe again any time.
          </span>
        </div>
      </Modal>
    </div>
  );
}
