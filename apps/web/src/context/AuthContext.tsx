import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  UserProfile,
  OrganizationItem,
  refreshApi,
  loginApi,
  registerApi,
  logoutApi,
  listOrganizationsApi,
  createOrganizationApi,
  setAccessToken,
} from "../lib/api-client";

interface AuthContextType {
  user: UserProfile | null;
  activeOrg: OrganizationItem | null;
  organizations: OrganizationItem[];
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (credentials: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setActiveOrg: (org: OrganizationItem | null) => void;
  createOrganization: (payload: {
    name: string;
    slug?: string;
  }) => Promise<OrganizationItem>;
  refreshOrganizations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_ORG_STORAGE_KEY = "hirepulse_active_org_id";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [activeOrg, setActiveOrgState] = useState<OrganizationItem | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshOrganizations = useCallback(async () => {
    try {
      const orgs = await listOrganizationsApi();
      setOrganizations(orgs);

      const savedOrgId = localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
      if (savedOrgId) {
        const found = orgs.find((o) => o.id === savedOrgId);
        if (found) {
          setActiveOrgState(found);
          return;
        }
      }

      if (orgs.length > 0) {
        setActiveOrgState(orgs[0]);
        localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, orgs[0].id);
      } else {
        setActiveOrgState(null);
      }
    } catch {
      setOrganizations([]);
      setActiveOrgState(null);
    }
  }, []);

  const setActiveOrg = useCallback((org: OrganizationItem | null) => {
    setActiveOrgState(org);
    if (org) {
      localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, org.id);
    } else {
      localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
    }
  }, []);

  // Try restoring session on boot
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        // Attempt silent refresh with existing HttpOnly refresh cookie
        const refreshData = await refreshApi();
        if (isMounted && refreshData?.user) {
          setUser(refreshData.user);
          await refreshOrganizations();
        }
      } catch {
        // Not authenticated or expired
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [refreshOrganizations]);

  const login = async (credentials: { email: string; password: string }) => {
    const data = await loginApi(credentials);
    setUser(data.user);
    await refreshOrganizations();
  };

  const register = async (credentials: {
    name: string;
    email: string;
    password: string;
  }) => {
    const data = await registerApi(credentials);
    setUser(data.user);
    await refreshOrganizations();
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
      setActiveOrgState(null);
      setOrganizations([]);
      localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
    }
  };

  const createOrganization = async (payload: {
    name: string;
    slug?: string;
  }) => {
    const org = await createOrganizationApi(payload);
    await refreshOrganizations();
    setActiveOrg(org);
    return org;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeOrg,
        organizations,
        isLoading,
        login,
        register,
        logout,
        setActiveOrg,
        createOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
