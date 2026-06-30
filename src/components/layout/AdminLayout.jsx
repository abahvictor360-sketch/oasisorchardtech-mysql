import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

function getPageTitle(pathname) {
  const map = {
    '/admin': 'Overview',
    '/admin/users': 'Users',
    '/admin/products': 'Products',
    '/admin/orders': 'Orders',
    '/admin/plans': 'Plans',
    '/admin/wallet': 'Wallet',
    '/admin/support': 'Support',
    '/admin/voip':    'Phone Calls',
    '/admin/content': 'Content',
  };
  return map[pathname] || 'Admin Panel';
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors duration-150"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-[#0a1628] leading-none">{pageTitle}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors duration-150">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Admin user avatar */}
            {user && (
              <div className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-[#1bb0ce] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-[#0a1628] leading-none">{user.name}</div>
                  <div className="text-xs text-[#1bb0ce] mt-0.5 font-medium">Admin</div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
