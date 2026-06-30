import { useState } from 'react';
import { CheckCircle, X, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CouponInput() {
  const { coupon, couponError, applyCoupon, removeCoupon } = useCart();
  const [inputValue, setInputValue] = useState('');
  const [localError, setLocalError] = useState('');

  const handleApply = () => {
    if (!inputValue.trim()) {
      setLocalError('Please enter a coupon code.');
      return;
    }
    setLocalError('');
    const ok = applyCoupon(inputValue);
    if (ok) {
      setInputValue('');
    }
  };

  const handleRemove = () => {
    removeCoupon();
    setInputValue('');
    setLocalError('');
  };

  const errorMsg = localError || couponError;

  // Coupon applied state
  if (coupon) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700">{coupon.code} applied</p>
            <p className="text-xs text-green-600">{coupon.value}% off your order</p>
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="p-1 rounded-lg text-green-400 hover:text-green-700 hover:bg-green-100 transition-colors duration-150"
          aria-label="Remove coupon"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-[#0a1628]">
        Have a coupon?
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setLocalError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder="Enter coupon code"
            className={[
              'w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 transition-colors duration-150',
              errorMsg
                ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                : 'border-gray-200 focus:border-[#1bb0ce] focus:ring-[#1bb0ce]',
            ].join(' ')}
          />
        </div>
        <button
          onClick={handleApply}
          className="px-4 py-2.5 bg-[#0a1628] hover:bg-[#1a2d4a] text-white text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap"
        >
          Apply
        </button>
      </div>
      {errorMsg && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}
    </div>
  );
}
