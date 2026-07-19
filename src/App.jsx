import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { VoipProvider } from './context/VoipContext';
import { ToastContainer } from './components/ui/Toast';
import { useAuth } from './context/AuthContext';

// Layout components (always needed — not lazy)
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';
import WhatsAppChat from './components/layout/WhatsAppChat';
import ScrollToTop from './components/layout/ScrollToTop';

// ── Lazy page imports ──────────────────────────────────────────
// Public pages
const Home        = lazy(() => import('./pages/public/Home'));
const About       = lazy(() => import('./pages/public/About'));
const Services    = lazy(() => import('./pages/public/Services'));
const Pricing     = lazy(() => import('./pages/public/Pricing'));
const Support     = lazy(() => import('./pages/public/Support'));
const Login       = lazy(() => import('./pages/public/Login'));
const Signup      = lazy(() => import('./pages/public/Signup'));
const Terms          = lazy(() => import('./pages/public/Terms'));
const Privacy        = lazy(() => import('./pages/public/Privacy'));
const CustomPage     = lazy(() => import('./pages/public/CustomPage'));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/public/ResetPassword'));
const VerifyEmail    = lazy(() => import('./pages/public/VerifyEmail'));

// Shop pages
const ShopPage     = lazy(() => import('./pages/shop/ShopPage'));
const ProductDetail= lazy(() => import('./pages/shop/ProductDetail'));
const CartPage     = lazy(() => import('./pages/shop/CartPage'));
const CheckoutPage = lazy(() => import('./pages/shop/CheckoutPage'));
const OrderSuccess = lazy(() => import('./pages/shop/OrderSuccess'));

// Dashboard pages
const DashHome     = lazy(() => import('./pages/dashboard/DashHome'));
const Wallet       = lazy(() => import('./pages/dashboard/Wallet'));
const Plan         = lazy(() => import('./pages/dashboard/Plan'));
const DashOrders   = lazy(() => import('./pages/dashboard/Orders'));
const DashPurchases= lazy(() => import('./pages/dashboard/Purchases'));
const DashInvoices = lazy(() => import('./pages/dashboard/Invoices'));
const DashSupport  = lazy(() => import('./pages/dashboard/Support'));
const Profile      = lazy(() => import('./pages/dashboard/Profile'));

// Admin pages
const AdminHome    = lazy(() => import('./pages/admin/AdminHome'));
const AdminUsers   = lazy(() => import('./pages/admin/Users'));
const AdminProducts= lazy(() => import('./pages/admin/Products'));
const AdminOrders  = lazy(() => import('./pages/admin/Orders'));
const AdminPlans   = lazy(() => import('./pages/admin/Plans'));
const AdminWallet  = lazy(() => import('./pages/admin/Wallet'));
const AdminSupport = lazy(() => import('./pages/admin/Support'));
const AdminContent = lazy(() => import('./pages/admin/Content'));
const AdminVoIP     = lazy(() => import('./pages/admin/VoIP'));
const AdminPayments      = lazy(() => import('./pages/admin/Payments'));
const AdminNotifications  = lazy(() => import('./pages/admin/Notifications'));
const AdminEmailTemplates = lazy(() => import('./pages/admin/EmailTemplates'));
const AdminCategories    = lazy(() => import('./pages/admin/Categories'));
const AdminAccount       = lazy(() => import('./pages/admin/Account'));

// User VoIP page
const UserVoIP     = lazy(() => import('./pages/dashboard/VoIP'));

// ── Loading fallback ───────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#1bb0ce] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Route guards ───────────────────────────────────────────────
function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppChat />
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────
function App() {
  return (
    <AppProvider>
      <SiteSettingsProvider>
      <VoipProvider>
      <BrowserRouter>
        <ScrollToTop />
        <ToastContainer />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/"        element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/about"   element={<PublicLayout><About /></PublicLayout>} />
            <Route path="/services"element={<PublicLayout><Services /></PublicLayout>} />
            <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
            <Route path="/support" element={<PublicLayout><Support /></PublicLayout>} />
            <Route path="/login"   element={<PublicLayout><Login /></PublicLayout>} />
            <Route path="/signup"  element={<PublicLayout><Signup /></PublicLayout>} />
            <Route path="/terms"            element={<PublicLayout><Terms /></PublicLayout>} />
            <Route path="/privacy"          element={<PublicLayout><Privacy /></PublicLayout>} />
            <Route path="/p/:slug"          element={<PublicLayout><CustomPage /></PublicLayout>} />
            <Route path="/forgot-password"  element={<PublicLayout><ForgotPassword /></PublicLayout>} />
            <Route path="/reset-password"   element={<PublicLayout><ResetPassword /></PublicLayout>} />
            <Route path="/verify-email"     element={<PublicLayout><VerifyEmail /></PublicLayout>} />

            {/* Shop routes */}
            <Route path="/shop"           element={<PublicLayout><ShopPage /></PublicLayout>} />
            <Route path="/shop/:productId"element={<PublicLayout><ProductDetail /></PublicLayout>} />
            <Route path="/cart"           element={<PublicLayout><CartPage /></PublicLayout>} />
            <Route path="/checkout"       element={<PublicLayout><CheckoutPage /></PublicLayout>} />
            <Route path="/order-success"  element={<PublicLayout><OrderSuccess /></PublicLayout>} />

            {/* Protected user dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index          element={<DashHome />} />
              <Route path="wallet"  element={<Wallet />} />
              <Route path="plan"    element={<Plan />} />
              <Route path="orders"  element={<DashOrders />} />
              <Route path="purchases" element={<DashPurchases />} />
              <Route path="invoices"  element={<DashInvoices />} />
              <Route path="support" element={<DashSupport />} />
              <Route path="profile" element={<Profile />} />
              <Route path="voip"    element={<UserVoIP />} />
            </Route>

            {/* Protected admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index            element={<AdminHome />} />
              <Route path="users"     element={<AdminUsers />} />
              <Route path="products"  element={<AdminProducts />} />
              <Route path="orders"    element={<AdminOrders />} />
              <Route path="plans"     element={<AdminPlans />} />
              <Route path="wallet"    element={<AdminWallet />} />
              <Route path="support"   element={<AdminSupport />} />
              <Route path="content"   element={<AdminContent />} />
              <Route path="voip"      element={<AdminVoIP />} />
              <Route path="payments"      element={<AdminPayments />} />
              <Route path="notifications"    element={<AdminNotifications />} />
              <Route path="email-templates" element={<AdminEmailTemplates />} />
              <Route path="categories"    element={<AdminCategories />} />
              <Route path="account"       element={<AdminAccount />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      </VoipProvider>
      </SiteSettingsProvider>
    </AppProvider>
  );
}

export default App;
