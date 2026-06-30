export function Table({ children, striped = false, className = '' }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
      <table
        className={[
          'w-full text-sm text-left',
          striped ? '[&_tbody_tr:nth-child(even)]:bg-gray-50' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }) {
  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      {children}
    </thead>
  );
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}

export function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      onClick={onClick}
      className={[
        'transition-colors duration-100',
        onClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50/50',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({ children, className = '' }) {
  return (
    <th
      className={[
        'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap',
        className,
      ].join(' ')}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td
      className={[
        'px-4 py-3 text-gray-700 whitespace-nowrap',
        className,
      ].join(' ')}
    >
      {children}
    </td>
  );
}

export default Table;
