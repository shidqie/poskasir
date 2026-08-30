import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

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
        .single();

      if (error) {
        console.error('[AuthStore] Gagal mengambil profile:', error.message);
        set({ profile: null, role: null });
        return null;
      }

      set({
        profile: data,
        role: data?.role ?? null,
      });
      return data;
    } catch (err) {
      console.error('[AuthStore] Error fetchProfile:', err);
      set({ profile: null, role: null });
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (session?.user) {
        set({ session, user: session.user });
        await get().fetchProfile(session.user.id);
      } else {
        set({ session: null, user: null, profile: null, role: null });
      }

      // 2. Pasang listener perubahan auth state (misal login di tab lain atau token refresh)
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_OUT' || !newSession) {
          set({
            session: null,
            user: null,
            profile: null,
            role: null,
            isLoading: false,
          });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          set({
            session: newSession,
            user: newSession.user,
          });
          await get().fetchProfile(newSession.user.id);
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
      const profile = await get().fetchProfile(data.user.id);

      if (!profile) {
        throw new Error('Data profil pengguna tidak ditemukan di sistem. Hubungi administrator.');
      }

      if (profile.status === false) {
        await supabase.auth.signOut();
        throw new Error('Akun Anda sedang dinonaktifkan. Hubungi pemilik toko.');
      }

      set({
        session: data.session,
        user: data.user,
        profile,
        role: profile.role,
        isLoading: false,
        error: null,
      });

      return { success: true, role: profile.role };
    } catch (err) {
      let errorMessage = err.message || 'Terjadi kesalahan saat masuk.';
      
      // Terjemahan pesan error umum Supabase ke Bahasa Indonesia
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Email atau kata sandi yang Anda masukkan salah.';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Email belum dikonfirmasi.';
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
