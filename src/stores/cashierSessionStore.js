import { create } from 'zustand';
import { cashierSessionService } from '@/services/cashierSessionService';

export const useCashierSessionStore = create((set, get) => ({
  activeSession: null,
  isLoading: false,
  error: null,

  fetchActiveSession: async (cashierId = null) => {
    set({ isLoading: true, error: null });
    try {
      const session = await cashierSessionService.getActiveSession(cashierId);
      set({ activeSession: session, isLoading: false });
      return session;
    } catch (err) {
      set({ error: err.message, isLoading: false, activeSession: null });
      return null;
    }
  },

  openSession: async ({ opening_cash, notes }) => {
    set({ isLoading: true, error: null });
    try {
      const session = await cashierSessionService.openSession({ opening_cash, notes });
      set({ activeSession: session, isLoading: false });
      return session;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  closeSession: async ({ actual_cash, notes }) => {
    const { activeSession } = get();
    if (!activeSession) throw new Error('Tidak ada sesi kasir aktif.');

    set({ isLoading: true, error: null });
    try {
      const res = await cashierSessionService.closeSession({
        session_id: activeSession.id,
        actual_cash,
        notes,
      });
      set({ activeSession: null, isLoading: false });
      return res;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  clearSession: () => set({ activeSession: null, error: null }),
}));

export default useCashierSessionStore;
