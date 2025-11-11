import type { MetadataRoute } from 'next';

const appName = 'SGM';

const icons = [
  {
    src: '/icons/icon-192x192.png',
    sizes: '192x192',
    type: 'image/png',
  },
  {
    src: '/icons/icon-512x512.png',
    sizes: '512x512',
    type: 'image/png',
  },
];

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SGM - Sistema de Gestão de Manutenção',
    short_name: appName,
    description: 'Acompanhe equipamentos, chamados e preventivas em qualquer lugar.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#16a34a',
    lang: 'pt-BR',
    icons,
    shortcuts: [
      {
        name: 'Abrir Dashboard',
        short_name: 'Dashboard',
        description: 'Visão geral de indicadores',
        url: '/dashboard',
      },
      {
        name: 'Chamados',
        short_name: 'Chamados',
        url: '/calls',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/dashboard.png',
        type: 'image/png',
        sizes: '1280x720',
        form_factor: 'wide',
      },
    ],
  };
}
