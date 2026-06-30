import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Heart, Menu, X, User, ChevronDown,
  Wifi, Phone, LogOut, LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { getInitials } from '../../utils/helpers';

const activeLinkClass   = 'text-[#1bb0ce]';
const inactiveLinkClass = 'text-gray-300 hover:text-[#1bb0ce]';
const linkBase          = 'text-sm font-medium transition-colors duration-150';

function LogoMark({ brand }) {
  if (brand.logoType === 'image' && brand.logoUrl) {
    return (
      <img
        src={brand.logoUrl}
        alt={brand.siteName}
        className="h-8 w-auto object-contain"
        onError={e => { e.target.style.display = 'none'; }}
      />
    );
  }
  const Icon = brand.logoIcon === 'phone' ? Phone : Wifi;
  const parts = brand.siteName.split(' ');
  const first = parts[0] || 'Oasis';
  const rest  = parts.slice(1).join(' ');
  return (
    <>
      <Icon size={24} className="text-[#1bb0ce]" />
      <span className="text-[#1bb0ce] font-bold text-lg leading-none">
        {first}<span className="text-white">{rest ? ` ${rest}` : ''}</span>
      </span>
    </>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate    = useNavigate();

  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount }    = useCart();
  const { wishlistCount } = useWishlist();
  const { brand, nav }   = useSiteSettings();

  const handleLogout = () => { logout(); setDropdownOpen(false); navigate('/'); };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-[#0a1628] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <LogoMark brand={brand} />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {nav.map(link => (
              <NavLink key={link.to + link.label} to={link.to} end={link.to === '/'}
                className={({ isActive }) => `${linkBase} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Wishlist */}
            <Link to="/wishlist" className="relative p-2 text-gray-300 hover:text-[#1bb0ce] transition-colors" aria-label="Wishlist">
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#1bb0ce] text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-300 hover:text-[#1bb0ce] transition-colors" aria-label="Cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated && user ? (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg text-gray-300 hover:bg-white/10 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-[#1bb0ce] flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(user.name)}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                    <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><LayoutDashboard size={15} />Dashboard</Link>
                    <Link to="/dashboard/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><User size={15} />Profile</Link>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50"><LogOut size={15} />Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#1bb0ce] hover:bg-[#159ab5] text-white text-sm font-medium rounded-lg transition-colors">
                Login
              </Link>
            )}

            {/* Hamburger */}
            <button onClick={() => setMobileOpen(v => !v)} className="md:hidden p-2 text-gray-300 hover:text-white" aria-label="Toggle menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0d1f38] border-t border-white/10 px-4 pb-4 pt-2 space-y-1">
          {nav.map(link => (
            <NavLink key={link.to + link.label} to={link.to} end={link.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#1bb0ce]/20 text-[#1bb0ce]' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
              {link.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-white/10">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-[#1bb0ce] flex items-center justify-center text-white text-xs font-bold">{getInitials(user.name)}</div>
                  <span className="text-sm text-white font-medium">{user.name}</span>
                </div>
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/5"><LayoutDashboard size={15} />Dashboard</Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-white/5"><LogOut size={15} />Logout</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium bg-[#1bb0ce] text-white text-center">Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
