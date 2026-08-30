import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/**
 * Route Guard untuk membatasi akses hanya bagi pengguna yang terautentikasi
 * dan memiliki peran (role) yang diizinkan.
 */
export function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();
  const { user, profile, role, isLoading, isInitialized } = useAuthStore();

  // Jika auth masih dalam proses inisialisasi / checking session
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" message="Memeriksa sesi login..." />
      </div>
    );
  }

  // Jika belum login, redirect ke halaman login
  if (!user || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika ada pembatasan role tertentu
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect pengguna ke dashboard yang sesuai dengan rolenya
    if (role === 'owner') {
      return <Navigate to="/owner/dashboard" replace />;
    }
    if (role === 'cashier') {
      return <Navigate to="/cashier/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
