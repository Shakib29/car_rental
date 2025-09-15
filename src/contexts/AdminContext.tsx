import React, { createContext, useContext, useState, useEffect } from 'react';

interface Admin {
  id: string;
  username: string;
  isAuthenticated: boolean;
}

interface PricingConfig {
  outstation: {
    [key: string]: {
      '4-seater': number;
      '6-seater': number;
    };
  };
  mumbaiLocal: {
    baseRate: number;
    airportRate: number;
    sixSeaterSurcharge: number;
  };
  cities: string[];
}

interface AdminContextType {
  admin: Admin | null;
  pricing: PricingConfig;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updatePricing: (newPricing: PricingConfig) => void;
  addCity: (city: string) => void;
  removeCity: (city: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

const defaultPricing: PricingConfig = {
  outstation: {
    'Mumbai-Pune': { '4-seater': 2500, '6-seater': 3500 },
    'Mumbai-Surat': { '4-seater': 3500, '6-seater': 4500 },
    'Mumbai-Nashik': { '4-seater': 2800, '6-seater': 3800 },
    'Pune-Surat': { '4-seater': 4000, '6-seater': 5000 },
    'Pune-Nashik': { '4-seater': 2200, '6-seater': 3200 },
    'Surat-Nashik': { '4-seater': 3200, '6-seater': 4200 }
  },
  mumbaiLocal: {
    baseRate: 15, // per km
    airportRate: 18, // per km for airport transfers
    sixSeaterSurcharge: 200 // additional charge for 6-seater cars
  },
  cities: ['Mumbai', 'Pune', 'Surat', 'Nashik']
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [pricing, setPricing] = useState<PricingConfig>(defaultPricing);

  useEffect(() => {
    // Check for existing admin session
    const savedAdmin = localStorage.getItem('ridemax_admin');
    const savedPricing = localStorage.getItem('ridemax_pricing');
    
    if (savedAdmin) {
      setAdmin(JSON.parse(savedAdmin));
    }
    
    if (savedPricing) {
      setPricing(JSON.parse(savedPricing));
    }
  }, []);

  const login = async (username: string, password: string) => {
    // Simple admin credentials (in production, this should be more secure)
    if (username === 'admin' && password === 'admin123') {
      const adminUser: Admin = {
        id: 'admin',
        username: 'Administrator',
        isAuthenticated: true
      };
      setAdmin(adminUser);
      localStorage.setItem('ridemax_admin', JSON.stringify(adminUser));
      return { success: true };
    }
    return { success: false, error: 'Invalid admin credentials' };
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('ridemax_admin');
  };

  const updatePricing = (newPricing: PricingConfig) => {
    setPricing(newPricing);
    localStorage.setItem('ridemax_pricing', JSON.stringify(newPricing));
  };

  const addCity = (city: string) => {
    const newPricing = {
      ...pricing,
      cities: [...pricing.cities, city]
    };
    setPricing(newPricing);
    localStorage.setItem('ridemax_pricing', JSON.stringify(newPricing));
  };

  const removeCity = (city: string) => {
    const newPricing = {
      ...pricing,
      cities: pricing.cities.filter(c => c !== city)
    };
    setPricing(newPricing);
    localStorage.setItem('ridemax_pricing', JSON.stringify(newPricing));
  };

  return (
    <AdminContext.Provider value={{ admin, pricing, login, logout, updatePricing, addCity, removeCity }}>
      {children}
    </AdminContext.Provider>
  );
};