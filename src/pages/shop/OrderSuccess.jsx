import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, ShoppingBag, Clock, MapPin, ArrowRight } from 'lucide-react';
import { formatCurrency, generateOrderId } from '../../utils/helpers';

function getEstimatedDelivery() {
  const date = new Date();
  date.setDate(date.getDate() + 5);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function OrderSuccess() {
  const location = useLocation();
  const { orderId, total, itemCount } = location.state || {};

  const displayOrderId = orderId || generateOrderId();
  const displayTotal = total ?? 0;
  const displayItemCount = itemCount ?? 1;
  const deliveryDate = getEstimatedDelivery();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 sm:p-10 flex flex-col items-center gap-6 text-center">
        {/* Animated checkmark */}
        <div
          className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
          style={{
            animation: 'checkPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          }}
        >
          <CheckCircle
            size={52}
            className="text-green-500"
            strokeWidth={2}
            style={{
              animation: 'fadeIn 0.4s ease 0.2s both',
            }}
          />
        </div>

        {/* CSS keyframes via style tag */}
        <style>{`
          @keyframes checkPop {
            0% { transform: scale(0); opacity: 0; }
            80% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.7); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {/* Heading */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0a1628]">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Thank you for your purchase! We've received your order and it's being processed.
          </p>
        </div>

        {/* Order number */}
        <div className="bg-[#e0f7fb] rounded-xl px-6 py-4 w-full">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Order Number</p>
          <p className="text-2xl font-bold text-[#1bb0ce]">{displayOrderId}</p>
          <p className="text-xs text-gray-400 mt-1">Keep this number for your records</p>
        </div>

        {/* Order details */}
        <div className="grid grid-cols-2 gap-4 w-full text-sm">
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center gap-2">
            <Package size={20} className="text-[#1bb0ce]" />
            <p className="text-xs text-gray-500 font-medium">Items Ordered</p>
            <p className="font-bold text-[#0a1628]">
              {displayItemCount} {displayItemCount === 1 ? 'item' : 'items'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center gap-2">
            <ShoppingBag size={20} className="text-[#1bb0ce]" />
            <p className="text-xs text-gray-500 font-medium">Total Paid</p>
            <p className="font-bold text-[#0a1628]">{formatCurrency(displayTotal)}</p>
          </div>
        </div>

        {/* Estimated delivery */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-4 w-full flex items-start gap-3">
          <Clock size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-left">
            <p className="text-sm font-semibold text-amber-800">Estimated Delivery</p>
            <p className="text-xs text-amber-700 mt-0.5">3–5 business days</p>
            <p className="text-xs text-amber-600 mt-0.5 font-medium">{deliveryDate}</p>
          </div>
        </div>

        {/* Shipping note */}
        <div className="flex items-start gap-2.5 text-left w-full">
          <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            A shipping confirmation with tracking information will be emailed to you once your
            order ships. You can also track your order from the dashboard.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <Link
            to="/dashboard/orders"
            className="flex-1 flex items-center justify-center gap-2 border-2 border-[#1bb0ce] text-[#1bb0ce] hover:bg-[#1bb0ce] hover:text-white font-semibold py-3 px-4 rounded-xl transition-all duration-150"
          >
            Track Order
          </Link>
          <Link
            to="/shop"
            className="flex-1 flex items-center justify-center gap-2 bg-[#1bb0ce] hover:bg-[#159bb8] text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-150"
          >
            Continue Shopping
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Thank you message */}
        <p className="text-xs text-gray-400 border-t border-gray-100 pt-5 w-full">
          Thank you for choosing{' '}
          <span className="font-semibold text-[#1bb0ce]">Oasis Orchard Technologies</span>.
          We're committed to delivering quality VoIP solutions to your door.
        </p>
      </div>
    </div>
  );
}
