import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ChevronRight, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';
import { payments as paymentsApi, orders as ordersApi } from '../../lib/api';
import CheckoutForm from '../../components/checkout/CheckoutForm';
import PaymentMethod from '../../components/checkout/PaymentMethod';
import OrderSummary from '../../components/checkout/OrderSummary';
import Spinner from '../../components/ui/Spinner';

function validateForm(data) {
  const errors = {};
  if (!data.fullName?.trim()) errors.fullName = 'Full name is required.';
  if (!data.email?.trim())    errors.email    = 'Email address is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email.';
  if (!data.phone?.trim())  errors.phone  = 'Phone number is required.';
  if (!data.street?.trim()) errors.street = 'Street address is required.';
  if (!data.city?.trim())   errors.city   = 'City is required.';
  if (!data.state?.trim())  errors.state  = 'Province is required.';
  if (!data.zip?.trim())    errors.zip    = 'Postal code is required.';
  return errors;
}

export default function CheckoutPage() {
  const navigate    = useNavigate();
  const { addToast } = useApp();
  const { cartItems, cartTotal, cartCount, clearCart } = useCart();

  // ── Form state ────────────────────────────────────────────────
  const [formData, setFormData] = useState({ country: 'Canada' });
  const [errors,   setErrors]   = useState({});

  // ── Payment config + state ────────────────────────────────────
  const [payConfig,      setPayConfig]      = useState(null);
  const [paymentMethod,  setPaymentMethod]  = useState('stripe');
  const [clientSecret,   setClientSecret]   = useState(null);
  const [intentId,       setIntentId]       = useState(null);
  const [placing,        setPlacing]        = useState(false);

  const stripeFormRef = useRef();

  // ── Load Stripe ───────────────────────────────────────────────
  const stripePromise = useMemo(() => {
    if (payConfig?.stripe_enabled && payConfig?.stripe_publishable_key) {
      return loadStripe(payConfig.stripe_publishable_key);
    }
    return null;
  }, [payConfig?.stripe_enabled, payConfig?.stripe_publishable_key]);

  // ── Fetch payment config on mount ─────────────────────────────
  useEffect(() => {
    paymentsApi.config().then(({ data }) => {
      if (data) {
        setPayConfig(data);
        setPaymentMethod(data.stripe_enabled ? 'stripe' : null);
      }
    });
  }, []);

  // ── Create Stripe PaymentIntent when stripe selected ──────────
  useEffect(() => {
    if (paymentMethod === 'stripe' && payConfig?.stripe_enabled && !clientSecret && cartTotal > 0) {
      paymentsApi.createStripeIntent({ total: cartTotal }).then(({ data, error }) => {
        if (error) { addToast('Could not load payment form. Please try again.', 'error'); return; }
        setClientSecret(data.clientSecret);
        setIntentId(data.intentId);
      });
    }
  }, [paymentMethod, payConfig, clientSecret, cartTotal]);

  // ── Redirect empty cart ───────────────────────────────────────
  useEffect(() => {
    if (cartItems.length === 0 && !placing) navigate('/cart', { replace: true });
  }, [cartItems, placing, navigate]);

  const handleMethodChange = (m) => setPaymentMethod(m);

  // ── Build order payload ───────────────────────────────────────
  const buildOrder = useCallback((extraFields = {}) => ({
    items:          cartItems.map(i => ({ id: i.id, name: i.name, image: i.image, price: i.price, quantity: i.quantity })),
    subtotal:       cartTotal,
    total:          cartTotal,
    payment_method: paymentMethod,
    shipping:       formData,
    ...extraFields,
  }), [cartItems, cartTotal, paymentMethod, formData]);

  // ── Place order (Stripe) ──────────────────────────────────────
  const handlePlaceOrder = async () => {
    const errs = validateForm(formData);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setPlacing(true);

    try {
      if (paymentMethod === 'stripe') {
        // 1. Save order to DB (pending payment)
        const { data: order, error: orderErr } = await ordersApi.create(
          buildOrder({ stripe_intent_id: intentId })
        );
        if (orderErr) throw new Error(orderErr.message);

        // 2. Confirm Stripe payment
        const ok = await stripeFormRef.current?.submit();
        if (!ok) { setPlacing(false); return; }

        // 3. Mark paid
        await ordersApi.update(order.id, { payment_status: 'paid', status: 'processing' });
        clearCart();
        navigate('/order-success', { state: { orderId: order.id, total: cartTotal, itemCount: cartCount } });
      }
    } catch (e) {
      addToast(e.message || 'Order failed. Please try again.', 'error');
      setPlacing(false);
    }
  };

  // ── Stripe Elements appearance ────────────────────────────────
  const stripeOptions = useMemo(() => ({
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: { colorPrimary: '#1bb0ce', borderRadius: '8px' },
    },
  }), [clientSecret]);

  const showPlaceOrderBtn = paymentMethod === 'stripe';

  // ── Render ────────────────────────────────────────────────────
  const paymentPanel = (
    <PaymentMethod
      method={paymentMethod}
      onMethodChange={handleMethodChange}
      stripeEnabled={!!payConfig?.stripe_enabled}
      clientSecretReady={!!clientSecret}
      stripeFormRef={stripeFormRef}
      onStripeError={(msg) => addToast(msg, 'error')}
      onStripeSuccess={() => {}}
    />
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <Link to="/" className="hover:text-[#1bb0ce] flex items-center gap-1 transition-colors"><Home size={14} />Home</Link>
            <ChevronRight size={14} />
            <Link to="/cart" className="hover:text-[#1bb0ce] transition-colors">Cart</Link>
            <ChevronRight size={14} />
            <span className="text-[#0a1628] font-medium">Checkout</span>
          </nav>
          <h1 className="font-display text-2xl text-[#0a1628] flex items-center gap-2" style={{ fontWeight: 560 }}>
            <Lock size={22} /> Checkout
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-[#0a1628] mb-5 flex items-center gap-2">
                <span className="font-mono-num w-6 h-6 rounded-full bg-[#1bb0ce] text-white text-xs font-bold flex items-center justify-center">1</span>
                Contact &amp; Shipping
              </h2>
              <CheckoutForm formData={formData} onFormChange={setFormData} errors={errors} />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-[#0a1628] mb-5 flex items-center gap-2">
                <span className="font-mono-num w-6 h-6 rounded-full bg-[#1bb0ce] text-white text-xs font-bold flex items-center justify-center">2</span>
                Payment Method
              </h2>

              {payConfig?.stripe_enabled && clientSecret ? (
                <Elements stripe={stripePromise} options={stripeOptions}>
                  {paymentPanel}
                </Elements>
              ) : paymentPanel}
            </div>
          </div>

          {/* RIGHT */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
            <div className="sticky top-6 flex flex-col gap-4">
              <OrderSummary />

              {showPlaceOrderBtn && (
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="w-full flex items-center justify-center gap-2 bg-[#1bb0ce] hover:bg-[#159bb8] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-base shadow-sm"
                >
                  {placing ? <><Spinner size="sm" color="white" />Processing…</> : <><Lock size={18} />Place Order</>}
                </button>
              )}

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                By placing your order you agree to our{' '}
                <a href="#" className="text-[#1bb0ce] hover:underline">Terms</a> and{' '}
                <a href="#" className="text-[#1bb0ce] hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
