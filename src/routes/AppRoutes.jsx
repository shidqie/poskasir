import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { PublicRoute } from './PublicRoute';
import { ProtectedRoute } from './ProtectedRoute';

// Layouts
import { OwnerLayout } from '@/layouts/OwnerLayout';
import { CashierLayout } from '@/layouts/CashierLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';

// Owner Pages
import { OwnerDashboard } from '@/pages/owner/OwnerDashboard';
import { ProductListPage } from '@/pages/owner/products/ProductListPage';
import { ProductFormPage } from '@/pages/owner/products/ProductFormPage';
import { ProductDetailPage } from '@/pages/owner/products/ProductDetailPage';
import { CategoryListPage } from '@/pages/owner/categories/CategoryListPage';
import { UnitListPage } from '@/pages/owner/units/UnitListPage';
import { UnregisteredPriceListPage } from '@/pages/owner/unregistered/UnregisteredPriceListPage';
import { OwnerProductSubmissionsPage } from '@/pages/owner/submissions/OwnerProductSubmissionsPage';
import ReportPage from '@/pages/owner/ReportPage';
import ClosingListPage from '@/pages/owner/closing/ClosingListPage';
import StockAdjustmentPage from '@/pages/owner/stock/StockAdjustmentPage';
import UserListPage from '@/pages/owner/users/UserListPage';
import { OwnerCashMovementsPage } from '@/pages/owner/cash-movements/OwnerCashMovementsPage';
import { UIComponentShowcasePage } from '@/pages/owner/components/UIComponentShowcasePage';

// Cashier & Shared Pages
import { CashierDashboard } from '@/pages/cashier/CashierDashboard';
import { PriceListPage } from '@/pages/prices/PriceListPage';
import { POSPage } from '@/pages/pos/POSPage';

// Tahap 5-8 — Shared (Cashier & Owner)
import QuickCalculatorPage from '@/pages/calculator/QuickCalculatorPage';
import TransactionListPage from '@/pages/transactions/TransactionListPage';
import TransactionDetailPage from '@/pages/transactions/TransactionDetailPage';
import ReceiptPrintPage from '@/pages/transactions/ReceiptPrintPage';
import ClosingPage from '@/pages/closing/ClosingPage';

// Tahap 12 — Hutang Pelanggan
import DebtListPage from '@/pages/debts/DebtListPage';
import CustomerDebtDetailPage from '@/pages/debts/CustomerDebtDetailPage';

function IndexRedirect() {
  const { user, profile, role, isInitialized, isLoading } = useAuthStore();

  if (isLoading || !isInitialized) {
    return null;
  }

  if (user) {
    const effectiveRole =
      role ||
      profile?.role ||
      user.user_metadata?.role ||
      (user.email?.toLowerCase().includes('kasir') ? 'cashier' : 'owner');

    if (effectiveRole === 'owner') {
      return <Navigate to="/owner/dashboard" replace />;
    }
    if (effectiveRole === 'cashier') {
      return <Navigate to="/pos" replace />;
    }
  }

  return <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<IndexRedirect />} />

      {/* Public */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* ===== OWNER ROUTES ===== */}
      <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="dashboard" element={<OwnerDashboard />} />

          {/* Master Data */}
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="products/:id/edit" element={<ProductFormPage />} />
          <Route path="categories" element={<CategoryListPage />} />
          <Route path="units" element={<UnitListPage />} />
          <Route path="prices" element={<PriceListPage isOwnerView={true} />} />
          <Route path="product-submissions" element={<OwnerProductSubmissionsPage />} />
          <Route path="unregistered-products" element={<OwnerProductSubmissionsPage />} />

          {/* Tahap 4-8 */}
          <Route path="transactions" element={<TransactionListPage />} />
          <Route path="reports" element={<ReportPage />} />
          <Route path="closings" element={<ClosingListPage />} />
          <Route path="sessions" element={<ClosingListPage />} />
          <Route path="stock-adjustment" element={<StockAdjustmentPage />} />
          <Route path="pos" element={<POSPage />} />

          {/* Tahap 12 — Hutang Pelanggan */}
          <Route path="debts" element={<DebtListPage />} />
          <Route path="debts/:customerId" element={<CustomerDebtDetailPage />} />

          {/* Tahap 13 — Kas Keluar & Masuk */}
          <Route path="cash-movements" element={<OwnerCashMovementsPage />} />

          {/* Tahap 10 */}
          <Route path="users" element={<UserListPage />} />

          {/* Design System & UI Components */}
          <Route path="components" element={<UIComponentShowcasePage />} />
        </Route>
      </Route>

      {/* ===== CASHIER + SHARED ROUTES ===== */}
      <Route element={<ProtectedRoute allowedRoles={['cashier', 'owner']} />}>
        <Route path="/" element={<CashierLayout />}>
          <Route path="pos" element={<POSPage />} />
          <Route path="cashier/dashboard" element={<CashierDashboard />} />
          <Route path="price-list" element={<PriceListPage isOwnerView={false} />} />

          {/* Tahap 5 */}
          <Route path="quick-calculator" element={<QuickCalculatorPage />} />

          {/* Tahap 6 */}
          <Route path="transactions" element={<TransactionListPage />} />
          <Route path="transactions/:id" element={<TransactionDetailPage />} />

          {/* Tahap 12 — Hutang Pelanggan */}
          <Route path="debts" element={<DebtListPage />} />
          <Route path="debts/:customerId" element={<CustomerDebtDetailPage />} />

          {/* Tahap 8 */}
          <Route path="closing" element={<ClosingPage />} />
        </Route>
      </Route>

      {/* ===== STANDALONE ROUTES (no layout — print, etc.) ===== */}
      <Route element={<ProtectedRoute allowedRoles={['cashier', 'owner']} />}>
        <Route path="/transactions/:id" element={<TransactionDetailPage />} />
        <Route path="/transactions/:id/print" element={<ReceiptPrintPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
