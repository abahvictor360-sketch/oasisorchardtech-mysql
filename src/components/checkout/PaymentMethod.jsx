import { forwardRef, useImperativeHandle } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { Wallet, Clock, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

// ── Stripe card form (must be inside <Elements>) ──────────────
export const StripeForm = forwardRef(function StripeForm({ onSuccess, onError }, ref) {
  const stripe   = useStripe();
  const elements = useElements();

  useImperativeHandle(ref, () => ({
    async submit() {
      if (!stripe || !elements) { onError('Stripe not ready'); return false; }
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.origin + '/order-success' },
        redirect: 'if_required',
      });
      if (error) { onError(error.message); return false; }
      if (paymentIntent?.status === 'succeeded') { onSuccess(paymentIntent.id); return true; }
      return false;
    },
  }));

  return (
    <div className="pt-2">
      <PaymentElement options={{ layout: 'tabs' }} />
    </div>
  );
});

// ── PayPal section ────────────────────────────────────────────
function PayPalSection({ onCreateOrder, onApprove, onError }) {
  return (
    <div className="pt-2">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 text-sm text-blue-700">
        Click the PayPal button below. You will be redirected to PayPal to complete your payment securely.
      </div>
      <PayPalButtons
        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
        createOrder={onCreateOrder}
        onApprove={onApprove}
        onError={(e) => onError(e.message || 'PayPal error')}
      />
    </div>
  );
}

// ── Wallet section ────────────────────────────────────────────
function WalletSection({ walletBalance, orderTotal }) {
  const ok = walletBalance >= orderTotal;
  return (
    <div className="pt-2">
      <div className={['rounded-xl p-5 border-2', ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'].join(' ')}>
        <div className="flex items-center gap-3 mb-3">
          <Wallet size={22} className={ok ? 'text-green-500' : 'text-red-500'} />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Your Balance</p>
            <p className={`text-2xl font-bold ${ok ? 'text-green-700' : 'text-red-600'}`}>
              {formatCurrency(walletBalance)}
            </p>
          </div>
        </div>
        {ok ? (
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle size={16} />
            <span>Sufficient balance to complete this order.</span>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-red-600 text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>
              Insufficient balance. You need{' '}
              <strong>{formatCurrency(orderTotal - walletBalance)}</strong> more.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main PaymentMethod component ──────────────────────────────
export default function PaymentMethod({
  method,
  onMethodChange,
  stripeEnabled,
  paypalEnabled,
  clientSecretReady,
  stripeFormRef,
  onStripeError,
  onStripeSuccess,
  onPayPalCreate,
  onPayPalApprove,
  onPayPalError,
  walletBalance = 0,
  orderTotal    = 0,
}) {
  const tabs = [
    stripeEnabled  && { id: 'stripe',  label: 'Credit / Debit Card', icon: CreditCard },
    paypalEnabled  && { id: 'paypal',  label: 'PayPal',              icon: null },
    { id: 'wallet', label: 'Wallet Balance', icon: Wallet },
    { id: 'later',  label: 'Pay Later',      icon: Clock  },
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      {/* Method tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onMethodChange(id)}
            className={[
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-150',
              method === id
                ? 'border-[#1bb0ce] bg-[#e0f7fb] text-[#1bb0ce]'
                : 'border-gray-200 text-gray-500 hover:border-gray-300',
            ].join(' ')}
          >
            {id === 'paypal' ? (
              <span className="font-extrabold tracking-tight">
                <span style={{ color: '#003087' }}>Pay</span>
                <span style={{ color: '#009cde' }}>Pal</span>
              </span>
            ) : (
              <>
                {Icon && <Icon size={16} />}
                <span>{label}</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Stripe */}
      {method === 'stripe' && (
        clientSecretReady
          ? <StripeForm ref={stripeFormRef} onSuccess={onStripeSuccess} onError={onStripeError} />
          : <div className="pt-4 flex items-center gap-2 text-gray-400 text-sm">
              <div className="w-4 h-4 border-2 border-[#1bb0ce] border-t-transparent rounded-full animate-spin" />
              Loading secure payment form…
            </div>
      )}

      {/* PayPal */}
      {method === 'paypal' && (
        <PayPalSection
          onCreateOrder={onPayPalCreate}
          onApprove={onPayPalApprove}
          onError={onPayPalError}
        />
      )}

      {/* Wallet */}
      {method === 'wallet' && (
        <WalletSection walletBalance={walletBalance} orderTotal={orderTotal} />
      )}

      {/* Pay Later */}
      {method === 'later' && (
        <div className="pt-2">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-3">
            <Clock size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-1">Invoice on Delivery</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                You will be invoiced within 24 hours. Payment due within 7 business days.
                Available for verified business accounts only.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
