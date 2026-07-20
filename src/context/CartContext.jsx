import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { storage } from '../utils/storage';
import { payments as paymentsApi } from '../lib/api';

const CartContext = createContext(null);

// Fallbacks — the live values come from Admin → Payments → General
const SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 9.99;
const TAX_RATE = 0; // fraction, e.g. 0.08 = 8%

const COUPONS = {
  'OASIS10': { type: 'percent', value: 10, label: '10% off' }
};

// Coerce numeric fields — items saved while the API returned DECIMAL
// strings ("140.00") would otherwise crash .toFixed() on the cart page.
function normalizeItem(item) {
  return {
    ...item,
    price: parseFloat(item.price) || 0,
    quantity: parseInt(item.quantity) || 1,
    stock: parseInt(item.stock) || 0,
  };
}

function loadCart() {
  if (typeof window === 'undefined') return []; // SSR/prerender — no localStorage
  try {
    const stored = storage.get('oasis_cart');
    return stored ? JSON.parse(stored).map(normalizeItem) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(loadCart);
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [rates, setRates] = useState({
    shippingFee:   SHIPPING_COST,
    freeThreshold: SHIPPING_THRESHOLD,
    taxRate:       TAX_RATE,
  });

  useEffect(() => {
    storage.set('oasis_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Load admin-configured shipping fee / free-shipping threshold / tax rate
  useEffect(() => {
    paymentsApi.config().then(({ data }) => {
      if (!data) return;
      setRates({
        shippingFee:   data.shipping_fee            != null ? parseFloat(data.shipping_fee)            || 0 : SHIPPING_COST,
        freeThreshold: data.free_shipping_threshold != null ? parseFloat(data.free_shipping_threshold) || 0 : SHIPPING_THRESHOLD,
        taxRate:       data.tax_rate                != null ? (parseFloat(data.tax_rate) || 0) / 100       : TAX_RATE,
      });
    }).catch(() => {});
  }, []);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, normalizeItem({ ...product, quantity })];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCoupon(null);
    setCouponError('');
  };

  const applyCoupon = (code) => {
    const trimmed = code.trim().toUpperCase();
    const found = COUPONS[trimmed];
    if (!found) {
      setCouponError('Invalid coupon code.');
      return false;
    }
    setCoupon({ code: trimmed, ...found });
    setCouponError('');
    return true;
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError('');
  };

  const computed = useMemo(() => {
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const freeShipping = rates.freeThreshold > 0 && cartSubtotal >= rates.freeThreshold;
    const shipping = freeShipping || cartSubtotal === 0 ? 0 : rates.shippingFee;
    const tax = cartSubtotal * rates.taxRate;

    let discount = 0;
    if (coupon) {
      if (coupon.type === 'percent') {
        discount = (cartSubtotal * coupon.value) / 100;
      } else if (coupon.type === 'fixed') {
        discount = coupon.value;
      }
    }

    const cartTotal = cartSubtotal + shipping + tax - discount;
    // Display helpers for the summaries
    const taxRatePct = Math.round(rates.taxRate * 10000) / 100;
    const freeShippingThreshold = rates.freeThreshold;

    return { cartCount, cartSubtotal, shipping, tax, discount, cartTotal, taxRatePct, freeShippingThreshold };
  }, [cartItems, coupon, rates]);

  return (
    <CartContext.Provider value={{
      cartItems,
      coupon,
      couponError,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      applyCoupon,
      removeCoupon,
      ...computed
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
