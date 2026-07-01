import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { auth, onAuthStateChanged, User, getIdToken } from "../lib/firebase";
import { api } from "../lib/api";

interface AuthContextType {
  user: User | null;
  userProfile: any;
  loading: boolean;
  signOut: () => Promise<void>;
  syncUser: () => Promise<any>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!auth.currentUser) return;
    try {
      const res = await api.user.getProfile();
      console.log("fetchProfile res:", res);
      if (res.success) {
        const profile = res.user || res.data || res.profile;
        setUserProfile(profile || null);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile();
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOutUser = async () => {
    await auth.signOut();
    setUser(null);
    setUserProfile(null);
  };

  const syncUser = async () => {
    if (!user) throw new Error("No user logged in");

    const idToken = await getIdToken(user);
    const res = await api.post(
      "/v1/user/sync",
      {},
      {
        Authorization: `Bearer ${idToken}`,
      },
    );
    await fetchProfile();
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signOut: signOutUser,
        syncUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
