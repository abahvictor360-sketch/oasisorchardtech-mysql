import { forwardRef, useImperativeHandle } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { AlertCircle, CreditCard } from 'lucide-react';

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
}) {
  const tabs = [
    stripeEnabled  && { id: 'stripe',  label: 'Credit / Debit Card', icon: CreditCard },
    paypalEnabled  && { id: 'paypal',  label: 'PayPal',              icon: null },
  ].filter(Boolean);

  if (tabs.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-3">
        <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-1">Payments unavailable</p>
          <p className="text-sm text-amber-700 leading-relaxed">
            Online payment is not configured yet. Please contact us to complete your order.
          </p>
        </div>
      </div>
    );
  }

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

    </div>
  );
}
