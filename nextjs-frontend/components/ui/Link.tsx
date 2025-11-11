'use client';

import NextLink from 'next/link';
import { ComponentProps } from 'react';

/**
 * Wrapper para o Link do Next.js que desabilita prefetch por padrão
 * para evitar problemas com unstable_prefetch.mode no Next.js 16
 */
export default function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}

