import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (phone: string, password: string, name?: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('ridemax_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single();

      if (error || !data) {
        return { success: false, error: 'Invalid phone number or password' };
      }

      const isValidPassword = await bcrypt.compare(password, data.password_hash);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid phone number or password' };
      }

      const userData: User = {
        id: data.id,
        phone: data.phone,
        name: data.name || undefined,
        email: data.email || undefined
      };

      setUser(userData);
      localStorage.setItem('ridemax_user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const signup = async (phone: string, password: string, name?: string, email?: string) => {
    try {
      // Check if phone already exists
      const { data: existingUser } = await supabase
        .from('customers')
        .select('phone')
        .eq('phone', phone)
        .single();

      if (existingUser) {
        return { success: false, error: 'Phone number already registered' };
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const { data, error } = await supabase
        .from('customers')
        .insert({
          phone,
          password_hash: passwordHash,
          name: name || null,
          email: email || null
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: 'Registration failed. Please try again.' };
      }

      const userData: User = {
        id: data.id,
        phone: data.phone,
        name: data.name || undefined,
        email: data.email || undefined
      };

      setUser(userData);
      localStorage.setItem('ridemax_user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const adminLogin = async (username: string, password: string) => {
    // Simple admin credentials (in production, this should be more secure)
    if (username === 'admin' && password === 'admin123') {
      const adminUser: User = {
        id: 'admin',
        phone: 'admin',
        name: 'Administrator',
        isAdmin: true
      };
      setUser(adminUser);
      localStorage.setItem('ridemax_user', JSON.stringify(adminUser));
      return { success: true };
    }
    return { success: false, error: 'Invalid admin credentials' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ridemax_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};