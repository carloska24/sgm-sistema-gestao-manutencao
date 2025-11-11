'use client';

import {
  useState,
  useEffect,
  Suspense,
  useMemo,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { fetchData, deleteData, putData } from '@/lib/api';
import { MaintenanceCall } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Clock,
  User,
  Wrench,
  Calendar,
  Grid3x3,
  Columns,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Calendar as CalendarIcon,
  TrendingUp,
  AlertTriangle,
  Info,
  Shield,
  Zap,
  Package,
  BarChart3,
  ClipboardCheck,
  UserCheck,
  Timer,
  GripVertical,
  ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente de ícone SVG animado para Chamados - Telefone Tocando
const AnimatedAICallIcon = () => {
  return (
    <motion.div className="relative flex items-center justify-center w-full h-full">
      {/* Halos de brilho animados */}
      <motion.div
        className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ 
          opacity: [0.2, 0.5, 0.3],
          scale: [0.6, 1.1, 0.8],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-blue-500/15 blur-xl"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: [0.15, 0.4, 0.2],
          scale: [0.5, 0.95, 0.7],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      
      {/* SVG principal com animação de telefone tocando */}
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 64 64"
        className="relative w-14 h-14"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ 
          scale: [0, 1.1, 1],
          rotate: [-180, 0],
        }}
        transition={{ 
          scale: { duration: 0.8, ease: 'easeOut' },
          rotate: { duration: 1, ease: 'easeOut' }
        }}
      >
        <defs>
          <linearGradient id="linear-gradient" x1="1" y1="32.5002" x2="62" y2="32.5002" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0fdcdd">
              <animate
                attributeName="stop-color"
                values="#0fdcdd;#46a1e8;#0fdcdd"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="1" stopColor="#46a1e8">
              <animate
                attributeName="stop-color"
                values="#46a1e8;#0fdcdd;#46a1e8"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
          
          {/* Gradiente para brilho percorrendo */}
          <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="45%" stopColor="transparent" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="55%" stopColor="transparent" stopOpacity="0" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            <animateTransform
              attributeName="gradientTransform"
              type="rotate"
              values="0 32 32;360 32 32"
              dur="4s"
              repeatCount="indefinite"
            />
          </linearGradient>
          
          {/* Filtro de brilho */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Grupo principal com animação de vibração (telefone tocando) */}
        <motion.g
          animate={{ 
            x: [0, -2, 2, -1.5, 1.5, -1, 1, 0],
            y: [0, -1, 1, -0.5, 0.5, 0, 0, 0],
            rotate: [0, -1, 1, -0.5, 0.5, 0]
          }}
          transition={{ 
            duration: 0.5, 
            repeat: Infinity, 
            ease: 'easeInOut',
            repeatDelay: 0.2
          }}
          style={{ transformOrigin: '32px 32px' }}
        >
          {/* Telefone principal */}
          <motion.path
            d="M15,41.96045a7,7,0,1,0,7,7A7.00787,7.00787,0,0,0,15,41.96045Zm0,12a5,5,0,1,1,5-5A5.00588,5.00588,0,0,1,15,53.96045Zm38.11133-43.103a30.21091,30.21091,0,0,0-20.728-8.85693A3.00007,3.00007,0,0,0,32.24463,7.999,24.30522,24.30522,0,0,1,56,32.31738a3,3,0,0,0,6,0A30.14779,30.14779,0,0,0,53.11133,10.85742ZM59,33.31738a1.001,1.001,0,0,1-1-1A26.30508,26.30508,0,0,0,32.29346,6a1.0055,1.0055,0,0,1-.97608-1.02393A1.02119,1.02119,0,0,1,32.32471,4h.0166A28.3066,28.3066,0,0,1,60,32.31738,1.001,1.001,0,0,1,59,33.31738ZM31.104,16.854A16.50649,16.50649,0,0,1,47.23633,33.36719a3,3,0,0,0,6,0A22.50846,22.50846,0,0,0,31.24561,10.85547,3.0001,3.0001,0,0,0,31.104,16.854Zm.07813-3.999h.01855A20.50791,20.50791,0,0,1,51.23633,33.36719a1,1,0,0,1-2,0A18.50635,18.50635,0,0,0,31.15283,14.855a1.0055,1.0055,0,0,1-.97607-1.02393A1.03169,1.03169,0,0,1,31.18213,12.855ZM29.96387,25.709a8.70264,8.70264,0,0,1,8.50781,8.708,3,3,0,0,0,6,0,14.70209,14.70209,0,0,0-14.36377-14.706,2.96828,2.96828,0,0,0-3.0708,2.92627A3.01315,3.01315,0,0,0,29.96387,25.709Zm.07422-3.999h.022A12.7023,12.7023,0,0,1,42.47168,34.417a1,1,0,0,1-2,0A10.70248,10.70248,0,0,0,30.01221,23.71a1.0055,1.0055,0,0,1-.97608-1.02344A1.01575,1.01575,0,0,1,30.03809,21.71ZM57.95215,43.6665l-5.71387-3.18066a6.01871,6.01871,0,0,0-7.19043,1.02978l-2.208,2.24024c-.043.041-4.51172,3.96-15.03222-6.561C17.28223,26.66992,21.167,22.15527,21.169,22.1499l2.24121-2.11963a5.99324,5.99324,0,0,0,1.11523-7.28369L21.33887,7.03711a6.03367,6.03367,0,0,0-9.48145-1.31787L7.18066,10.39551a14.33525,14.33525,0,0,0-2.4375,16.92773c.2356.75623,1.64612,4.66071,6.89771,11.1778a10.86341,10.86341,0,0,0-2.02759.86957l-.63379-.63379a2.48729,2.48729,0,0,0-3.51513,0l-.72754.72754a2.48818,2.48818,0,0,0,0,3.51513l.64648.64649A10.882,10.882,0,0,0,4.40576,46H3.48584A2.48877,2.48877,0,0,0,1,48.48584v1.02832A2.48877,2.48877,0,0,0,3.48584,52h.94092a10.85468,10.85468,0,0,0,.9834,2.34766l-.67334.67285a2.48818,2.48818,0,0,0,0,3.51513l.72754.72754a2.48818,2.48818,0,0,0,3.51513,0l.686-.68554A10.86472,10.86472,0,0,0,12,59.54541v.96875A2.48877,2.48877,0,0,0,14.48584,63h1.02832A2.48877,2.48877,0,0,0,18,60.51416v-.96875a10.86472,10.86472,0,0,0,2.33447-.96777l.686.68554a2.48729,2.48729,0,0,0,3.51513,0l.72754-.72754a2.48818,2.48818,0,0,0,0-3.51513l-.67334-.67285a10.85146,10.85146,0,0,0,.81952-1.88129c7.17652,5.99463,11.472,7.54492,12.26935,7.7934a14.33858,14.33858,0,0,0,16.92871-2.438l4.66992-4.66992a6.00051,6.00051,0,0,0-1.32519-9.48536ZM19.59277,8.01172l3.18653,5.71a3.99477,3.99477,0,0,1-.74414,4.85547L20.028,20.47626,12.671,7.73376l.60052-.60046A4.02148,4.02148,0,0,1,19.59277,8.01172Zm4.21875,42.78564a8.89919,8.89919,0,0,1-1.31836,3.145.99979.99979,0,0,0,.125,1.26172l1.231,1.23047a.48627.48627,0,0,1,0,.687l-.72754.72754a.48626.48626,0,0,1-.687,0l-1.24023-1.24023a.999.999,0,0,0-1.25684-.12842,8.90677,8.90677,0,0,1-3.13672,1.29932,1.00008,1.00008,0,0,0-.80078.98v1.75439A.48616.48616,0,0,1,15.51416,61H14.48584A.48616.48616,0,0,1,14,60.51416V58.75977a1.00008,1.00008,0,0,0-.80078-.98,8.90677,8.90677,0,0,1-3.13672-1.29932,1.00031,1.00031,0,0,0-1.25684.12842L7.56543,57.84912a.48715.48715,0,0,1-.687,0l-.72754-.72754a.48627.48627,0,0,1,0-.687l1.231-1.23047a.99979.99979,0,0,0,.125-1.26172,8.89919,8.89919,0,0,1-1.31836-3.145A.99947.99947,0,0,0,5.20947,50H3.48584A.48616.48616,0,0,1,3,49.51416V48.48584A.48616.48616,0,0,1,3.48584,48h1.709a1.00028,1.00028,0,0,0,.981-.80469A8.90366,8.90366,0,0,1,7.48047,44.023a1.00014,1.00014,0,0,0-.12842-1.25684L6.15088,41.56543a.48627.48627,0,0,1,0-.687l.72754-.72754a.48626.48626,0,0,1,.687,0l1.19141,1.19141a.99785.99785,0,0,0,1.26171.125,8.90465,8.90465,0,0,1,3.18067-1.32569,1.00008,1.00008,0,0,0,.80078-.98V37.48584A.48616.48616,0,0,1,14.48584,37h1.02832A.48616.48616,0,0,1,16,37.48584v1.67578a1.00008,1.00008,0,0,0,.80078.98,8.90465,8.90465,0,0,1,3.18067,1.32569.99978.99978,0,0,0,1.26171-.125l1.19141-1.19141a.48538.48538,0,0,1,.687,0l.72754.72754a.48627.48627,0,0,1,0,.687L22.648,42.76611a1.00014,1.00014,0,0,0-.12842,1.25684,8.90366,8.90366,0,0,1,1.30469,3.17236,1.00028,1.00028,0,0,0,.981.80469h1.709A.48616.48616,0,0,1,27,48.48584v1.02832A.48616.48616,0,0,1,26.51416,50H24.79053A.99947.99947,0,0,0,23.81152,50.79736Zm29.38184,5.61035A12.42,12.42,0,0,1,38.333,58.36816c-.04938-.014-3.87433-1.16754-10.679-6.658A2.47886,2.47886,0,0,0,29,49.51416V48.48584A2.48877,2.48877,0,0,0,26.51416,46h-.91992a10.882,10.882,0,0,0-.97754-2.374l.64648-.64649a2.48818,2.48818,0,0,0,0-3.51513l-.72754-.72754a2.4864,2.4864,0,0,0-3.51513,0l-.63379.63379A10.86774,10.86774,0,0,0,18,38.376v-.89014A2.48877,2.48877,0,0,0,15.51416,35H14.48584a2.47926,2.47926,0,0,0-2.11206,1.19147c-4.70416-6.07874-5.72553-9.47394-5.738-9.51764a12.42623,12.42623,0,0,1,1.959-14.86426L11.2066,9.198l7.619,13.19647c-.85608,2.47546-.8977,7.74878,7.56793,16.21442,5.19965,5.16577,11.00049,9.06787,15.7732,7.6018l13.547,7.67664Zm4.66992-4.66992-.682.682L44.30133,45.12122l2.17035-2.2013a4.01143,4.01143,0,0,1,4.79394-.68652l5.71387,3.18066v.00049A4.022,4.022,0,0,1,57.86328,51.73779Z"
            fill="url(#linear-gradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.8, 1, 0.9, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            filter="url(#glow)"
            style={{ filter: 'drop-shadow(0 0 6px rgba(15, 220, 221, 0.6))' }}
          />
          
          {/* Camada de brilho que percorre */}
          <motion.path
            d="M15,41.96045a7,7,0,1,0,7,7A7.00787,7.00787,0,0,0,15,41.96045Zm0,12a5,5,0,1,1,5-5A5.00588,5.00588,0,0,1,15,53.96045Zm38.11133-43.103a30.21091,30.21091,0,0,0-20.728-8.85693A3.00007,3.00007,0,0,0,32.24463,7.999,24.30522,24.30522,0,0,1,56,32.31738a3,3,0,0,0,6,0A30.14779,30.14779,0,0,0,53.11133,10.85742ZM59,33.31738a1.001,1.001,0,0,1-1-1A26.30508,26.30508,0,0,0,32.29346,6a1.0055,1.0055,0,0,1-.97608-1.02393A1.02119,1.02119,0,0,1,32.32471,4h.0166A28.3066,28.3066,0,0,1,60,32.31738,1.001,1.001,0,0,1,59,33.31738ZM31.104,16.854A16.50649,16.50649,0,0,1,47.23633,33.36719a3,3,0,0,0,6,0A22.50846,22.50846,0,0,0,31.24561,10.85547,3.0001,3.0001,0,0,0,31.104,16.854Zm.07813-3.999h.01855A20.50791,20.50791,0,0,1,51.23633,33.36719a1,1,0,0,1-2,0A18.50635,18.50635,0,0,0,31.15283,14.855a1.0055,1.0055,0,0,1-.97607-1.02393A1.03169,1.03169,0,0,1,31.18213,12.855ZM29.96387,25.709a8.70264,8.70264,0,0,1,8.50781,8.708,3,3,0,0,0,6,0,14.70209,14.70209,0,0,0-14.36377-14.706,2.96828,2.96828,0,0,0-3.0708,2.92627A3.01315,3.01315,0,0,0,29.96387,25.709Zm.07422-3.999h.022A12.7023,12.7023,0,0,1,42.47168,34.417a1,1,0,0,1-2,0A10.70248,10.70248,0,0,0,30.01221,23.71a1.0055,1.0055,0,0,1-.97608-1.02344A1.01575,1.01575,0,0,1,30.03809,21.71ZM57.95215,43.6665l-5.71387-3.18066a6.01871,6.01871,0,0,0-7.19043,1.02978l-2.208,2.24024c-.043.041-4.51172,3.96-15.03222-6.561C17.28223,26.66992,21.167,22.15527,21.169,22.1499l2.24121-2.11963a5.99324,5.99324,0,0,0,1.11523-7.28369L21.33887,7.03711a6.03367,6.03367,0,0,0-9.48145-1.31787L7.18066,10.39551a14.33525,14.33525,0,0,0-2.4375,16.92773c.2356.75623,1.64612,4.66071,6.89771,11.1778a10.86341,10.86341,0,0,0-2.02759.86957l-.63379-.63379a2.48729,2.48729,0,0,0-3.51513,0l-.72754.72754a2.48818,2.48818,0,0,0,0,3.51513l.64648.64649A10.882,10.882,0,0,0,4.40576,46H3.48584A2.48877,2.48877,0,0,0,1,48.48584v1.02832A2.48877,2.48877,0,0,0,3.48584,52h.94092a10.85468,10.85468,0,0,0,.9834,2.34766l-.67334.67285a2.48818,2.48818,0,0,0,0,3.51513l.72754.72754a2.48818,2.48818,0,0,0,3.51513,0l.686-.68554A10.86472,10.86472,0,0,0,12,59.54541v.96875A2.48877,2.48877,0,0,0,14.48584,63h1.02832A2.48877,2.48877,0,0,0,18,60.51416v-.96875a10.86472,10.86472,0,0,0,2.33447-.96777l.686.68554a2.48729,2.48729,0,0,0,3.51513,0l.72754-.72754a2.48818,2.48818,0,0,0,0-3.51513l-.67334-.67285a10.85146,10.85146,0,0,0,.81952-1.88129c7.17652,5.99463,11.472,7.54492,12.26935,7.7934a14.33858,14.33858,0,0,0,16.92871-2.438l4.66992-4.66992a6.00051,6.00051,0,0,0-1.32519-9.48536ZM19.59277,8.01172l3.18653,5.71a3.99477,3.99477,0,0,1-.74414,4.85547L20.028,20.47626,12.671,7.73376l.60052-.60046A4.02148,4.02148,0,0,1,19.59277,8.01172Zm4.21875,42.78564a8.89919,8.89919,0,0,1-1.31836,3.145.99979.99979,0,0,0,.125,1.26172l1.231,1.23047a.48627.48627,0,0,1,0,.687l-.72754.72754a.48626.48626,0,0,1-.687,0l-1.24023-1.24023a.999.999,0,0,0-1.25684-.12842,8.90677,8.90677,0,0,1-3.13672,1.29932,1.00008,1.00008,0,0,0-.80078.98v1.75439A.48616.48616,0,0,1,15.51416,61H14.48584A.48616.48616,0,0,1,14,60.51416V58.75977a1.00008,1.00008,0,0,0-.80078-.98,8.90677,8.90677,0,0,1-3.13672-1.29932,1.00031,1.00031,0,0,0-1.25684.12842L7.56543,57.84912a.48715.48715,0,0,1-.687,0l-.72754-.72754a.48627.48627,0,0,1,0-.687l1.231-1.23047a.99979.99979,0,0,0,.125-1.26172,8.89919,8.89919,0,0,1-1.31836-3.145A.99947.99947,0,0,0,5.20947,50H3.48584A.48616.48616,0,0,1,3,49.51416V48.48584A.48616.48616,0,0,1,3.48584,48h1.709a1.00028,1.00028,0,0,0,.981-.80469A8.90366,8.90366,0,0,1,7.48047,44.023a1.00014,1.00014,0,0,0-.12842-1.25684L6.15088,41.56543a.48627.48627,0,0,1,0-.687l.72754-.72754a.48626.48626,0,0,1,.687,0l1.19141,1.19141a.99785.99785,0,0,0,1.26171.125,8.90465,8.90465,0,0,1,3.18067-1.32569,1.00008,1.00008,0,0,0,.80078-.98V37.48584A.48616.48616,0,0,1,14.48584,37h1.02832A.48616.48616,0,0,1,16,37.48584v1.67578a1.00008,1.00008,0,0,0,.80078.98,8.90465,8.90465,0,0,1,3.18067,1.32569.99978.99978,0,0,0,1.26171-.125l1.19141-1.19141a.48538.48538,0,0,1,.687,0l.72754.72754a.48627.48627,0,0,1,0,.687L22.648,42.76611a1.00014,1.00014,0,0,0-.12842,1.25684,8.90366,8.90366,0,0,1,1.30469,3.17236,1.00028,1.00028,0,0,0,.981.80469h1.709A.48616.48616,0,0,1,27,48.48584v1.02832A.48616.48616,0,0,1,26.51416,50H24.79053A.99947.99947,0,0,0,23.81152,50.79736Zm29.38184,5.61035A12.42,12.42,0,0,1,38.333,58.36816c-.04938-.014-3.87433-1.16754-10.679-6.658A2.47886,2.47886,0,0,0,29,49.51416V48.48584A2.48877,2.48877,0,0,0,26.51416,46h-.91992a10.882,10.882,0,0,0-.97754-2.374l.64648-.64649a2.48818,2.48818,0,0,0,0-3.51513l-.72754-.72754a2.4864,2.4864,0,0,0-3.51513,0l-.63379.63379A10.86774,10.86774,0,0,0,18,38.376v-.89014A2.48877,2.48877,0,0,0,15.51416,35H14.48584a2.47926,2.47926,0,0,0-2.11206,1.19147c-4.70416-6.07874-5.72553-9.47394-5.738-9.51764a12.42623,12.42623,0,0,1,1.959-14.86426L11.2066,9.198l7.619,13.19647c-.85608,2.47546-.8977,7.74878,7.56793,16.21442,5.19965,5.16577,11.00049,9.06787,15.7732,7.6018l13.547,7.67664Zm4.66992-4.66992-.682.682L44.30133,45.12122l2.17035-2.2013a4.01143,4.01143,0,0,1,4.79394-.68652l5.71387,3.18066v.00049A4.022,4.022,0,0,1,57.86328,51.73779Z"
            fill="url(#shineGradient)"
            opacity="0.5"
          />
        </motion.g>
      </motion.svg>
    </motion.div>
  );
};

