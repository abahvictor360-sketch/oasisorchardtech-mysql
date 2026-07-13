import { Trash2 } from 'lucide-react';
import QuantitySelector from '../ui/QuantitySelector';
import { formatCurrency } from '../../utils/helpers';

export default function CartItem({ item, onRemove, onUpdateQty }) {
  const subtotal = item.price * item.quantity;

  return (
    <tr className="border-b border-gray-100 last:border-0">
      {/* Product */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-contain p-1"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0a1628] truncate">{item.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>
          </div>
        </div>
      </td>

      {/* Unit price */}
      <td className="px-4 py-4">
        <span className="font-mono-num text-sm text-gray-600">{formatCurrency(item.price)}</span>
      </td>

      {/* Quantity selector */}
      <td className="px-4 py-4">
        <QuantitySelector
          value={item.quantity}
          min={1}
          max={item.stock || 99}
          onChange={(qty) => onUpdateQty(item.id, qty)}
        />
      </td>

      {/* Subtotal */}
      <td className="px-4 py-4">
        <span className="font-mono-num text-sm font-bold text-[#0a1628]">{formatCurrency(subtotal)}</span>
      </td>

      {/* Remove button */}
      <td className="px-4 py-4 text-center">
        <button
          onClick={() => onRemove(item.id)}
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-150"
          aria-label={`Remove ${item.name} from cart`}
        >
          <Trash2 size={16} className="mx-auto" />
        </button>
      </td>
    </tr>
  );
}
