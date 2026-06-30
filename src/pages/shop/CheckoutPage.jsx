import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ChevronRight, Lock } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { generateOrderId } from '../../utils/helpers';
import CheckoutForm from '../../components/checkout/CheckoutForm';
import PaymentMethod from '../../components/checkout/PaymentMethod';
import OrderSummary from '../../components/checkout/OrderSummary';
import Spinner from '../../components/ui/Spinner';

function validateForm(data) {
  const errors = {};
  if (!data.fullName?.trim()) errors.fullName = 'Full name is required.';
  if (!data.email?.trim()) errors.email = 'Email address is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email address.';
  if (!data.phone?.trim()) errors.phone = 'Phone number is required.';
  if (!data.street?.trim()) errors.street = 'Street address is required.';
  if (!data.city?.trim()) errors.city = 'City is required.';
  if (!data.state?.trim()) errors.state = 'Province is required.';
  if (!data.zip?.trim()) errors.zip = 'Postal code is required.';
  return errors;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, cartCount, clearCart } = useCart();

  const [formData, setFormData] = useState({ country: 'Canada' });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [sameBilling, setSameBilling] = useState(true);
  const [saveInfo, setSaveInfo] = useState(false);
  const [placing, setPlacing] = useState(false);

  // Redirect to cart if empty
  useEffect(() => {
    if (cartItems.length === 0 && !placing) {
      navigate('/cart', { replace: true });
    }
  }, [cartItems, navigate, placing]);

  const handlePlaceOrder = () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorEl = document.querySelector('[data-error]');
      if (firstErrorEl) firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});
    setPlacing(true);

    setTimeout(() => {
      const orderId = generateOrderId();
      clearCart();
      setPlacing(false);
      navigate('/order-success', {
        state: { orderId, total: cartTotal, itemCount: cartCount },
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <Link to="/" className="hover:text-[#1bb0ce] flex items-center gap-1 transition-colors duration-150">
              <Home size={14} />
              Home
            </Link>
            <ChevronRight size={14} />
            <Link to="/cart" className="hover:text-[#1bb0ce] transition-colors duration-150">
              Cart
            </Link>
            <ChevronRight size={14} />
            <span className="text-[#0a1628] font-medium">Checkout</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#0a1628] flex items-center gap-2">
            <Lock size={22} />
            Checkout
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT: Forms */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Section 1: Contact Information */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-[#0a1628] mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1bb0ce] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  1
                </span>
                Contact Information
              </h2>
              <CheckoutForm
                formData={formData}
                onFormChange={setFormData}
                errors={errors}
              />
            </div>

            {/* Section 2: Payment Method */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-[#0a1628] mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1bb0ce] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  2
                </span>
                Payment Method
              </h2>
              <PaymentMethod
                selectedMethod={paymentMethod}
                onMethodChange={setPaymentMethod}
                walletBalance={85.50}
                orderTotal={cartTotal}
              />
            </div>

            {/* Options */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={sameBilling}
                  onChange={(e) => setSameBilling(e.target.checked)}
                  className="w-4 h-4 accent-[#1bb0ce] cursor-pointer"
                />
                <span className="text-sm text-gray-700 group-hover:text-[#0a1628] transition-colors duration-150">
                  Billing address is the same as shipping address
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={saveInfo}
                  onChange={(e) => setSaveInfo(e.target.checked)}
                  className="w-4 h-4 accent-[#1bb0ce] cursor-pointer"
                />
                <span className="text-sm text-gray-700 group-hover:text-[#0a1628] transition-colors duration-150">
                  Save this information for next time
                </span>
              </label>
            </div>
          </div>

          {/* RIGHT: Order summary + Place Order */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
            <div className="sticky top-6 flex flex-col gap-4">
              <OrderSummary />

              {/* Place order button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full flex items-center justify-center gap-2 bg-[#1bb0ce] hover:bg-[#159bb8] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors duration-150 text-base shadow-sm"
              >
                {placing ? (
                  <>
                    <Spinner size="sm" color="white" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Place Order
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                By placing your order, you agree to our{' '}
                <a href="#" className="text-[#1bb0ce] hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-[#1bb0ce] hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
