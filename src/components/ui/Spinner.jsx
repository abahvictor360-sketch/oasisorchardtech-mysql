const sizeMap = {
  sm: 16,
  md: 24,
  lg: 40,
};

const colorMap = {
  primary: 'border-[#1bb0ce]',
  white: 'border-white',
  gray: 'border-gray-400',
};

export default function Spinner({ size = 'md', color = 'primary', className = '' }) {
  const px = sizeMap[size] || sizeMap.md;
  const borderColor = colorMap[color] || colorMap.primary;

  return (
    <span
      role="status"
      aria-label="Loading"
      className={[
        'inline-block rounded-full border-2 border-t-transparent animate-spin',
        borderColor,
        className,
      ].join(' ')}
      style={{ width: px, height: px }}
    />
  );
}
