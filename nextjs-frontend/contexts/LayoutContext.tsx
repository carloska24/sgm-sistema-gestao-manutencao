'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type SidebarVariant = 'expanded' | 'compact';

interface LayoutSettings {
  sidebarVariant: SidebarVariant;
  fullScreen?: boolean;
}

interface LayoutContextValue {
  sidebarVariant: SidebarVariant;
  isSidebarOpen: boolean;
  isMobile: boolean;
  fullScreen: boolean;
  toggleSidebar: () => void;
  setSidebarVariant: (variant: SidebarVariant) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  enterFullScreen: () => void;
  exitFullScreen: () => void;
}

const STORAGE_KEY = 'sgm-layout-settings';

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

function getStoredSettings(): LayoutSettings | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const data = window.localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as LayoutSettings) : null;
  } catch (error) {
    console.error('Erro ao ler configurações de layout:', error);
    return null;
  }
}

function storeSettings(settings: LayoutSettings) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Erro ao salvar configurações de layout:', error);
  }
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [sidebarVariant, setSidebarVariantState] = useState<SidebarVariant>('expanded');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    const stored = getStoredSettings();
    if (stored?.sidebarVariant) {
      setSidebarVariantState(stored.sidebarVariant);
    }
    if (stored?.fullScreen !== undefined) {
      setFullScreen(stored.fullScreen);
    }
  }, []);

  useEffect(() => {
    const updateBreakpoint = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isMobile && isSidebarOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }, [isMobile, isSidebarOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFullScreen(false);
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setSidebarVariant = useCallback((variant: SidebarVariant) => {
    setSidebarVariantState(variant);
    const stored = getStoredSettings();
    storeSettings({ sidebarVariant: variant, ...(stored || {}) });
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(prev => !prev);
    } else {
      const nextVariant = sidebarVariant === 'expanded' ? 'compact' : 'expanded';
      setSidebarVariant(nextVariant);
    }
  }, [isMobile, sidebarVariant, setSidebarVariant]);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  const enterFullScreen = useCallback(() => {
    setFullScreen(true);
    const stored = getStoredSettings();
    storeSettings({ sidebarVariant: sidebarVariant, fullScreen: true, ...(stored || {}) });
  }, [sidebarVariant]);

  const exitFullScreen = useCallback(() => {
    setFullScreen(false);
    const stored = getStoredSettings();
    storeSettings({ sidebarVariant: sidebarVariant, fullScreen: false, ...(stored || {}) });
  }, [sidebarVariant]);

  const value = useMemo(
    () => ({
      sidebarVariant,
      isSidebarOpen,
      isMobile,
      fullScreen,
      toggleSidebar,
      setSidebarVariant,
      openSidebar,
      closeSidebar,
      enterFullScreen,
      exitFullScreen,
    }),
    [
      sidebarVariant,
      isSidebarOpen,
      isMobile,
      fullScreen,
      toggleSidebar,
      setSidebarVariant,
      openSidebar,
      closeSidebar,
      enterFullScreen,
      exitFullScreen,
    ]
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayoutContext() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext deve ser usado dentro de um LayoutProvider');
  }
  return context;
}
