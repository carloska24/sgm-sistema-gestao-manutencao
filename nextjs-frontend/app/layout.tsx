import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { OfflineSyncProvider } from '@/components/providers/OfflineSyncProvider';
import { LayoutProvider } from '@/contexts/LayoutContext';

export const metadata: Metadata = {
  title: 'SGM - Sistema de Gestão da Manutenção',
  description: 'Sistema completo para gestão e controle de manutenção',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <LayoutProvider>
            <OfflineSyncProvider enabled>
              {children}
            </OfflineSyncProvider>
          </LayoutProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
