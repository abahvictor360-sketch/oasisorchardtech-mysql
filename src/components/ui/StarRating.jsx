import { Star } from 'lucide-react';
import { useState } from 'react';

export default function StarRating({
  rating = 0,
  reviews,
  showCount = false,
  interactive = false,
  onRate,
}) {
  const [hovered, setHovered] = useState(null);

  const displayRating = interactive && hovered !== null ? hovered : rating;

  const getStarFill = (index) => {
    const val = displayRating - index;
    if (val >= 1) return 'full';
    if (val >= 0.5) return 'half';
    return 'empty';
  };

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((index) => {
          const fill = getStarFill(index);
          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate && onRate(index + 1)}
              onMouseEnter={() => interactive && setHovered(index + 1)}
              onMouseLeave={() => interactive && setHovered(null)}
              className={[
                'relative focus:outline-none',
                interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default',
              ].join(' ')}
              aria-label={`Rate ${index + 1} star${index !== 0 ? 's' : ''}`}
            >
              {/* Background (empty) star */}
              <Star
                size={16}
                className="text-gray-300"
                fill="currentColor"
              />
              {/* Filled overlay */}
              {fill !== 'empty' && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: fill === 'half' ? '50%' : '100%' }}
                >
                  <Star size={16} className="text-yellow-400" fill="currentColor" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showCount && typeof reviews === 'number' && (
        <span className="text-sm text-gray-500 ml-1">
          ({reviews.toLocaleString()} {reviews === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
