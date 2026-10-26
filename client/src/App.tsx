import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DemoBadge } from './components/DemoBadge';
import { Toast } from './components/Toast';

// Pages
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { PartnerDashboardPage } from './pages/PartnerDashboardPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { PartnersPage } from './pages/PartnersPage';
import { ReferralNetworkPage } from './pages/ReferralNetworkPage';
import { ProductsPage } from './pages/ProductsPage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { CommissionSimulationPage } from './pages/CommissionSimulationPage';
import { FinancialManagementPage } from './pages/FinancialManagementPage';
import { CouponManagementPage } from './pages/CouponManagementPage';
import { PurchaseReminderPage } from './pages/PurchaseReminderPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

const MainLayout: React.FC = () => {
  const { currentUser, token, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Fetch cart count for user
  const fetchCartCount = async () => {
    if (!token || currentUser?.role !== 'USER') {
      setCartCount(0);
      return;
    }
    try {
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCartCount(data.totalCount || 0);
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, [token, currentUser]);

  // When role changes, if current page is owner-only, revert to dashboard
  useEffect(() => {
    if (currentUser?.role === 'USER') {
      if (['partners', 'financials', 'settings', 'audit'].includes(currentPage)) {
        setCurrentPage('dashboard');
      }
    } else if (currentUser?.role === 'PARTNER') {
      if (['partners', 'financials', 'settings', 'audit'].includes(currentPage)) {
        setCurrentPage('dashboard');
      }
    }
  }, [currentUser]);

  const handleOrderCompleted = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentPage('orders');
    fetchCartCount();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Initializing Apex Consumer Network Prototype...
          </p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        if (currentUser?.role === 'OWNER') return <OwnerDashboardPage />;
        if (currentUser?.role === 'PARTNER') return <PartnerDashboardPage onNavigate={setCurrentPage} />;
        return <UserDashboardPage onNavigate={setCurrentPage} />;
      case 'partners':
        return <PartnersPage />;
      case 'referrals':
        return <ReferralNetworkPage />;
      case 'products':
        return <ProductsPage onProductAddedToCart={fetchCartCount} />;
      case 'cart':
        return (
          <CartPage
            onOrderCompleted={handleOrderCompleted}
            onNavigateToCatalog={() => setCurrentPage('products')}
          />
        );
      case 'orders':
        return <OrdersPage initialSelectedOrderId={selectedOrderId} />;
      case 'commissions':
        return <CommissionSimulationPage />;
      case 'financials':
        return <FinancialManagementPage />;
      case 'coupons':
        return <CouponManagementPage />;
      case 'reminders':
        return <PurchaseReminderPage />;
      case 'settings':
        return <SettingsPage />;
      case 'audit':
        return <AuditLogsPage />;
      default:
        return <OwnerDashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      <DemoBadge />

      <div className="flex flex-1">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPage={currentPage}
          onNavigate={(page) => {
            setSelectedOrderId(null);
            setCurrentPage(page);
          }}
        />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Navbar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            cartCount={cartCount}
            onOpenCart={() => setCurrentPage('cart')}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
            {renderPage()}
          </main>
        </div>
      </div>

      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
