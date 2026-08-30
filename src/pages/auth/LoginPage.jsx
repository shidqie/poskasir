import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import {
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('owner');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { login, signUp, isLoading, error: authError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setFormError('Harap masukkan alamat email.');
      return;
    }
    if (!password) {
      setFormError('Harap masukkan kata sandi.');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setFormError('Harap masukkan nama lengkap.');
        return;
      }
      const result = await signUp({
        email,
        password,
        fullName,
        role,
      });

      if (result.success) {
        setSuccessMessage('Akun berhasil didaftarkan! Mengalihkan...');
        setTimeout(() => {
          if (result.role === 'owner') {
            navigate('/owner/dashboard', { replace: true });
          } else {
            navigate('/cashier/dashboard', { replace: true });
          }
        }, 800);
      } else {
        setFormError(result.error || 'Gagal mendaftar.');
      }
    } else {
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
    }
  };

  // Quick 1-click register & login for Demo accounts
  const handleQuickRegister = async (demoRole) => {
    setFormError('');
    setSuccessMessage('');
    const demoEmail = demoRole === 'owner' ? 'pemilik@toko.com' : 'kasir@toko.com';
    const demoPass = 'password123';
    const demoName = demoRole === 'owner' ? 'Haji Sulaeman (Pemilik)' : 'Siti Rahma (Kasir 1)';

    setEmail(demoEmail);
    setPassword(demoPass);

    // Coba login dulu
    let result = await login(demoEmail, demoPass);
    if (result.success) {
      if (result.role === 'owner') navigate('/owner/dashboard', { replace: true });
      else navigate('/cashier/dashboard', { replace: true });
      return;
    }

    // Jika belum ada, buat langsung via SignUp
    result = await signUp({
      email: demoEmail,
      password: demoPass,
      fullName: demoName,
      role: demoRole,
    });

    if (result.success) {
      setSuccessMessage(`Akun ${demoRole === 'owner' ? 'Pemilik' : 'Kasir'} berhasil dibuat! Mengalihkan...`);
      setTimeout(() => {
        if (demoRole === 'owner') navigate('/owner/dashboard', { replace: true });
        else navigate('/cashier/dashboard', { replace: true });
      }, 800);
    } else {
      setFormError(result.error);
    }
  };

  const errorMessage = formError || authError;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600 text-white shadow-xl shadow-red-600/30 mb-3">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Kasir Sembako
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Sistem Kasir & Manajemen Toko Sembako
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setFormError('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setFormError('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white py-7 px-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-8 border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Notification */}
            {errorMessage && (
              <div
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Perhatian</p>
                  <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Success Notification */}
            {successMessage && (
              <div
                className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5 text-xs"
                role="status"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="font-semibold">{successMessage}</p>
              </div>
            )}

            {/* Nama Lengkap (Khusus Mode Register) */}
            {mode === 'register' && (
              <Input
                id="fullName"
                name="fullName"
                type="text"
                label="Nama Lengkap"
                placeholder="Contoh: Haji Sulaeman / Siti Rahma"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setFormError('');
                }}
                icon={User}
                disabled={isLoading}
              />
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
              placeholder="Minimal 6 karakter"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
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

            {/* Pilihan Role (Khusus Mode Register) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Peran Akun (Role)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      role === 'owner'
                        ? 'border-red-600 bg-red-50 text-red-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Pemilik Toko
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('cashier')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      role === 'cashier'
                        ? 'border-red-600 bg-red-50 text-red-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    Kasir
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full text-sm font-bold py-3 bg-red-600 hover:bg-red-700 text-white"
                isLoading={isLoading}
              >
                {mode === 'register' ? 'Daftarkan Akun & Masuk' : 'Masuk ke Aplikasi'}
              </Button>
            </div>
          </form>

          {/* 1-Click Quick Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              1-Klik Masuk / Setup Akun Demo
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRegister('owner')}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-red-300 hover:bg-red-50/50 text-left transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 group-hover:text-red-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Akun Pemilik</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate font-mono">
                  pemilik@toko.com
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRegister('cashier')}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-red-300 hover:bg-red-50/50 text-left transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 group-hover:text-red-600">
                  <UserCheck className="w-3.5 h-3.5 text-red-600" />
                  <span>Akun Kasir</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate font-mono">
                  kasir@toko.com
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-center text-xs text-slate-500 mt-5">
          &copy; {new Date().getFullYear()} Kasir Toko Sembako. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
