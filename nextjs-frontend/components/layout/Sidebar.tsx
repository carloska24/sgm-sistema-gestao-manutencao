'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/hooks/useLayout';
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  Calendar,
  CalendarDays,
  FileText,
  Users,
  ClipboardCheck,
  Package,
  FileCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const NAVIGATION: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'technician', 'requester'] },
  { name: 'Equipamentos', href: '/equipment', icon: Wrench, roles: ['admin', 'manager', 'technician'] },
  { name: 'Chamados', href: '/calls', icon: ClipboardList, roles: ['admin', 'manager', 'technician', 'requester'] },
  { name: 'Ordens de Manutenção', href: '/maintenance', icon: FileCheck, roles: ['admin', 'manager', 'technician'] },
  { name: 'Preventivas', href: '/plans', icon: Calendar, roles: ['admin', 'manager', 'technician'] },
  { name: 'Calendário', href: '/plans/calendar', icon: CalendarDays, roles: ['admin', 'manager', 'technician'] },
  { name: 'Checklists', href: '/checklists', icon: ClipboardCheck, roles: ['admin', 'manager'] },
  { name: 'Inventário', href: '/inventory', icon: Package, roles: ['admin', 'manager'] },
  { name: 'Relatórios', href: '/reports', icon: FileText, roles: ['admin', 'manager'] },
  { name: 'Usuários', href: '/users', icon: Users, roles: ['admin', 'manager'] },
];

function NavLink({ item, active, compact, onClick }: { item: NavItem; active: boolean; compact: boolean; onClick?: () => void }) {
  const Icon = item.icon;

  return (
    <Link
      key={item.name}
      href={item.href}
      onClick={onClick}
      prefetch={false}
      className={clsx(
        'group flex items-center gap-x-3.5 rounded-lg px-3 py-2.5 text-sm transition-all relative',
        active
          ? 'bg-slate-800/60 text-white font-semibold shadow-inner shadow-black/20'
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white',
        compact ? 'justify-center' : ''
      )}
      title={compact ? item.name : ''}
    >
      {/* Indicador de item ativo */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 rounded-r-full"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: active ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      <Icon className={clsx('w-5 h-5 flex-shrink-0')} strokeWidth={1.5} />
      {!compact && <span className="truncate">{item.name}</span>}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { hasRole, user, logout } = useAuth();
  const { sidebarVariant, isMobile, isSidebarOpen, closeSidebar, toggleSidebar, fullScreen } = useLayout();

  if (fullScreen) {
    return null;
  }

  const filteredItems = NAVIGATION.filter((item) => hasRole(item.roles));
  const isCompact = sidebarVariant === 'compact';

  const renderNavItems = (onItemClick?: () => void) => (
    <nav className="mt-4 space-y-1">
      {filteredItems.map((item) => {
        // Lógica especial para evitar que "Preventivas" fique ativo quando estiver em "Calendário"
        let isActive = false;
        if (item.href === '/plans') {
          // Para "Preventivas", só fica ativo se for exatamente /plans ou começar com /plans/ mas não for /plans/calendar
          isActive = pathname === item.href || (pathname?.startsWith(`${item.href}/`) && !pathname?.startsWith('/plans/calendar'));
        } else if (item.href === '/plans/calendar') {
          // Para "Calendário", fica ativo se for exatamente /plans/calendar ou começar com /plans/calendar/
          isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        } else {
          // Para outras rotas, comportamento padrão
          isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        }
        return <NavLink key={item.name} item={item} active={!!isActive} compact={isCompact && !isMobile} onClick={onItemClick} />;
      })}
    </nav>
  );

  const SidebarHeader = ({ compact }: { compact: boolean }) => (
    <div className={clsx('flex items-center justify-between h-16', compact ? 'px-3' : 'px-4')}>
      <Link href="/dashboard" className={clsx('flex items-center gap-2 transition-opacity', compact ? 'opacity-0' : 'opacity-100')}>
        <BrainCircuit className="w-8 h-8 text-green-400" />
        <span className="text-xl font-bold text-white">SGM</span>
      </Link>
      <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-slate-800">
        {compact ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        aria-label="Navegação principal"
        className={clsx(
          'hidden lg:flex fixed top-0 left-0 h-screen flex-col border-r border-slate-800 bg-slate-900/95 backdrop-blur-lg transition-all duration-300 ease-in-out z-30',
          isCompact ? 'w-20' : 'w-64'
        )}
      >
        <SidebarHeader compact={isCompact} />
        <div className="flex-1 overflow-y-auto px-3">
          {renderNavItems()}
        </div>
      </aside>

      {/* Mobile overlay */}
      <aside
        className={clsx(
          'lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/95 border-r border-slate-800 py-6 transition-transform duration-300 ease-in-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!isSidebarOpen}
      >
        <div className="px-4">
          <Link href="/dashboard" className="flex items-center gap-2 mb-6">
            <BrainCircuit className="w-8 h-8 text-green-400" />
            <span className="text-xl font-bold text-white">SGM</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          {renderNavItems(() => closeSidebar())}
        </div>
      </aside>

      {isMobile && isSidebarOpen && !fullScreen && (
        <button
          type="button"
          aria-label="Fechar navegação"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={closeSidebar}
        />
      )}
    </>
  );
}