type SegmentOption = 'all' | 'corrective' | 'planned' | 'emergency';

const callTypeConfig: Record<
  MaintenanceCall['type'],
  {
    label: string;
    description: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
  }
> = {
  preventive: {
    label: 'Preventiva',
    description: 'Manutenções programadas para prevenir falhas',
    icon: Shield,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  corrective: {
    label: 'Corretiva',
    description: 'Reparos após falhas ou problemas identificados',
    icon: Wrench,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  predictive: {
    label: 'Preditiva',
    description: 'Baseada em monitoramento e análise de condição',
    icon: TrendingUp,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  emergency: {
    label: 'Emergencial',
    description: 'Chamados críticos que demandam intervenção imediata',
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
};

export default function CallsPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Carregando...</p>
            </div>
          </div>
        </MainLayout>
      }
    >
      <CallsPageContent />
    </Suspense>
  );
}

function CallsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hasRole } = useAuth();
  const { success, error: showError } = useToast();
  const [calls, setCalls] = useState<MaintenanceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [segment, setSegment] = useState<SegmentOption>(
    (searchParams.get('segment') as SegmentOption) || 'corrective'
  );
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: '',
    equipment_id: '',
    assigned_to: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [kanbanPagination, setKanbanPagination] = useState<Record<string, number>>({
    open: 1,
    analysis: 1,
    assigned: 1,
    execution: 1,
    waiting_parts: 1,
    completed: 1,
    cancelled: 1,
  });
  const ITEMS_PER_PAGE = 6;
  const [draggedItem, setDraggedItem] = useState<MaintenanceCall | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [callsWithChecklist, setCallsWithChecklist] = useState<Set<number>>(new Set());
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);

  const canEdit = hasRole(['admin', 'manager']);
  const canCreate = true; // Todos podem criar chamados

  // Estados para animação do título com letras caindo
  const titleText = 'Chamados de Manutenção';
  const [lettersVisible, setLettersVisible] = useState<boolean[]>([]);

  // Animação de letras caindo
  useEffect(() => {
    const letters = titleText.split('');
    setLettersVisible(new Array(letters.length).fill(false));
    
    letters.forEach((_, index) => {
      setTimeout(() => {
        setLettersVisible(prev => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      }, index * 70 + Math.random() * 50);
    });
  }, [titleText]);

  const segmentOptions: Array<{
    value: SegmentOption;
    label: string;
    description: string;
    icon: any;
  }> = [
    {
      value: 'all',
      label: 'Visão 360º',
      description: 'Acompanhe todos os chamados em um único painel consolidado',
      icon: ClipboardList,
    },
    {
      value: 'corrective',
      label: 'Intervenções Corretivas',
      description: 'Chamados originados de falhas, defeitos e desvios críticos',
      icon: Wrench,
    },
    {
      value: 'planned',
      label: 'Chamados Programados',
      description: 'Solicitações preventivas e preditivas, priorizando a confiabilidade',
      icon: Shield,
    },
    {
      value: 'emergency',
      label: 'Escalada Emergencial',
      description: 'Chamados críticos que exigem resposta imediata',
      icon: AlertTriangle,
    },
  ];

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (viewMode === 'kanban') {
      loadAllCalls();
    } else {
      loadCalls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    filters.status,
    filters.priority,
    filters.equipment_id,
    filters.assigned_to,
    viewMode,
    pagination.page || 1,
  ]);

  // Verificar checklists associados
  useEffect(() => {
    if (calls.length > 0) {
      checkChecklists();
    }
  }, [calls]);

  const checkChecklists = async () => {
    try {
      const checklistPromises = calls.map(async call => {
        try {
          // Verificar se há checklist associado ao equipamento deste chamado
          const params = new URLSearchParams({
            entity_type: 'equipment',
            entity_id: call.equipment_id?.toString() || '',
          });
          const templates = await fetchData<any[]>(`/checklists?${params.toString()}`);
          return templates.length > 0 ? call.id : null;
        } catch {
          return null;
        }
      });

      const results = await Promise.all(checklistPromises);
      const withChecklist = new Set(results.filter(id => id !== null) as number[]);
      setCallsWithChecklist(withChecklist);
    } catch (err) {
      console.error('Erro ao verificar checklists:', err);
    }
  };

  // Carregar todos os chamados para o Kanban (otimizado - limite reduzido)
  const loadAllCalls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '500', // Reduzido de 10000 para 500 - suficiente para Kanban
        include_demo: 'true',
        ...(search && { search }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.equipment_id && { equipment_id: filters.equipment_id }),
        ...(filters.assigned_to &&
          (user?.role === 'admin' || user?.role === 'manager') && {
            assigned_to: filters.assigned_to,
          }),
      });

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        }/calls?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Erro ao carregar chamados');
      }

      setCalls(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err) {
      showError('Erro ao carregar chamados');
    } finally {
      setLoading(false);
    }
  };

  const loadCalls = async () => {
    try {
      setLoading(true);
      const currentPage = pagination?.page || 1;
      const currentLimit = pagination?.limit || 20;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString(),
        include_demo: 'true',
        ...(search && { search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.equipment_id && { equipment_id: filters.equipment_id }),
        ...(filters.assigned_to &&
          (user?.role === 'admin' || user?.role === 'manager') && {
            assigned_to: filters.assigned_to,
          }),
      });

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        }/calls?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Erro ao carregar chamados');
      }

      setCalls(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err) {
      showError('Erro ao carregar chamados');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este chamado?')) {
      return;
    }

    try {
      await deleteData(`/calls/${id}`);
      success('Chamado deletado com sucesso');
      loadCalls();
    } catch (err) {
      showError('Erro ao deletar chamado');
    }
  };

  const statusConfig: Record<
    string,
    { label: string; color: string; bg: string; border: string; icon: any }
  > = {
    open: {
      label: 'Aberto',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      icon: AlertCircle,
    },
    analysis: {
      label: 'Em Análise',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      icon: Clock,
    },
    assigned: {
      label: 'Atribuído',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      icon: UserCheck,
    },
    execution: {
      label: 'Em Execução',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      icon: Play,
    },
    waiting_parts: {
      label: 'Aguardando Peças',
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/30',
      icon: Package,
    },
    completed: {
      label: 'Concluído',
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      icon: CheckCircle2,
    },
    cancelled: {
      label: 'Cancelado',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: XCircle,
    },
  };

  const priorityConfig: Record<
    string,
    { label: string; color: string; bg: string; border: string }
  > = {
    low: {
      label: 'Baixa',
      color: 'text-slate-400',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
    },
    medium: {
      label: 'Média',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
    },
    high: {
      label: 'Alta',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
    },
    urgent: {
      label: 'Urgente',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
    },
  };

  const statusColumns = [
    { id: 'open', label: 'Abertos', status: 'open' },
    { id: 'analysis', label: 'Em Análise', status: 'analysis' },
    { id: 'assigned', label: 'Atribuídos', status: 'assigned' },
    { id: 'execution', label: 'Em Execução', status: 'execution' },
    { id: 'waiting_parts', label: 'Aguardando Peças', status: 'waiting_parts' },
    { id: 'completed', label: 'Concluídos', status: 'completed' },
    { id: 'cancelled', label: 'Cancelados', status: 'cancelled' },
  ];

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status];
    if (!config) return <ClipboardList className="w-4 h-4" />;
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  const getMaintenanceTypeConfig = (type: MaintenanceCall['type']) => {
    return callTypeConfig[type] || callTypeConfig.corrective;
  };

  const getPriorityConfig = (priority: string) => {
    return priorityConfig[priority] || priorityConfig.medium;
  };

  const applySegmentFilter = (list: MaintenanceCall[]) => {
    if (segment === 'all') return list;
    if (segment === 'planned') {
      return list.filter(call => call.type === 'preventive' || call.type === 'predictive');
    }
    if (segment === 'emergency') {
      return list.filter(call => call.type === 'emergency');
    }
    // segment === 'corrective'
    return list.filter(call => call.type === 'corrective' || call.type === 'emergency');
  };

  const applyStatusFilter = (list: MaintenanceCall[]) => {
    if (!filters.status) return list;
    return list.filter(call => call.status === filters.status);
  };

  const filteredCalls = useMemo(
    () => applyStatusFilter(applySegmentFilter(calls)),
    [calls, filters.status, segment]
  );

  const stats = useMemo(() => {
    const dataset = filteredCalls;
    const total = dataset.length;
    const byStatus = {
      open: dataset.filter(c => c.status === 'open').length,
      analysis: dataset.filter(c => c.status === 'analysis').length,
      assigned: dataset.filter(c => c.status === 'assigned').length,
      execution: dataset.filter(c => c.status === 'execution').length,
      waiting_parts: dataset.filter(c => c.status === 'waiting_parts').length,
      completed: dataset.filter(c => c.status === 'completed').length,
      cancelled: dataset.filter(c => c.status === 'cancelled').length,
    };

    const urgent = dataset.filter(
      c => c.priority === 'urgent' && c.status !== 'completed' && c.status !== 'cancelled'
    ).length;
    const today = dataset.filter(c => {
      if (!c.created_at) return false;
      return isToday(new Date(c.created_at));
    }).length;

    return { total, byStatus, urgent, today };
  }, [filteredCalls]);

  const plannedCalls = useMemo(
    () => filteredCalls.filter(call => call.type === 'preventive' || call.type === 'predictive'),
    [filteredCalls]
  );

  const reactiveCalls = useMemo(
    () => filteredCalls.filter(call => call.type === 'corrective' || call.type === 'emergency'),
    [filteredCalls]
  );

  const plannedStats = useMemo(() => {
    const total = plannedCalls.length;
    const open = plannedCalls.filter(c => c.status === 'open').length;
    const analysis = plannedCalls.filter(c => c.status === 'analysis').length;
    const assigned = plannedCalls.filter(c => c.status === 'assigned').length;
    const execution = plannedCalls.filter(c => c.status === 'execution').length;
    const completed = plannedCalls.filter(c => c.status === 'completed').length;

    return { total, open, analysis, assigned, execution, completed };
  }, [plannedCalls]);

  const reactiveStats = useMemo(() => {
    const total = reactiveCalls.length;
    const open = reactiveCalls.filter(c => c.status === 'open').length;
    const analysis = reactiveCalls.filter(c => c.status === 'analysis').length;
    const assigned = reactiveCalls.filter(c => c.status === 'assigned').length;
    const execution = reactiveCalls.filter(c => c.status === 'execution').length;
    const waitingParts = reactiveCalls.filter(c => c.status === 'waiting_parts').length;
    const urgent = reactiveCalls.filter(c => c.priority === 'urgent').length;
    const completed = reactiveCalls.filter(c => c.status === 'completed').length;

    return { total, open, analysis, assigned, execution, waitingParts, urgent, completed };
  }, [reactiveCalls]);

  const shouldShowPlanned = segment === 'all' || segment === 'planned';
  const shouldShowReactive =
    segment === 'all' || segment === 'corrective' || segment === 'emergency';

  const reactiveTitle =
    segment === 'emergency' ? 'Chamados Emergenciais' : 'Intervenções Corretivas & Emergenciais';
  const reactiveDescription =
    segment === 'emergency'
      ? 'Chamados críticos escalados para resposta imediata e mitigação de riscos.'
      : 'Chamados derivados de falhas e intervenções emergenciais priorizadas pela operação.';

  const renderCallCard = (call: MaintenanceCall, idx: number) => {
    const status = statusConfig[call.status] || statusConfig.open;
    const typeConfig = getMaintenanceTypeConfig(call.type);
    const priority = getPriorityConfig(call.priority);
    const TypeIcon = typeConfig.icon;
    const isAssignedToMe = call.assigned_to === user?.id;
    const hasChecklist = callsWithChecklist.has(call.id);

    return (
      <motion.div
        key={call.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        className={clsx(
          'group bg-slate-800/50 rounded-xl border p-5 hover:border-slate-600 transition-all cursor-pointer relative overflow-hidden',
          isAssignedToMe ? 'border-green-500/50' : 'border-slate-700/50'
        )}
        onClick={() => router.push(`/calls/${call.id}`)}
      >
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={clsx(
                  'text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5',
                  status.color,
                  status.bg,
                  status.border
                )}
              >
                {getStatusIcon(call.status)}
                {status.label}
              </span>
              <span
                className={clsx(
                  'text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5',
                  typeConfig.color,
                  typeConfig.bg,
                  typeConfig.border
                )}
              >
                <TypeIcon className="w-3 h-3" />
                {typeConfig.label}
              </span>
              {hasChecklist && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 bg-purple-500/10 text-purple-400 border-purple-500/30">
                  <ClipboardCheck className="w-3 h-3" />
                  Checklist
                </span>
              )}
            </div>
            {isAssignedToMe && (
              <div className="flex-shrink-0">
                <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  Para você
                </span>
              </div>
            )}
          </div>

          <h3 className="text-white font-semibold mb-2 text-base group-hover:text-green-400 transition-colors">
            {call.equipment_name || 'Equipamento não especificado'} (#{call.id})
          </h3>

          <p className="text-sm text-slate-400 mb-4 line-clamp-2 h-10">
            {call.description || 'Sem descrição'}
          </p>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Prioridade</p>
              <span
                className={clsx(
                  'text-xs font-medium px-2.5 py-1 rounded-full border',
                  priority.color,
                  priority.bg,
                  priority.border
                )}
              >
                {priority.label}
              </span>
            </div>
            {call.created_at && (
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Criado em</p>
                <p className="text-sm text-slate-300 font-medium">
                  {format(new Date(call.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Responsável</p>
              <p
                className={clsx(
                  'text-sm font-medium',
                  isAssignedToMe ? 'text-green-400' : 'text-slate-300'
                )}
              >
                {call.assigned_to_name || 'Não atribuído'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };
  const getCallsByStatus = (status: string) => {
    return filteredCalls.filter(call => call.status === status);
  };

  const handleDragStart = (
    e: ReactDragEvent | ReactPointerEvent | ReactMouseEvent,
    item: MaintenanceCall
  ) => {
    setDraggedItem(item);
    if ('dataTransfer' in e && e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDraggedOverColumn(status);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDraggedOverColumn(null);

    if (!draggedItem || draggedItem.status === targetStatus) {
      setDraggedItem(null);
      return;
    }

    if (!canEdit && draggedItem.assigned_to !== user?.id) {
      showError('Você não tem permissão para alterar o status deste chamado');
      setDraggedItem(null);
      return;
    }

    try {
      await putData(`/calls/${draggedItem.id}`, { status: targetStatus });
      success('Status do chamado atualizado');
      loadCalls();
    } catch (err) {
      showError('Erro ao atualizar status do chamado');
      loadCalls();
    }
    setDraggedItem(null);
  };

  const getPaginatedCalls = (calls: MaintenanceCall[], status: string) => {
    const page = kanbanPagination[status] || 1;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return calls.slice(start, end);
  };

  const getTotalPages = (calls: MaintenanceCall[]) => {
    return Math.ceil(calls.length / ITEMS_PER_PAGE);
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-full pb-20">
        {/* Header Premium */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-800/95 to-slate-900 p-8 border border-slate-700/50 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl w-20 h-20 flex items-center justify-center">
                  <AnimatedAICallIcon />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white flex flex-wrap items-center gap-0.5">
                    {titleText.split('').map((letter, index) => {
                      // Cores alternadas para criar identidade visual
                      const colors = ['#06b6d4', '#3b82f6', '#0ea5e9', '#22d3ee'];
                      const colorIndex = index % colors.length;
                      const isVowel = /[aeiouáéíóúâêôãõ]/i.test(letter);
                      
                      return (
                        <motion.span
                          key={index}
                          initial={{ 
                            opacity: 0, 
                            y: -60, 
                            rotate: -180,
                            scale: 0,
                            filter: 'blur(10px)'
                          }}
                          animate={lettersVisible[index] ? {
                            opacity: 1,
                            y: 0,
                            rotate: 0,
                            scale: [0, 1.3, 0.95, 1],
                            filter: 'blur(0px)'
                          } : {
                            opacity: 0,
                            y: -60,
                            rotate: -180,
                            scale: 0,
                            filter: 'blur(10px)'
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 25,
                            delay: index * 0.06
                          }}
                          className="inline-block relative"
                          style={{
                            display: 'inline-block',
                            transformOrigin: 'center',
                            color: isVowel ? colors[colorIndex] : colors[(colorIndex + 2) % colors.length],
                            textShadow: `0 0 10px ${colors[colorIndex]}40`,
                            fontWeight: isVowel ? 800 : 700
                          }}
                        >
                          {letter === ' ' ? '\u00A0' : letter}
                          {/* Efeito de brilho nas vogais */}
                          {isVowel && lettersVisible[index] && (
                            <motion.span
                              className="absolute inset-0"
                              animate={{
                                opacity: [0.3, 0.6, 0.3],
                                scale: [1, 1.1, 1]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut'
                              }}
                              style={{
                                background: `linear-gradient(45deg, ${colors[colorIndex]}40, transparent)`,
                                filter: 'blur(4px)',
                                zIndex: -1
                              }}
                            />
                          )}
                        </motion.span>
                      );
                    })}
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">Powered by AI • Gerencie e acompanhe todos os chamados de manutenção do sistema</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setViewMode(viewMode === 'grid' ? 'kanban' : 'grid')}
                className="flex items-center gap-2"
              >
                {viewMode === 'grid' ? (
                  <Columns className="w-4 h-4" />
                ) : (
                  <Grid3x3 className="w-4 h-4" />
                )}
                {viewMode === 'grid' ? 'Kanban' : 'Grid'}
              </Button>
              {canCreate && (
                <Button onClick={() => router.push('/calls/new')} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Chamado
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Card Explicativo sobre Tipos de Manutenção */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 relative z-10">
          <div
            className="flex items-start gap-3 p-5 cursor-pointer"
            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
          >
            <div className="p-2 bg-slate-700/50 rounded-lg border border-slate-600/50 flex-shrink-0">
              <Info className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                O que são Chamados de Manutenção?
              </h3>
              <p className="text-xs text-slate-400">
                Os Chamados são solicitações que podem ser de diferentes tipos. Clique para
                expandir/recolher.
              </p>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform ${
                isInfoExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
          <AnimatePresence>
            {isInfoExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-slate-700/50 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-red-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Wrench className="w-4 h-4 text-red-400" />
                        <strong className="text-red-300">Corretiva</strong>
                      </div>
                      <p className="text-slate-400">
                        Reparos após <strong className="text-slate-300">falhas ou problemas</strong>{' '}
                        identificados. São abertos quando há necessidade de intervenção imediata.
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <strong className="text-blue-300">
                          Preventiva, Preditiva ou Emergencial
                        </strong>
                      </div>
                      <p className="text-slate-400">
                        Chamados também podem ser criados para{' '}
                        <strong className="text-slate-300">
                          manutenções planejadas ou emergenciais
                        </strong>
                        , permitindo flexibilidade.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-400 mt-1">Total</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-blue-500/10 rounded-xl border border-blue-500/30 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.byStatus.open}</p>
            <p className="text-xs text-blue-300/70 mt-1">Abertos</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-cyan-500/10 rounded-xl border border-cyan-500/30 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-cyan-400">{stats.byStatus.analysis}</p>
            <p className="text-xs text-cyan-300/70 mt-1">Em Análise</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-purple-500/10 rounded-xl border border-purple-500/30 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <UserCheck className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400">{stats.byStatus.assigned}</p>
            <p className="text-xs text-purple-300/70 mt-1">Atribuídos</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-amber-500/10 rounded-xl border border-amber-500/30 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Play className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.byStatus.execution}</p>
            <p className="text-xs text-amber-300/70 mt-1">Em Execução</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-green-500/10 rounded-xl border border-green-500/30 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.byStatus.completed}</p>
            <p className="text-xs text-green-300/70 mt-1">Concluídos</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-500/10 rounded-xl border border-red-500/30 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.urgent}</p>
            <p className="text-xs text-red-300/70 mt-1">Urgentes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-purple-500/10 rounded-xl border border-purple-500/30 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <CalendarIcon className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400">{stats.today}</p>
            <p className="text-xs text-purple-300/70 mt-1">Hoje</p>
          </motion.div>
        </div>

        {/* Visão Operacional */}
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl p-4 border border-slate-700/50 relative z-10">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-400" />
            Visão Operacional
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {segmentOptions.map(({ value, label, description, icon: Icon }) => {
              const isActive = segment === value;
              return (
                <button
                  key={value}
                  onClick={() => setSegment(value)}
                  className={clsx(
                    'flex items-start gap-3 p-3 rounded-lg border transition-all text-left',
                    isActive
                      ? 'bg-slate-800 border-green-500/40 shadow-lg'
                      : 'bg-slate-900/40 border-slate-700/60 hover:border-slate-600/60'
                  )}
                >
                  <div
                    className={clsx(
                      'p-2 rounded-md',
                      isActive ? 'bg-green-500/20' : 'bg-slate-800/70'
                    )}
                  >
                    <Icon
                      className={clsx('w-4 h-4', isActive ? 'text-green-300' : 'text-slate-400')}
                    />
                  </div>
                  <div>
                    <p
                      className={clsx(
                        'text-sm font-semibold',
                        isActive ? 'text-white' : 'text-slate-200'
                      )}
                    >
                      {label}
                    </p>
                    <p className="text-xs text-slate-400 leading-snug">{description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Busca e Filtros Avançados */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por descrição, equipamento..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700/50"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-700/50">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                    <select
                      value={filters.status}
                      onChange={e => setFilters({ ...filters, status: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    >
                      <option value="">Todos</option>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={filters.priority}
                      onChange={e => setFilters({ ...filters, priority: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    >
                      <option value="">Todas</option>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="space-y-10 relative z-10">
            {shouldShowReactive && (
              <section className="space-y-4">
                <header className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{reactiveTitle}</h2>
                    <p className="text-xs text-slate-400">{reactiveDescription}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {reactiveCalls.length} chamado{reactiveCalls.length === 1 ? '' : 's'} em
                    exibição
                  </span>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                  <StatCard
                    icon={BarChart3}
                    label="Total"
                    value={reactiveStats.total}
                    color="text-amber-300"
                  />
                  <StatCard
                    icon={AlertCircle}
                    label="Abertos"
                    value={reactiveStats.open}
                    color="text-blue-300"
                  />
                  <StatCard
                    icon={Clock}
                    label="Em análise"
                    value={reactiveStats.analysis}
                    color="text-cyan-300"
                  />
                  <StatCard
                    icon={UserCheck}
                    label="Atribuídos"
                    value={reactiveStats.assigned}
                    color="text-purple-300"
                  />
                  <StatCard
                    icon={Play}
                    label="Em execução"
                    value={reactiveStats.execution}
                    color="text-emerald-300"
                  />
                  <StatCard
                    icon={Package}
                    label="Aguardando peças"
                    value={reactiveStats.waitingParts}
                    color="text-teal-300"
                  />
                  <StatCard
                    icon={AlertTriangle}
                    label="Urgentes"
                    value={reactiveStats.urgent}
                    color="text-red-300"
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Concluídos"
                    value={reactiveStats.completed}
                    color="text-green-300"
                  />
                </div>

                {reactiveCalls.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reactiveCalls.map((call, idx) => renderCallCard(call, idx))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Wrench}
                    message="Nenhum chamado corretivo ou emergencial encontrado"
                  />
                )}
              </section>
            )}

            {shouldShowPlanned && (
              <section className="space-y-4">
                <header className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Chamados Programados</h2>
                    <p className="text-xs text-slate-400">
                      Chamados preventivos e preditivos alinhados ao planejamento da manutenção.
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {plannedCalls.length} chamado{plannedCalls.length === 1 ? '' : 's'} em exibição
                  </span>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                  <StatCard
                    icon={BarChart3}
                    label="Total"
                    value={plannedStats.total}
                    color="text-blue-300"
                  />
                  <StatCard
                    icon={AlertCircle}
                    label="Abertos"
                    value={plannedStats.open}
                    color="text-slate-300"
                  />
                  <StatCard
                    icon={Clock}
                    label="Em análise"
                    value={plannedStats.analysis}
                    color="text-cyan-300"
                  />
                  <StatCard
                    icon={UserCheck}
                    label="Atribuídos"
                    value={plannedStats.assigned}
                    color="text-purple-300"
                  />
                  <StatCard
                    icon={Play}
                    label="Em execução"
                    value={plannedStats.execution}
                    color="text-emerald-300"
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Concluídos"
                    value={plannedStats.completed}
                    color="text-green-300"
                  />
                </div>

                {plannedCalls.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plannedCalls.map((call, idx) => renderCallCard(call, idx))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Shield}
                    message="Nenhum chamado preventivo ou preditivo encontrado"
                  />
                )}
              </section>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-4 relative z-10">
            {statusColumns.map(column => {
              const columnCalls = getCallsByStatus(column.status);
              const paginatedCalls = getPaginatedCalls(columnCalls, column.id);
              const totalPages = getTotalPages(columnCalls);
              const currentPage = kanbanPagination[column.id] || 1;
              const status = statusConfig[column.status];

              return (
                <div
                  key={column.id}
                  className={clsx(
                    'bg-slate-900/50 rounded-lg border p-3',
                    draggedOverColumn === column.status
                      ? 'border-green-500/50 shadow-lg shadow-green-500/20'
                      : 'border-slate-700/50'
                  )}
                  onDragOver={e => handleDragOver(e, column.status)}
                  onDrop={e => handleDrop(e, column.status)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(column.status)}
                      <h3 className="text-sm font-semibold text-white">{column.label}</h3>
                    </div>
                    <span
                      className={clsx(
                        'text-xs font-bold px-2 py-1 rounded-full',
                        status.bg,
                        status.color,
                        status.border
                      )}
                    >
                      {columnCalls.length}
                    </span>
                  </div>
                  <div className="space-y-2 min-h-[400px]">
                    {paginatedCalls.map(call => {
                      const typeConfig = getMaintenanceTypeConfig(call.type);
                      const priority = getPriorityConfig(call.priority);
                      const TypeIcon = typeConfig.icon;
                      const isAssignedToMe = call.assigned_to === user?.id;
                      const hasChecklist = callsWithChecklist.has(call.id);

                      return (
                        <motion.div
                          key={call.id}
                          draggable={canEdit || isAssignedToMe}
                          onDragStart={e => handleDragStart(e as unknown as ReactDragEvent, call)}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={clsx(
                            'bg-slate-800/80 rounded-lg border p-3 cursor-pointer hover:border-slate-600 transition-all relative',
                            isAssignedToMe && 'border-green-500/50 shadow-md shadow-green-500/10'
                          )}
                          onClick={() => router.push(`/calls/${call.id}`)}
                        >
                          <div
                            draggable={canEdit || isAssignedToMe}
                            onDragStart={e => handleDragStart(e as unknown as ReactDragEvent, call)}
                          >
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span
                                className={clsx(
                                  'text-xs font-medium px-2 py-0.5 rounded border flex items-center gap-1',
                                  typeConfig.color,
                                  typeConfig.bg,
                                  typeConfig.border
                                )}
                              >
                                <TypeIcon className="w-2.5 h-2.5" />
                                {typeConfig.label}
                              </span>
                              {hasChecklist && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded border flex items-center gap-1 bg-purple-500/10 text-purple-400 border-purple-500/30">
                                  <ClipboardCheck className="w-2.5 h-2.5" />
                                  Checklist
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-white mb-1 group-hover:text-green-400 transition-colors">
                              #{call.id} - {call.equipment_name || 'Equipamento'}
                            </p>
                            <p className="text-xs text-slate-400 mb-2 truncate">
                              {call.description || 'Sem descrição'}
                            </p>
                            <div className="flex items-center justify-between w-full">
                              <span
                                className={clsx(
                                  'text-xs font-medium px-2 py-0.5 rounded border',
                                  priority.color,
                                  priority.bg,
                                  priority.border
                                )}
                              >
                                {priority.label}
                              </span>
                              {call.created_at && (
                                <p className="text-xs text-slate-500">
                                  {format(new Date(call.created_at), 'dd/MM/yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                      <button
                        onClick={() =>
                          setKanbanPagination({
                            ...kanbanPagination,
                            [column.id]: Math.max(1, currentPage - 1),
                          })
                        }
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-xs text-slate-400 hover:text-white disabled:opacity-50 relative z-10 bg-slate-800 rounded border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        Anterior
                      </button>
                      <span className="text-xs text-slate-400 relative z-10 px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setKanbanPagination({
                            ...kanbanPagination,
                            [column.id]: Math.min(totalPages, currentPage + 1),
                          })
                        }
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 text-xs text-slate-400 hover:text-white disabled:opacity-50 relative z-10 bg-slate-800 rounded border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        Próximo
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {filteredCalls.length === 0 && !loading && (
          <div className="text-center py-20 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/30 border-dashed relative z-10">
            <ClipboardList className="w-16 h-16 text-slate-600 mx-auto mb-4 pointer-events-none" />
            <p className="text-slate-400 font-medium mb-1">Nenhum chamado encontrado</p>
            <p className="text-xs text-slate-500">
              {segment !== 'corrective'
                ? `Não há chamados na visão ${
                    segmentOptions.find(option => option.value === segment)?.label.toLowerCase() ||
                    ''
                  } no momento.`
                : 'Os chamados são criados quando há necessidade de manutenção em um equipamento.'}
            </p>
            {canCreate && (
              <Button
                onClick={() => router.push('/calls/new')}
                className="mt-4 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Chamado
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-slate-900/70 rounded-lg border border-slate-700/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className={clsx('w-5 h-5', color)} />
      </div>
      <p className={clsx('text-2xl font-bold', color)}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="text-center py-20 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/30 border-dashed relative z-10">
      <Icon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
      <p className="text-slate-400 font-medium mb-1">{message}</p>
      <p className="text-xs text-slate-500">
        Mantenha o monitoramento constante para agir rapidamente quando necessário.
      </p>
    </div>
  );
}
