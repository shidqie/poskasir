import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/**
 * Route untuk halaman publik seperti Login.
 * Jika pengguna sudah terautentikasi, otomatis dialihkan ke dashboard sesuai role.
 */
export function PublicRoute() {
  const { user, profile, role, isLoading, isInitialized } = useAuthStore();

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" message="Memuat aplikasi..." />
      </div>
    );
  }

  // Jika sudah login dan profil valid, redirect ke dashboard rolenya
  if (user && profile) {
    if (role === 'owner') {
      return <Navigate to="/owner/dashboard" replace />;
    }
    if (role === 'cashier') {
      return <Navigate to="/cashier/dashboard" replace />;
    }
  }

  return <Outlet />;
}

export default PublicRoute;
