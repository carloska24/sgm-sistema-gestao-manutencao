/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Desabilitar prefetch automático para evitar problemas com unstable_prefetch.mode no Next.js 16
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Removido rewrites para produção - usar variável de ambiente NEXT_PUBLIC_API_URL
  // Os rewrites só funcionam em desenvolvimento local
  // Para Netlify, o plugin @netlify/plugin-nextjs gerencia o build
};

module.exports = nextConfig;

