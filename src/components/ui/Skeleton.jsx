export function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={['rounded-md bg-gray-200 animate-pulse', className].filter(Boolean).join(' ')}
      style={{
        width: width ?? undefined,
        height: height ?? undefined,
      }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Image area */}
      <Skeleton className="w-full h-48" />
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-4 w-3/4" />
        {/* Subtitle */}
        <Skeleton className="h-3 w-1/2" />
        {/* Price */}
        <Skeleton className="h-5 w-1/3" />
        {/* Button */}
        <Skeleton className="h-9 w-full mt-2" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default Skeleton;
