import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Package,
  MessageSquare,
  User,
  LogOut,
  Wifi,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Phone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Dashboard',  icon: LayoutDashboard, to: '/dashboard',          end: true },
  { label: 'Phone Calls', icon: Phone,            to: '/dashboard/voip' },
  { label: 'Wallet',     icon: Wallet,           to: '/dashboard/wallet' },
  { label: 'My Plan',    icon: CreditCard,       to: '/dashboard/plan' },
  { label: 'Purchases',  icon: Package,          to: '/dashboard/purchases' },
  { label: 'Invoices',   icon: FileText,         to: '/dashboard/invoices' },
  { label: 'Support',    icon: MessageSquare,    to: '/dashboard/support' },
  { label: 'Profile',    icon: User,             to: '/dashboard/profile' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={`flex items-center h-16 px-4 border-b border-white/10 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2" title="Go to homepage">
            <Wifi size={20} className="text-[#1bb0ce]" />
            <span className="text-[#1bb0ce] font-bold text-base">
              Oasis<span className="text-white"> Orchard</span>
            </span>
          </Link>
        )}
        {/* Collapse toggle (desktop) */}
        <button
          onClick={onToggle}
          className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors duration-150"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        {/* Mobile close */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, to, end }) => (
          <div key={to} className="relative group">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-[#1bb0ce] text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white',
                  collapsed ? 'justify-center' : '',
                ].join(' ')
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
            {/* Tooltip when collapsed */}
            {collapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-[#0a1628] text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg border border-white/10">
                {label}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 py-4 border-t border-white/10">
        <div className="relative group">
          <button
            onClick={handleLogout}
            className={[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-150',
              collapsed ? 'justify-center' : '',
            ].join(' ')}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
          {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-[#0a1628] text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg border border-white/10">
              Logout
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={[
          'hidden lg:flex flex-col bg-[#0a1628] border-r border-white/10 transition-all duration-300 flex-shrink-0',
          collapsed ? 'w-16' : 'w-60',
        ].join(' ')}
      >
        {SidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 w-60 bg-[#0a1628] z-50 flex flex-col lg:hidden shadow-2xl">
            {SidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
