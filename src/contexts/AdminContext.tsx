@@ .. @@
 import React, { createContext, useContext, useState, useEffect } from 'react';

-interface User {
+interface Admin {
   id: string;
-  phone: string;
-  name?: string;
-  email?: string;
-  isAdmin?: boolean;
+  username: string;
+  name: string;
 }

-interface AuthContextType {
-  user: User | null;
+interface PricingStructure {
+  outstation: {
+    '4-seater': Record<string, number>;
+    '6-seater': Record<string, number>;
+  };
+  mumbaiLocal: {
+    baseRate: number;
+    airportRate: number;
+  };
+}
+
+interface AdminContextType {
+  admin: Admin | null;
   isLoading: boolean;
-  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
-  signup: (phone: string, password: string, name?: string, email?: string) => Promise<{ success: boolean; error?: string }>;
-  adminLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
+  pricing: PricingStructure;
+  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
+  updatePricing: (newPricing: PricingStructure) => void;
   logout: () => void;
 }

-const AuthContext = createContext<AuthContextType | undefined>(undefined);
+const AdminContext = createContext<AdminContextType | undefined>(undefined);

-export const useAuth = () => {
-  const context = useContext(AuthContext);
+export const useAdmin = () => {
+  const context = useContext(AdminContext);
   if (!context) {
-    throw new Error('useAuth must be used within an AuthProvider');
+    throw new Error('useAdmin must be used within an AdminProvider');
   }
   return context;
 };

-export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
-  const [user, setUser] = useState<User | null>(null);
+export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
+  const [admin, setAdmin] = useState<Admin | null>(null);
   const [isLoading, setIsLoading] = useState(true);
+  const [pricing, setPricing] = useState<PricingStructure>({
+    outstation: {
+      '4-seater': {
+        'Mumbai-Pune': 2500,
+        'Mumbai-Surat': 3500,
+        'Mumbai-Nashik': 2800,
+        'Pune-Surat': 4000,
+        'Pune-Nashik': 2200,
+        'Surat-Nashik': 3200
+      },
+      '6-seater': {
+        'Mumbai-Pune': 3500,
+        'Mumbai-Surat': 4500,
+        'Mumbai-Nashik': 3800,
+        'Pune-Surat': 5000,
+        'Pune-Nashik': 3200,
+        'Surat-Nashik': 4200
+      }
+    },
+    mumbaiLocal: {
+      baseRate: 15,
+      airportRate: 18
+    }
+  });

   useEffect(() => {
     // Check for existing session
-    const savedUser = localStorage.getItem('ridemax_user');
-    if (savedUser) {
-      setUser(JSON.parse(savedUser));
+    const savedAdmin = localStorage.getItem('ridemax_admin');
+    const savedPricing = localStorage.getItem('ridemax_pricing');
+    
+    if (savedAdmin) {
+      setAdmin(JSON.parse(savedAdmin));
+    }
+    if (savedPricing) {
+      setPricing(JSON.parse(savedPricing));
     }
     setIsLoading(false);
   }, []);

-  const login = async (phone: string, password: string) => {
-    try {
-      const { data, error } = await supabase
-        .from('customers')
-        .select('*')
-        .eq('phone', phone)
-        .single();
-
-      if (error || !data) {
-        return { success: false, error: 'Invalid phone number or password' };
-      }
-
-      const isValidPassword = await bcrypt.compare(password, data.password_hash);
-      if (!isValidPassword) {
-        return { success: false, error: 'Invalid phone number or password' };
-      }
-
-      const userData: User = {
-        id: data.id,
-        phone: data.phone,
-        name: data.name || undefined,
-        email: data.email || undefined
-      };
-
-      setUser(userData);
-      localStorage.setItem('ridemax_user', JSON.stringify(userData));
-      return { success: true };
-    } catch (error) {
-      return { success: false, error: 'Login failed. Please try again.' };
-    }
-  };
-
-  const signup = async (phone: string, password: string, name?: string, email?: string) => {
-    try {
-      // Check if phone already exists
-      const { data: existingUser } = await supabase
-        .from('customers')
-        .select('phone')
-        .eq('phone', phone)
-        .single();
-
-      if (existingUser) {
-        return { success: false, error: 'Phone number already registered' };
-      }
-
-      const passwordHash = await bcrypt.hash(password, 10);
-
-      const { data, error } = await supabase
-        .from('customers')
-        .insert({
-          phone,
-          password_hash: passwordHash,
-          name: name || null,
-          email: email || null
-        })
-        .select()
-        .single();
-
-      if (error) {
-        return { success: false, error: 'Registration failed. Please try again.' };
-      }
-
-      const userData: User = {
-        id: data.id,
-        phone: data.phone,
-        name: data.name || undefined,
-        email: data.email || undefined
-      };
-
-      setUser(userData);
-      localStorage.setItem('ridemax_user', JSON.stringify(userData));
-      return { success: true };
-    } catch (error) {
-      return { success: false, error: 'Registration failed. Please try again.' };
-    }
-  };
-
-  const adminLogin = async (username: string, password: string) => {
+  const login = async (username: string, password: string) => {
     // Simple admin credentials (in production, this should be more secure)
     if (username === 'admin' && password === 'admin123') {
-      const adminUser: User = {
+      const adminData: Admin = {
         id: 'admin',
-        phone: 'admin',
-        name: 'Administrator',
-        isAdmin: true
+        username: 'admin',
+        name: 'Administrator'
       };
-      setUser(adminUser);
-      localStorage.setItem('ridemax_user', JSON.stringify(adminUser));
+      setAdmin(adminData);
+      localStorage.setItem('ridemax_admin', JSON.stringify(adminData));
       return { success: true };
     }
     return { success: false, error: 'Invalid admin credentials' };
   };

+  const updatePricing = (newPricing: PricingStructure) => {
+    setPricing(newPricing);
+    localStorage.setItem('ridemax_pricing', JSON.stringify(newPricing));
+  };
+
   const logout = () => {
-    setUser(null);
-    localStorage.removeItem('ridemax_user');
+    setAdmin(null);
+    localStorage.removeItem('ridemax_admin');
   };

   return (
-    <AuthContext.Provider value={{ user, isLoading, login, signup, adminLogin, logout }}>
+    <AdminContext.Provider value={{ admin, isLoading, pricing, login, updatePricing, logout }}>
       {children}
-    </AuthContext.Provider>
+    </AdminContext.Provider>
   );
 };