import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useGoogleLogin } from "@react-oauth/google";

interface User {
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored auth state on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("google_token");
    const storedUser = localStorage.getItem("google_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("google_token");
        localStorage.removeItem("google_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Store the access token
        setToken(tokenResponse.access_token);
        localStorage.setItem("google_token", tokenResponse.access_token);

        // Fetch user info
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        if (userInfoResponse.ok) {
          const userData = await userInfoResponse.json();
          const userInfo: User = {
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
          };
          setUser(userInfo);
          localStorage.setItem("google_user", JSON.stringify(userInfo));
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    },
    onError: () => {
      console.error("Login failed");
    },
    scope: "https://www.googleapis.com/auth/youtube.force-ssl",
  });

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("google_token");
    localStorage.removeItem("google_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
