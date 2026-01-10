/** @format */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  useMockData: boolean;
  setUseMockData: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

const STORAGE_KEY = 'app-settings-use-mock-data';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [useMockData, setUseMockDataState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setUseMockDataState(stored === 'true');
    }
    setMounted(true);
  }, []);

  // Save to localStorage when changed
  const setUseMockData = (value: boolean) => {
    setUseMockDataState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <SettingsContext.Provider value={{ useMockData, setUseMockData }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
