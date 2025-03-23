import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

// Define context types
interface AuthContextType {
  user: any;
  signOut: () => Promise<void>;
}

// Create AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check user session and refresh it
    const fetchUser = async () => {
      try {
        // First try to get current user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          // console.error("Error getting user:", userError);
          setUser(null);
          return;
        }

        if (currentUser) {
          // If we have a user, try to refresh the session
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error("Error refreshing session:", refreshError);
            // If refresh fails, use the current user
            setUser(currentUser);
            return;
          }
          
          // If refresh succeeds, use the refreshed session user
          setUser(session?.user || currentUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in fetchUser:", error);
        setUser(null);
      }
    };

    fetchUser();

    // Listen for authentication changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.user_metadata);
        
        if (session?.user) {
          // When auth state changes, try to refresh the session
          const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
          
          if (error) {
            console.error("Error refreshing session on auth change:", error);
            setUser(session.user);
            return;
          }
          
          setUser(refreshedSession?.user || session.user);
        } else {
          setUser(null);
        }
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
