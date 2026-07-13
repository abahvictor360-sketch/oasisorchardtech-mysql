import { formatCurrency, calculateDiscount } from '../../utils/helpers';

const sizeClasses = {
  sm: { current: 'text-base font-semibold', original: 'text-xs', savings: 'text-xs' },
  md: { current: 'text-xl font-bold', original: 'text-sm', savings: 'text-sm' },
  lg: { current: 'text-3xl font-bold', original: 'text-base', savings: 'text-base' },
};

export default function PriceDisplay({
  price,
  originalPrice,
  size = 'md',
  showSavings = false,
}) {
  const sizes = sizeClasses[size] || sizeClasses.md;
  const hasDiscount = originalPrice && originalPrice > price;
  const { savings, percent } = hasDiscount ? calculateDiscount(originalPrice, price) : {};

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-mono-num text-[#0a1628] ${sizes.current}`}>
        {formatCurrency(price)}
      </span>

      {hasDiscount && (
        <span className={`font-mono-num text-gray-400 line-through ${sizes.original}`}>
          {formatCurrency(originalPrice)}
        </span>
      )}

      {hasDiscount && showSavings && (
        <span className={`text-green-600 font-medium ${sizes.savings}`}>
          You save {formatCurrency(savings)} ({percent}% off)
        </span>
      )}
    </div>
  );
}
