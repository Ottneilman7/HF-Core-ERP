import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { subscribeToAuthState } from "../services/authService";
import { getMyMembership } from "../services/membershipService";
import type { MembershipRole, ModuleKey } from "../models/Membership";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  role: MembershipRole | null;
  modules: ModuleKey[];
  canCreateProducts: boolean;
  roleLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  role: null,
  modules: [],
  canCreateProducts: false,
  roleLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<MembershipRole | null>(null);
  const [modules, setModules] = useState<ModuleKey[]>([]);
  const [canCreateProducts, setCanCreateProducts] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setModules([]);
      setCanCreateProducts(false);
      setRoleLoading(false);
      return;
    }
    setRoleLoading(true);
    getMyMembership(user.uid)
      .then((membership) => {
        setRole(membership?.role ?? null);
        setModules(membership?.modules ?? []);
        setCanCreateProducts(membership?.canCreateProducts ?? false);
      })
      .catch((err) => {
        console.error("No se pudo leer la membresía del usuario:", err);
        setRole(null);
        setModules([]);
        setCanCreateProducts(false);
      })
      .finally(() => setRoleLoading(false));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, role, modules, canCreateProducts, roleLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}