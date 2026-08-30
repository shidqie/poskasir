import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Store, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const { login, isLoading, error: authError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim()) {
      setFormError('Harap masukkan alamat email.');
      return;
    }
    if (!password) {
      setFormError('Harap masukkan kata sandi.');
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      if (result.role === 'owner') {
        navigate('/owner/dashboard', { replace: true });
      } else if (result.role === 'cashier') {
        navigate('/cashier/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      setFormError(result.error || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
    }
  };

  const errorMessage = formError || authError;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Container Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/25 mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kasir Sembako
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Silakan masuk untuk mengakses sistem kasir & toko
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Notification */}
            {errorMessage && (
              <div
                className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm animate-shake"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Gagal Masuk</p>
                  <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Input Email */}
            <Input
              id="email"
              name="email"
              type="email"
              label="Alamat Email"
              placeholder="nama@toko.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFormError('');
              }}
              icon={Mail}
              disabled={isLoading}
            />

            {/* Input Password */}
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Kata Sandi"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormError('');
              }}
              icon={Lock}
              disabled={isLoading}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full text-base font-semibold py-3"
                isLoading={isLoading}
              >
                Masuk ke Aplikasi
              </Button>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          &copy; {new Date().getFullYear()} Kasir Toko Sembako. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
