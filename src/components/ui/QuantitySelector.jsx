import { Minus, Plus } from 'lucide-react';

export default function QuantitySelector({ value, min = 1, max, onChange }) {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (max === undefined || value < max) onChange(value + 1);
  };

  const handleInput = (e) => {
    const parsed = parseInt(e.target.value, 10);
    if (isNaN(parsed)) return;
    const clamped = Math.min(Math.max(parsed, min), max ?? parsed);
    onChange(clamped);
  };

  return (
    <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="px-2.5 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={handleInput}
        className="w-12 text-center text-sm font-medium text-[#0a1628] bg-white border-x border-gray-300 py-2 focus:outline-none focus:bg-gray-50"
        aria-label="Quantity"
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={max !== undefined && value >= max}
        className="px-2.5 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
