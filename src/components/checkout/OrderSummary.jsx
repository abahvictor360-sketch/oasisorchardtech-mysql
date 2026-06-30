import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/helpers';

export default function OrderSummary() {
  const {
    cartItems,
    cartSubtotal,
    discount,
    shipping,
    tax,
    cartTotal,
    coupon,
  } = useCart();

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <h3 className="text-base font-bold text-[#0a1628]">Order Summary</h3>

      {/* Item list */}
      <div className="flex flex-col gap-3">
        {cartItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Your cart is empty.</p>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {/* Thumbnail */}
              <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
              {/* Name + qty */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0a1628] truncate">{item.name}</p>
                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
              </div>
              {/* Price */}
              <span className="text-sm font-semibold text-[#0a1628] flex-shrink-0">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Totals */}
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(cartSubtotal)}</span>
        </div>
        {discount > 0 && coupon && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({coupon.code})</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span className={shipping === 0 && cartSubtotal > 0 ? 'text-green-600' : ''}>
            {shipping === 0 ? (cartSubtotal === 0 ? formatCurrency(0) : 'FREE') : formatCurrency(shipping)}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax (8%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Grand total */}
      <div className="flex justify-between items-center">
        <span className="font-bold text-[#0a1628]">Total</span>
        <span className="text-lg font-bold text-[#0a1628]">{formatCurrency(cartTotal)}</span>
      </div>
    </div>
  );
}
