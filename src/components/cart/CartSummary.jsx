import { Link, useNavigate } from 'react-router-dom';
import { Lock, Shield, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/helpers';

export default function CartSummary() {
  const {
    cartSubtotal,
    discount,
    shipping,
    tax,
    cartTotal,
    coupon,
    cartItems,
    taxRatePct,
    freeShippingThreshold,
  } = useCart();
  const navigate = useNavigate();

  const isCartEmpty = cartItems.length === 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 sticky top-6">
      <h2 className="font-display text-base text-[#0a1628]" style={{ fontWeight: 560 }}>Order Summary</h2>

      {/* Line items */}
      <div className="flex flex-col gap-2.5 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span className="font-mono-num font-medium text-[#0a1628]">{formatCurrency(cartSubtotal)}</span>
        </div>

        {discount > 0 && coupon && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({coupon.code})</span>
            <span className="font-mono-num font-medium">-{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span className={`font-mono-num font-medium ${shipping === 0 ? 'text-green-600' : 'text-[#0a1628]'}`}>
            {shipping === 0 ? (cartSubtotal === 0 ? formatCurrency(0) : 'FREE') : formatCurrency(shipping)}
          </span>
        </div>

        {cartSubtotal > 0 && shipping > 0 && freeShippingThreshold > cartSubtotal && (
          <p className="text-xs text-gray-400">
            Add {formatCurrency(freeShippingThreshold - cartSubtotal)} more for free shipping
          </p>
        )}

        {tax > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Tax ({taxRatePct}%)</span>
            <span className="font-mono-num font-medium text-[#0a1628]">{formatCurrency(tax)}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="font-bold text-[#0a1628]">Total</span>
        <span className="font-mono-num text-xl font-bold text-[#0a1628]">{formatCurrency(cartTotal)}</span>
      </div>

      {/* Checkout button */}
      <button
        onClick={() => navigate('/checkout')}
        disabled={isCartEmpty}
        className="w-full flex items-center justify-center gap-2 bg-[#1bb0ce] hover:bg-[#159bb8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-150"
      >
        <Lock size={16} />
        Proceed to Checkout
      </button>

      {/* Continue shopping */}
      <Link
        to="/shop"
        className="text-center text-sm text-[#1bb0ce] hover:text-[#159bb8] font-medium transition-colors duration-150"
      >
        ← Continue Shopping
      </Link>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Lock size={12} />
          <span>Secure Checkout</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Shield size={12} />
          <span>SSL Protected</span>
        </div>
      </div>
    </div>
  );
}
