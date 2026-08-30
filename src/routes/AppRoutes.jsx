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

// Cashier & Shared Pages
import { CashierDashboard } from '@/pages/cashier/CashierDashboard';
import { PriceListPage } from '@/pages/prices/PriceListPage';
import { POSPage } from '@/pages/pos/POSPage';

function IndexRedirect() {
  const { user, profile, role, isInitialized, isLoading } = useAuthStore();

  if (isLoading || !isInitialized) {
    return null;
  }

  if (user && profile) {
    if (role === 'owner') {
      return <Navigate to="/owner/dashboard" replace />;
    }
    if (role === 'cashier') {
      return <Navigate to="/pos" replace />;
    }
  }

  return <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Route Root ('/') */}
      <Route path="/" element={<IndexRedirect />} />

      {/* Public Routes (Login) */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected Routes untuk Role OWNER (Pemilik) */}
      <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="dashboard" element={<OwnerDashboard />} />

          {/* Master Barang */}
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="products/:id/edit" element={<ProductFormPage />} />

          {/* Kategori & Satuan */}
          <Route path="categories" element={<CategoryListPage />} />
          <Route path="units" element={<UnitListPage />} />

          {/* POS Kasir untuk Pemilik */}
          <Route path="pos" element={<POSPage />} />

          {/* Daftar Harga & Barang Belum Terdaftar */}
          <Route path="prices" element={<PriceListPage isOwnerView={true} />} />
          <Route path="unregistered-products" element={<UnregisteredPriceListPage />} />
        </Route>
      </Route>

      {/* Protected Routes untuk Role CASHIER (Kasir) & OWNER untuk route /pos */}
      <Route element={<ProtectedRoute allowedRoles={['cashier', 'owner']} />}>
        {/* Khusus jika Cashier membuka root */}
        <Route path="/" element={<CashierLayout />}>
          <Route path="pos" element={<POSPage />} />
          <Route path="cashier/dashboard" element={<CashierDashboard />} />
          <Route path="price-list" element={<PriceListPage isOwnerView={false} />} />
        </Route>
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
