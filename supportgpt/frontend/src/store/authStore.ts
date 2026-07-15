import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { signOut, type User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user, loading: false }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    await signOut(auth);
    set({ user: null, isAuthenticated: false });
  },
}));
