'use client';

import clsx from 'clsx';
import { useLayout } from '@/hooks/useLayout';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toast, ToastContainer } from '@/components/Toast';

interface LayoutShellProps {
  children: React.ReactNode;
  toasts: Toast[];
  onCloseToast: (id: string) => void;
}

export default function LayoutShell({ children, toasts, onCloseToast }: LayoutShellProps) {
  const { sidebarVariant, isMobile, fullScreen } = useLayout();

  const sidebarWidth = fullScreen || isMobile ? 0 : sidebarVariant === 'expanded' ? 256 : 80;
  const contentPadding = isMobile ? 'px-4' : 'px-6';
  const topPadding = fullScreen ? 'pt-4 md:pt-6' : 'pt-20';

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {!fullScreen && <Header />}
      <Sidebar />
      <main
        className={clsx('min-h-screen transition-[margin,padding] duration-300 ease-in-out', contentPadding, topPadding)}
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="w-full max-w-full overflow-x-hidden overflow-y-visible">{children}</div>
      </main>
      <ToastContainer toasts={toasts} onClose={onCloseToast} />
    </div>
  );
}
