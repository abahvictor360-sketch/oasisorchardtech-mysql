import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, ArrowRight, AlertTriangle, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useApp } from '../../context/AppContext';
// Stripe checkout via Supabase Edge Function not available in MySQL version
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

export default function Plan() {
  const { user, updateUser } = useAuth();
  const { balance, deduct } = useWallet();
  const { addToast } = useApp();
  const location = useLocation();

  const [upgradeTarget, setUpgradeTarget] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Handle Stripe success/cancel return + new-user welcome flag
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const success = params.get('success');
    const canceled = params.get('canceled');
    const planId = params.get('plan');
    const welcome = params.get('welcome');

    if (success === 'true') {
      addToast('Subscription activated! Your plan is now active.', 'success');
      if (planId) updateUser({ plan: planId });
      window.history.replaceState({}, '', '/dashboard/plan');
    } else if (canceled === 'true') {
      addToast('Stripe checkout was canceled.', 'warning');
      window.history.replaceState({}, '', '/dashboard/plan');
    } else if (welcome === '1') {
      setShowWelcome(true);
      window.history.replaceState({}, '', '/dashboard/plan');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentPlan = servicePlans.find(p => p.id === user?.plan) || servicePlans[0];
  const otherPlans = servicePlans.filter(p => p.id !== user?.plan);

  const canAfford = upgradeTarget ? balance >= upgradeTarget.price : false;
  const priceDiff = upgradeTarget ? (upgradeTarget.price - currentPlan.price) : 0;

  const handleUpgrade = async () => {
    if (!upgradeTarget || !canAfford) return;
    setUpgrading(true);
    await new Promise(r => setTimeout(r, 800));
    try {
      deduct(upgradeTarget.price, `Plan upgrade to ${upgradeTarget.name}`);
      updateUser({ plan: upgradeTarget.id });
      addToast(`Plan upgraded to ${upgradeTarget.name}!`, 'success');
      setUpgradeTarget(null);
    } catch (e) {
      addToast(e.message || 'Upgrade failed.', 'error');
    } finally {
      setUpgrading(false);
    }
  };

  const handleStripeSubscribe = async (plan) => {
    setStripeLoading(plan.id);
    try {
      throw new Error('Stripe checkout not configured. Please contact support to upgrade your plan.');
    } catch (err) {
      addToast('Stripe checkout unavailable. Please use wallet payment or contact support.', 'error');
    } finally {
      setStripeLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner for new registrations */}
      {showWelcome && (
        <div className="flex items-start justify-between gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          <div>
            <p className="font-semibold text-green-900 mb-1">🎉 Welcome to Oasis Orchard!</p>
            <p>Your account is ready. Choose a plan below and subscribe to activate your service.</p>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            className="text-green-500 hover:text-green-700 flex-shrink-0 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Stripe info box */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <CreditCard size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Stripe subscriptions</span> are billed monthly and renew automatically.
          Set up your payment method once and never worry about renewals.
        </div>
      </div>

      {/* Current plan */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Current Plan</h3>
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
      </div>

      {/* Available upgrades */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Available Upgrades</h3>
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
                  <Button
                    fullWidth
                    loading={stripeLoading === plan.id}
                    onClick={() => handleStripeSubscribe(plan)}
                    className="gap-2"
                  >
                    <CreditCard size={15} /> Subscribe with Stripe
                  </Button>
                  <Button
                    fullWidth
                    variant="outline"
                    onClick={() => setUpgradeTarget(plan)}
                    className="gap-2"
                  >
                    Pay with Wallet <ArrowRight size={15} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Wallet Upgrade Modal */}
      <Modal
        isOpen={!!upgradeTarget}
        onClose={() => setUpgradeTarget(null)}
        title="Confirm Plan Upgrade"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUpgradeTarget(null)}>Cancel</Button>
            <Button
              loading={upgrading}
              disabled={!canAfford}
              onClick={handleUpgrade}
            >
              Upgrade
            </Button>
          </>
        }
      >
        {upgradeTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-medium">
              <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-[#0a1628]">{currentPlan.name}</span>
              <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />
              <span className="px-3 py-1.5 bg-[#1bb0ce]/10 text-[#1bb0ce] rounded-lg">{upgradeTarget.name}</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">New plan price</span>
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
                Insufficient balance. Top up your wallet first.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
