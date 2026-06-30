export default function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={[
        'bg-white rounded-xl shadow-sm border border-gray-100',
        'transition-shadow duration-200',
        hover ? 'hover:shadow-lg' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
