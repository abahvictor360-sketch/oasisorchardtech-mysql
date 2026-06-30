import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Package, MessageSquare, User, FileText } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard', end: true },
  { label: 'Wallet', icon: Wallet, to: '/dashboard/wallet' },
  { label: 'Purchases', icon: Package, to: '/dashboard/purchases' },
  { label: 'Invoices', icon: FileText, to: '/dashboard/invoices' },
  { label: 'Support', icon: MessageSquare, to: '/dashboard/support' },
  { label: 'Profile', icon: User, to: '/dashboard/profile' },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a1628] border-t border-white/10 lg:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ label, icon: Icon, to, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-[10px] font-medium transition-colors duration-150',
                isActive ? 'text-[#1bb0ce]' : 'text-gray-400 hover:text-white',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  className={isActive ? 'text-[#1bb0ce]' : 'text-gray-400'}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
