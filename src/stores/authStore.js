import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useCartStore } from './cartStore';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  role: null,
  session: null,
  isLoading: true,
  isInitialized: false,
  error: null,

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
    });
  },

  setProfile: (profile) => {
    set({
      profile,
      role: profile?.role ?? null,
    });
  },

  /**
   * Mengambil data profile dari tabel 'profiles' berdasarkan user id
   */
  fetchProfile: async (userId) => {
    if (!userId) {
      set({ profile: null, role: null });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[AuthStore] Gagal mengambil profile:', error.message);
      }

      if (data) {
        set({
          profile: data,
          role: data?.role ?? null,
        });
        return data;
      }
      return null;
    } catch (err) {
      console.warn('[AuthStore] Error fetchProfile:', err);
      return null;
    }
  },

  /**
   * Inisialisasi status auth saat aplikasi pertama kali dimuat
   */
  initializeAuth: async () => {
    set({ isLoading: true, error: null });

    try {
      // 1. Ambil session aktif saat ini
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (session?.user) {
        set({ session, user: session.user });
        const profile = await get().fetchProfile(session.user.id);
        if (!profile) {
          const meta = session.user.user_metadata || {};
          const isEmailKasir = session.user.email?.toLowerCase().includes('kasir');
          const fallbackRole = meta.role || (isEmailKasir ? 'cashier' : 'owner');
          const fallbackProfile = {
            id: session.user.id,
            full_name: meta.full_name || session.user.email?.split('@')[0] || 'Pengguna',
            role: fallbackRole,
            status: true,
          };
          set({ profile: fallbackProfile, role: fallbackRole });
          supabase.from('profiles').upsert(fallbackProfile).catch(() => {});
        }
      } else {
        set({ session: null, user: null, profile: null, role: null });
      }

      // 2. Pasang listener perubahan auth state
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_OUT' || !newSession) {
          set({
            session: null,
            user: null,
            profile: null,
            role: null,
            isLoading: false,
          });
        } else if (
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED'
        ) {
          set({
            session: newSession,
            user: newSession.user,
          });
          const profile = await get().fetchProfile(newSession.user.id);
          if (!profile && newSession.user) {
            const meta = newSession.user.user_metadata || {};
            const isEmailKasir = newSession.user.email?.toLowerCase().includes('kasir');
            const fallbackRole = meta.role || (isEmailKasir ? 'cashier' : 'owner');
            const fallbackProfile = {
              id: newSession.user.id,
              full_name: meta.full_name || newSession.user.email?.split('@')[0] || 'Pengguna',
              role: fallbackRole,
              status: true,
            };
            set({ profile: fallbackProfile, role: fallbackRole });
            supabase.from('profiles').upsert(fallbackProfile).catch(() => {});
          }
          set({ isLoading: false });
        }
      });
    } catch (err) {
      console.error('[AuthStore] Gagal inisialisasi auth:', err);
      set({ error: err.message, session: null, user: null, profile: null, role: null });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  /**
   * Proses pendaftaran akun baru
   */
  signUp: async ({ email, password, fullName, role = 'owner' }) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Pendaftaran gagal. Silakan coba kembali.');

      // Buat data di public.profiles
      const profileData = {
        id: data.user.id,
        full_name: fullName.trim() || 'Pengguna Baru',
        role: role || 'owner',
        status: true,
      };

      try {
        await supabase.from('profiles').upsert(profileData);
      } catch (e) {
        console.warn('[AuthStore] Profile upsert skipped:', e);
      }

      set({
        session: data.session,
        user: data.user,
        profile: profileData,
        role: role || 'owner',
        isLoading: false,
        error: null,
      });

      return { success: true, role: role || 'owner' };
    } catch (err) {
      let errorMessage = err.message || 'Gagal mendaftarkan akun.';
      if (errorMessage.includes('User already registered')) {
        errorMessage = 'Email sudah terdaftar. Silakan gunakan menu Masuk.';
      } else if (
        errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.toLowerCase().includes('over_email_send_rate_limit')
      ) {
        errorMessage =
          'Batas kirim email Supabase tercapai. Buka Supabase Dashboard > Authentication > Providers > Email, lalu matikan opsi "Confirm email" agar pendaftaran akun langsung aktif tanpa verifikasi email.';
      }
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Proses login dengan Email & Password
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Pengguna tidak ditemukan.');
      }

      // Ambil data profil setelah login berhasil
      let profile = await get().fetchProfile(data.user.id);

      // Jika profil belum ada di public.profiles, buat otomatis dari user_metadata
      if (!profile) {
        const metadata = data.user.user_metadata || {};
        const isEmailKasir = data.user.email?.toLowerCase().includes('kasir');
        const fallbackRole = metadata.role || (isEmailKasir ? 'cashier' : 'owner');
        const fallbackName =
          metadata.full_name ||
          (data.user.email ? data.user.email.split('@')[0] : 'Pengguna');

        profile = {
          id: data.user.id,
          full_name: fallbackName,
          role: fallbackRole,
          status: true,
        };

        try {
          await supabase.from('profiles').upsert(profile);
        } catch (e) {
          console.warn('[AuthStore] Upsert profile skipped:', e);
        }
      }

      if (profile && profile.status === false) {
        await supabase.auth.signOut();
        throw new Error('Akun Anda sedang dinonaktifkan. Hubungi pemilik toko.');
      }

      const effectiveRole = profile?.role || data.user.user_metadata?.role || (data.user.email?.toLowerCase().includes('kasir') ? 'cashier' : 'owner');

      set({
        session: data.session,
        user: data.user,
        profile,
        role: effectiveRole,
        isLoading: false,
        error: null,
      });

      return { success: true, role: effectiveRole };
    } catch (err) {
      let errorMessage = err.message || 'Terjadi kesalahan saat masuk.';

      // Terjemahan pesan error umum Supabase ke Bahasa Indonesia
      if (
        errorMessage.includes('Invalid login credentials') ||
        errorMessage.includes('invalid_grant')
      ) {
        errorMessage =
          'Email atau kata sandi yang Anda masukkan salah. Jika akun belum terdaftar, Anda dapat mendaftar melalui tab "Daftar Akun" di bawah.';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage =
          'Email belum dikonfirmasi. Harap nonaktifkan "Confirm email" di Supabase Dashboard (Auth -> Providers -> Email) atau klik link konfirmasi di email Anda.';
      }

      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Proses logout
   */
  logout: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      // Reset cart store saat logout
      useCartStore.getState().clearCart();
    } catch (err) {
      console.error('[AuthStore] Gagal keluar:', err);
    } finally {
      set({
        user: null,
        profile: null,
        role: null,
        session: null,
        isLoading: false,
        error: null,
      });
    }
  },
}));
