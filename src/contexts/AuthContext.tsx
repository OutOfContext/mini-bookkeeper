import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authenticateUser } from '../services/database';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved login on app start
    const checkSavedAuth = () => {
      try {
        // First check localStorage for "remember me" sessions
        const savedUser = localStorage.getItem('restaurant_user');
        const rememberMe = localStorage.getItem('restaurant_remember') === 'true';
        
        if (savedUser && rememberMe) {
          const userData = JSON.parse(savedUser);
          console.log('✅ Restored user from localStorage (remember me):', userData.username);
          setUser(userData);
          setIsLoading(false);
          return;
        }
        
        // Then check sessionStorage for current session
        const sessionUser = sessionStorage.getItem('restaurant_user');
        if (sessionUser) {
          const userData = JSON.parse(sessionUser);
          console.log('✅ Restored user from sessionStorage:', userData.username);
          setUser(userData);
          setIsLoading(false);
          return;
        }
        
        // No saved session found
        console.log('ℹ️ No saved session found');
        setUser(null);
        setIsLoading(false);
        
      } catch (error) {
        console.error('Error restoring saved auth:', error);
        // Clear corrupted data
        localStorage.removeItem('restaurant_user');
        localStorage.removeItem('restaurant_remember');
        sessionStorage.removeItem('restaurant_user');
        setUser(null);
        setIsLoading(false);
      }
    };

    checkSavedAuth();
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      const authenticatedUser = await authenticateUser(username, password);
      
      if (authenticatedUser) {
        console.log(`✅ User logged in: ${authenticatedUser.username}`);
        setUser(authenticatedUser);
        
        if (rememberMe) {
          localStorage.setItem('restaurant_user', JSON.stringify(authenticatedUser));
          localStorage.setItem('restaurant_remember', 'true');
          console.log('💾 Session saved to localStorage (remember me)');
        } else {
          // Store for current session only
          sessionStorage.setItem('restaurant_user', JSON.stringify(authenticatedUser));
          console.log('💾 Session saved to sessionStorage (current session)');
        }
        
        return true;
      } else {
        console.log('❌ Authentication failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('👋 User logged out');
    setUser(null);
    localStorage.removeItem('restaurant_user');
    localStorage.removeItem('restaurant_remember');
    sessionStorage.removeItem('restaurant_user');
  };

  const value = {
    user,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};