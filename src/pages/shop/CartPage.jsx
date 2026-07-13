import { Link } from 'react-router-dom';
import { ShoppingCart, Home, ChevronRight, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import CouponInput from '../../components/cart/CouponInput';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';

export default function CartPage() {
  const { cartItems, cartCount, removeFromCart, updateQuantity, clearCart } = useCart();

  const isEmpty = cartItems.length === 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <Link to="/" className="hover:text-[#1bb0ce] flex items-center gap-1 transition-colors duration-150">
              <Home size={14} />
              Home
            </Link>
            <ChevronRight size={14} />
            <Link to="/shop" className="hover:text-[#1bb0ce] transition-colors duration-150">
              Shop
            </Link>
            <ChevronRight size={14} />
            <span className="text-[#0a1628] font-medium">Shopping Cart</span>
          </nav>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="font-display text-2xl text-[#0a1628] flex items-center gap-2" style={{ fontWeight: 560 }}>
              <ShoppingCart size={24} />
              Shopping Cart
              {cartCount > 0 && (
                <span className="text-sm font-semibold bg-[#1bb0ce] text-white px-2.5 py-0.5 rounded-full">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </span>
              )}
            </h1>
            {!isEmpty && (
              <button
                onClick={clearCart}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium transition-colors duration-150"
              >
                <Trash2 size={15} />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isEmpty ? (
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Looks like you haven't added any products yet. Browse our wireless phones and find the perfect fit for your needs."
            action={
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-[#1bb0ce] hover:bg-[#159bb8] text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-150"
              >
                <ShoppingCart size={18} />
                Browse Shop
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* LEFT: Cart items */}
            <div className="flex-1 min-w-0">
              {/* Desktop table */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hidden sm:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Subtotal
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Remove
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        onRemove={removeFromCart}
                        onUpdateQty={updateQuantity}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="flex flex-col gap-3 sm:hidden">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/shop/${item.id}`}
                          className="font-semibold text-[#0a1628] hover:text-[#1bb0ce] text-sm transition-colors duration-150 block truncate"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>
                        <p className="font-mono-num text-sm font-bold text-[#0a1628] mt-1">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="font-mono-num text-xs text-gray-400">${item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold transition-colors duration-150"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-[#0a1628]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.stock || 99)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold transition-colors duration-150"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon input */}
              <div className="mt-5 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <CouponInput />
              </div>

              {/* Continue shopping */}
              <div className="mt-4">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 text-sm text-[#1bb0ce] hover:text-[#159bb8] font-medium transition-colors duration-150"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* RIGHT: Cart summary */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <CartSummary />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
