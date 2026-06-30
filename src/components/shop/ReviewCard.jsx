import { ThumbsUp } from 'lucide-react';
import StarRating from '../ui/StarRating';
import { getInitials, formatDate } from '../../utils/helpers';

export default function ReviewCard({ review }) {
  const { name, date, rating, comment, helpful = 0 } = review;
  const initials = getInitials(name);

  return (
    <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
      {/* Top row: avatar + name + date */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#1bb0ce] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0a1628] truncate">{name}</p>
          <p className="text-xs text-gray-400">{formatDate(date)}</p>
        </div>
      </div>

      {/* Star rating */}
      <StarRating rating={rating} />

      {/* Comment */}
      <p className="text-sm text-gray-700 leading-relaxed">{comment}</p>

      {/* Helpful button */}
      <button className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#1bb0ce] transition-colors duration-150 self-start">
        <ThumbsUp size={13} />
        Helpful? {helpful}
      </button>
    </div>
  );
}
