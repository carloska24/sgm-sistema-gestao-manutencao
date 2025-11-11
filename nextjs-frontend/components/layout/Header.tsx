'use client';

import {
  Menu,
  Bell,
  Maximize2,
  Minimize2,
  Search,
  User,
  LogOut,
  ChevronDown,
  BrainCircuit,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { useLayout } from '@/hooks/useLayout';
import OfflineQueueIndicator from '@/components/offline/OfflineQueueIndicator';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { user, logout } = useAuth();
  const { toggleSidebar, isMobile, fullScreen, enterFullScreen, exitFullScreen } = useLayout();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);


  const handleToggleFullScreen = () => {
    if (fullScreen) {
      exitFullScreen();
    } else {
      enterFullScreen();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-20 h-16 flex items-center px-4 sm:px-6 lg:px-8">
      {/* Background com gradiente premium */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-900/85 backdrop-blur-xl border-b border-slate-700/30" />
      
      {/* Efeito de brilho top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
      
      <div className="relative w-full flex items-center justify-between gap-6">
        {/* Esquerda: Menu e Logo */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSidebar}
            aria-label="Alternar menu"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all group"
          >
            <Menu className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </motion.button>

          {/* Logo em mobile */}
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">SGM</span>
          </Link>
        </div>

        {/* Centro: Espaçador flexível */}
        <div className="flex-1" />

        {/* Direita: Ações */}
        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          {/* Status Offline */}
          <div className="hidden md:block">
            <OfflineQueueIndicator variant="icon" />
          </div>

          {/* Fullscreen */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={fullScreen ? 'Sair do modo tela cheia' : 'Entrar em modo tela cheia'}
            onClick={handleToggleFullScreen}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all hidden md:inline-flex group"
          >
            {fullScreen ? (
              <Minimize2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            ) : (
              <Maximize2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
          </motion.button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-700/50 mx-1 hidden sm:block" />

          {/* Menu do Usuário - Design Moderno */}
          <div className="relative" ref={menuRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/40 transition-all group"
            >
              {/* Avatar com suporte a foto */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 rounded-full flex items-center justify-center border border-green-400/30 shadow-lg shadow-green-500/20 overflow-hidden">
                  {user?.photo_url ? (
                    <img 
                      src={user.photo_url} 
                      alt={user.full_name || user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white">{(user?.full_name || user?.username)?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-slate-900 shadow-lg" />
              </div>
              
              {/* Informações do usuário */}
              <div className="hidden sm:flex flex-col items-start justify-center">
                <p className="text-xs font-bold text-white leading-tight">{user?.full_name || user?.username || 'Usuário'}</p>
                <p className="text-xs text-slate-400 capitalize leading-tight">{user?.role || 'Admin'}</p>
              </div>

              {/* Ícone indicador */}
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors hidden sm:block" />
            </motion.button>

            {/* Dropdown Menu Premium */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-72 bg-gradient-to-b from-slate-900/98 to-slate-800/95 border border-slate-700/40 rounded-xl backdrop-blur-xl p-4 shadow-2xl z-50"
                >
                  {/* Header com Avatar e Info */}
                  <div className="flex items-start gap-3 mb-4 pb-4 border-b border-slate-700/30">
                    {/* Avatar Grande */}
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 rounded-xl flex items-center justify-center border border-green-400/40 shadow-lg shadow-green-500/20 overflow-hidden">
                        {user?.photo_url ? (
                          <img 
                            src={user.photo_url} 
                            alt={user.full_name || user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-white">{(user?.full_name || user?.username)?.charAt(0).toUpperCase() || 'U'}</span>
                        )}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800" />
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{user?.full_name || user?.username}</p>
                      <p className="text-xs text-slate-400 capitalize truncate">{user?.role}</p>
                      <p className="text-xs text-slate-500 mt-2">Conectado e ativo</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-4 px-2 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-300 font-medium">Online</span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-700/30 mb-3" />

                  {/* Menu Items */}
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        // Navegar para página de editar perfil
                        window.location.href = '/users/' + user?.id + '/edit';
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all group"
                    >
                      <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Editar Perfil</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-700/30 my-3" />

                  {/* Logout */}
                  <motion.button
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all group font-medium"
                  >
                    <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Sair da Conta</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
