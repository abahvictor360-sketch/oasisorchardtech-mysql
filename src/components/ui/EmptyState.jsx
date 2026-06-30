import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'Nothing here yet',
  description = '',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-5">
        <Icon size={40} className="text-gray-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-[#0a1628] mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 text-sm max-w-sm leading-relaxed mb-5">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
