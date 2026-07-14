import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartContext = createContext(null);

const SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 9.99;
const TAX_RATE = 0.08;

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
    const stored = localStorage.getItem('oasis_cart');
    return stored ? JSON.parse(stored).map(normalizeItem) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(loadCart);
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    localStorage.setItem('oasis_cart', JSON.stringify(cartItems));
  }, [cartItems]);

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
    const shipping = cartSubtotal >= SHIPPING_THRESHOLD || cartSubtotal === 0 ? 0 : SHIPPING_COST;
    const tax = cartSubtotal * TAX_RATE;

    let discount = 0;
    if (coupon) {
      if (coupon.type === 'percent') {
        discount = (cartSubtotal * coupon.value) / 100;
      } else if (coupon.type === 'fixed') {
        discount = coupon.value;
      }
    }

    const cartTotal = cartSubtotal + shipping + tax - discount;

    return { cartCount, cartSubtotal, shipping, tax, discount, cartTotal };
  }, [cartItems, coupon]);

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
