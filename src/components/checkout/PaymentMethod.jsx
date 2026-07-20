import { forwardRef, useImperativeHandle } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
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

// ── Main PaymentMethod component (Stripe only) ────────────────
export default function PaymentMethod({
  method,
  onMethodChange,
  stripeEnabled,
  clientSecretReady,
  stripeFormRef,
  onStripeError,
  onStripeSuccess,
}) {
  if (!stripeEnabled) {
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
      {/* Method tab */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onMethodChange('stripe')}
          className={[
            'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-150',
            method === 'stripe'
              ? 'border-[#1bb0ce] bg-[#e0f7fb] text-[#1bb0ce]'
              : 'border-gray-200 text-gray-500 hover:border-gray-300',
          ].join(' ')}
        >
          <CreditCard size={16} />
          <span>Credit / Debit Card</span>
        </button>
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
    </div>
  );
}
