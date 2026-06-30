import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary: 'bg-[#1bb0ce] hover:bg-[#159ab5] text-white',
  secondary: 'bg-[#0a1628] hover:bg-[#0d1f38] text-white',
  outline: 'border-2 border-[#1bb0ce] text-[#1bb0ce] hover:bg-[#1bb0ce] hover:text-white',
  ghost: 'text-[#1bb0ce] hover:bg-[#1bb0ce]/10',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  white: 'bg-white text-[#0a1628] hover:bg-blue-50 shadow-sm',
  'white-outline': 'border-2 border-white text-white bg-transparent hover:bg-white hover:text-[#0a1628]',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
        'transition-all duration-200 cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/50 focus:ring-offset-2',
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
    </button>
  );
}
