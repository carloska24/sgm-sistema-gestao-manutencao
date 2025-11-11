'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/useToast';
import { fetchData, postData } from '@/lib/api';
import { Equipment, FrequencyType } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Save,
  Wrench,
  Package,
  Shield,
  BookOpen,
  Calendar,
  Clock,
  User,
  Info,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Brain,
  Sparkles,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Star,
  Globe,
} from 'lucide-react';

const STEPS = [
  {
    id: 1,
    title: 'Informações Básicas',
    icon: Info,
    description: 'Nome e equipamento',
  },
  {
    id: 2,
    title: 'Frequência',
    icon: Clock,
    description: 'Periodicidade da manutenção',
  },
  {
    id: 3,
    title: 'Período',
    icon: Calendar,
    description: 'Datas de início e término',
  },
  {
    id: 4,
    title: 'Detalhes',
    icon: BookOpen,
    description: 'Instruções e duração',
  },
  {
    id: 5,
    title: 'Recursos',
    icon: Package,
    description: 'Ferramentas e materiais',
  },
  {
    id: 6,
    title: 'Segurança',
    icon: Shield,
    description: 'Procedimentos de segurança',
  },
];

// Componente de Assistente IA para Gerar Instruções de Manutenção
function AIMaintenanceInstructionsAssistant({
  equipment,
  onGenerateInstructions,
  isLoading,
}: {
  equipment: Equipment | null;
  onGenerateInstructions: (instructions: string) => void;
  isLoading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { success, error: showError } = useToast();

  const handleGenerate = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!equipment) {
      showError('Selecione um equipamento primeiro');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/plans/ai-generate-instructions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          equipment_id: equipment.id,
          equipment_name: equipment.name,
          equipment_code: equipment.code,
          equipment_description: equipment.description,
          manufacturer: equipment.manufacturer,
          model: equipment.model,
          search_query: searchQuery.trim() || undefined,
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao gerar instruções');
      }

      if (result.data && result.data.instructions) {
        onGenerateInstructions(result.data.instructions);
        success('Instruções geradas com sucesso! Revise e ajuste conforme necessário.');
        setIsOpen(false);
        setSearchQuery('');
      } else {
        throw new Error('Nenhuma instrução foi gerada');
      }
    } catch (err) {
      console.error(err);
      showError('Não foi possível gerar instruções automaticamente. Você pode inserir manualmente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!equipment}
        className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-pink-500/20 border-yellow-500/30 hover:from-yellow-500/30 hover:to-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="relative">
          <Brain className="w-4 h-4 text-yellow-400" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <Globe className="w-4 h-4 text-pink-400" />
        Gerar com IA
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 w-[500px] bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-xl border border-yellow-500/30 shadow-2xl p-5 z-50"
          >
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700/50">
              <div className="p-2.5 bg-gradient-to-br from-yellow-500/30 to-pink-500/30 rounded-lg border border-yellow-500/40">
                <Brain className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  Assistente Inteligente de Manutenção
                  <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30">
                    AI + Web
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Busca informações na web e gera instruções de manutenção automaticamente
                </p>
              </div>
            </div>

            {equipment && (
              <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Equipamento selecionado:</p>
                <p className="text-sm font-semibold text-white">{equipment.name}</p>
                {equipment.manufacturer && (
                  <p className="text-xs text-slate-400 mt-1">Fabricante: {equipment.manufacturer}</p>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Busca personalizada (opcional)
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: manutenção preventiva compressor de ar"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">
                Deixe vazio para busca automática baseada no equipamento
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={!equipment || isGenerating}
                isLoading={isGenerating}
                className="flex-1 flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-pink-500/20 border-yellow-500/30 hover:from-yellow-500/30 hover:to-pink-500/30"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando e gerando...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <Sparkles className="w-4 h-4" />
                    Gerar Instruções
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all border border-slate-700/0 hover:border-slate-700/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-xs text-yellow-300 flex items-start gap-2">
                <Star className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Como funciona:</strong> A IA busca informações na web sobre o equipamento selecionado e gera instruções de manutenção preventiva profissionais. Se não encontrar informações suficientes, você pode inserir manualmente.
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente de Assistente IA para Gerar Recursos (Ferramentas e Materiais)
function AIResourcesAssistant({
  equipment,
  instructions,
  onGenerateResources,
  isLoading,
}: {
  equipment: Equipment | null;
  instructions: string;
  onGenerateResources: (tools: string, materials: string) => void;
  isLoading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { success, error: showError } = useToast();

  const handleGenerate = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!equipment) {
      showError('Selecione um equipamento primeiro');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/plans/ai-generate-resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          equipment_id: equipment.id,
          equipment_name: equipment.name,
          equipment_code: equipment.code,
          manufacturer: equipment.manufacturer,
          model: equipment.model,
          instructions: instructions || undefined,
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao gerar recursos');
      }

      console.log('📦 [DEBUG] Resposta completa da API:', result);
      console.log('🔧 [DEBUG] Ferramentas recebidas:', result.data?.tools_required);
      console.log('📦 [DEBUG] Materiais recebidos:', result.data?.materials_required);

      if (result.data) {
        const tools = result.data.tools_required || '';
        const materials = result.data.materials_required || '';
        
        console.log('✅ [DEBUG] Preenchendo campos - Ferramentas:', tools, 'Materiais:', materials);
        
        // Garantir que ambos os campos sejam preenchidos
        if (tools && materials) {
          onGenerateResources(tools, materials);
          success(`Recursos gerados com sucesso! ${tools ? 'Ferramentas' : ''}${tools && materials ? ' e ' : ''}${materials ? 'Materiais' : ''} preenchidos. Revise e ajuste conforme necessário.`);
        } else if (tools || materials) {
          // Se apenas um foi gerado, ainda preencher ambos
          onGenerateResources(tools, materials);
          success('Recursos gerados com sucesso! Revise e ajuste conforme necessário.');
        } else {
          throw new Error('Nenhum recurso foi gerado');
        }
        setIsOpen(false);
      } else {
        throw new Error('Nenhum recurso foi gerado');
      }
    } catch (err) {
      console.error(err);
      showError('Não foi possível gerar recursos automaticamente. Você pode inserir manualmente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!equipment}
        className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500/30 hover:from-orange-500/30 hover:to-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="relative">
          <Brain className="w-4 h-4 text-orange-400" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <Sparkles className="w-4 h-4 text-amber-400" />
        Gerar com IA
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 w-[500px] bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-xl border border-orange-500/30 shadow-2xl p-5 z-50"
          >
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700/50">
              <div className="p-2.5 bg-gradient-to-br from-orange-500/30 to-amber-500/30 rounded-lg border border-orange-500/40">
                <Brain className="w-6 h-6 text-orange-300 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  Assistente de Recursos
                  <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30">
                    AI
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gera automaticamente <strong className="text-orange-400">ferramentas</strong> e <strong className="text-amber-400">materiais</strong> necessários baseado no equipamento
                </p>
              </div>
            </div>

            {equipment && (
              <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Equipamento:</p>
                <p className="text-sm font-semibold text-white">{equipment.name}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={!equipment || isGenerating}
                isLoading={isGenerating}
                className="flex-1 flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500/30 hover:from-orange-500/30 hover:to-amber-500/30"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Recursos
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all border border-slate-700/0 hover:border-slate-700/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <p className="text-xs text-orange-300 flex items-start gap-2">
                <Star className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Como funciona:</strong> A IA analisa o equipamento e as instruções de manutenção para gerar automaticamente <strong>ferramentas</strong> e <strong>materiais</strong> necessários. Ambos os campos serão preenchidos simultaneamente.
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente de Assistente IA para Gerar Procedimentos de Segurança
function AISafetyProceduresAssistant({
  equipment,
  instructions,
  onGenerateSafety,
  isLoading,
}: {
  equipment: Equipment | null;
  instructions: string;
  onGenerateSafety: (safetyProcedures: string) => void;
  isLoading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { success, error: showError } = useToast();

  const handleGenerate = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!equipment) {
      showError('Selecione um equipamento primeiro');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/plans/ai-generate-safety`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          equipment_id: equipment.id,
          equipment_name: equipment.name,
          equipment_code: equipment.code,
          manufacturer: equipment.manufacturer,
          model: equipment.model,
          instructions: instructions || undefined,
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao gerar procedimentos de segurança');
      }

      if (result.data && result.data.safety_procedures) {
        onGenerateSafety(result.data.safety_procedures);
        success('Procedimentos de segurança gerados com sucesso! Revise e ajuste conforme necessário.');
        setIsOpen(false);
      } else {
        throw new Error('Nenhum procedimento foi gerado');
      }
    } catch (err) {
      console.error(err);
      showError('Não foi possível gerar procedimentos automaticamente. Você pode inserir manualmente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!equipment}
        className="flex items-center gap-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30 hover:from-red-500/30 hover:to-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="relative">
          <Brain className="w-4 h-4 text-red-400" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <Shield className="w-4 h-4 text-orange-400" />
        Gerar com IA
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 w-[500px] bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-xl border border-red-500/30 shadow-2xl p-5 z-50"
          >
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700/50">
              <div className="p-2.5 bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-lg border border-red-500/40">
                <Brain className="w-6 h-6 text-red-300 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  Assistente de Segurança
                  <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30">
                    AI
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gera procedimentos de segurança específicos para o equipamento
                </p>
              </div>
            </div>

            {equipment && (
              <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Equipamento:</p>
                <p className="text-sm font-semibold text-white">{equipment.name}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={!equipment || isGenerating}
                isLoading={isGenerating}
                className="flex-1 flex items-center gap-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30 hover:from-red-500/30 hover:to-orange-500/30"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <Sparkles className="w-4 h-4" />
                    Gerar Procedimentos
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all border border-slate-700/0 hover:border-slate-700/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-xs text-red-300 flex items-start gap-2">
                <Star className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Como funciona:</strong> A IA analisa o equipamento e gera procedimentos de segurança específicos, incluindo EPIs necessários, riscos e medidas de proteção.
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NewPlanPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    equipment_id: '',
    frequency_type: 'months' as FrequencyType,
    frequency_value: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    instructions: '',
    estimated_duration: '',
    tools_required: '',
    materials_required: '',
    safety_procedures: '',
    manual_reference: '',
    assigned_to: '',
  });

  useEffect(() => {
    loadEquipment();
    loadTechnicians();
  }, []);

  const loadEquipment = async () => {
    try {
      const response = await fetchData<Equipment[]>('/equipment?limit=1000');
      const equipment = Array.isArray(response) ? response : [];
      setEquipmentList(equipment.filter((eq) => eq.status === 'active'));
    } catch (err) {
      console.error('Erro ao carregar equipamentos:', err);
      setEquipmentList([]);
      showError('Erro ao carregar equipamentos');
    }
  };

  const loadTechnicians = async () => {
    try {
      const data = await fetchData<any[]>('/users/technicians');
      setTechnicians(data);
    } catch (err) {
      console.error('Erro ao carregar técnicos:', err);
    }
  };

  const selectedEquipment = equipmentList.find(
    (eq) => eq.id.toString() === formData.equipment_id
  );

  const getFrequencyLabel = (type: string, value: number) => {
    const labels: Record<string, string> = {
      days: `A cada ${value} dia(s)`,
      weeks: `A cada ${value} semana(s)`,
      months: `A cada ${value} mês(es)`,
      hours: `A cada ${value} hora(s)`,
      cycles: `A cada ${value} ciclo(s)`,
    };
    return labels[type] || type;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Nome do plano é obrigatório';
      if (!formData.equipment_id) newErrors.equipment_id = 'Selecione um equipamento';
    }

    if (step === 2) {
      if (!formData.frequency_value || formData.frequency_value < 1) {
        newErrors.frequency_value = 'Valor da frequência deve ser maior que zero';
      }
    }

    if (step === 3) {
      if (!formData.start_date) newErrors.start_date = 'Data de início é obrigatória';
      if (formData.end_date && formData.end_date < formData.start_date) {
        newErrors.end_date = 'Data de término deve ser posterior à data de início';
      }
    }

    // Passos 4, 5 e 6 não têm validação obrigatória (campos opcionais)
    // Mas ainda precisamos limpar erros anteriores se houver

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Garantir que só submete se estiver no último passo
    if (currentStep !== STEPS.length) {
      console.warn('Tentativa de submit antes do último passo. Avançando para próximo passo.');
      handleNext();
      return;
    }

    if (!validateStep(currentStep)) {
      showError('Por favor, corrija os erros antes de continuar.');
      return;
    }

    setLoading(true);

    try {
      const data = {
        ...formData,
        equipment_id: parseInt(formData.equipment_id),
        frequency_value: parseInt(formData.frequency_value.toString()),
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
        tools_required: formData.tools_required || null,
        materials_required: formData.materials_required || null,
        safety_procedures: formData.safety_procedures || null,
        manual_reference: formData.manual_reference || null,
        end_date: formData.end_date || null,
      };

      console.log('📤 [DEBUG] Enviando dados do plano:', data);
      await postData('/plans', data);
      success('Plano criado com sucesso!');
      router.push('/plans');
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao criar plano:', err);
      const message = err instanceof Error ? err.message : 'Erro ao criar plano';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleGenerateInstructions = (instructions: string) => {
    handleChange('instructions', instructions);
  };

  const handleGenerateResources = (tools: string, materials: string) => {
    console.log('🔄 [DEBUG] handleGenerateResources chamado - Ferramentas:', tools, 'Materiais:', materials);
    console.log('🔄 [DEBUG] Tipo de ferramentas:', typeof tools, 'Tipo de materiais:', typeof materials);
    console.log('🔄 [DEBUG] Ferramentas vazias?', !tools || tools.trim() === '');
    console.log('🔄 [DEBUG] Materiais vazios?', !materials || materials.trim() === '');
    
    // Sempre atualizar ambos os campos simultaneamente em uma única atualização de estado
    // Usar string vazia como fallback se for undefined/null
    const toolsValue = tools !== undefined && tools !== null ? tools : '';
    const materialsValue = materials !== undefined && materials !== null ? materials : '';
    
    console.log('🔄 [DEBUG] Valores finais antes de atualizar - Ferramentas:', toolsValue, 'Materiais:', materialsValue);
    
    // Atualizar ambos os campos em uma única operação para evitar problemas de batch do React
    setFormData(prev => {
      const updated = {
        ...prev,
        tools_required: toolsValue,
        materials_required: materialsValue,
      };
      console.log('✅ [DEBUG] Estado atualizado - tools_required:', updated.tools_required, 'materials_required:', updated.materials_required);
      return updated;
    });
    
    // Limpar erros se houver
    if (errors.tools_required) {
      setErrors(prev => ({ ...prev, tools_required: '' }));
    }
    if (errors.materials_required) {
      setErrors(prev => ({ ...prev, materials_required: '' }));
    }
    
    console.log('✅ [DEBUG] Ambos os campos atualizados simultaneamente');
  };

  const handleGenerateSafety = (safetyProcedures: string) => {
    handleChange('safety_procedures', safetyProcedures);
  };

  const progress = (currentStep / STEPS.length) * 100;
  const currentStepData = STEPS.find(s => s.id === currentStep);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => router.back()}
            className="flex items-center gap-2"
            title="Voltar"
          >
            Cancelar
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2 font-poppins">
              Novo Plano Preventivo
            </h1>
            <p className="text-slate-400">
              Crie um plano de manutenção preventiva
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {currentStepData && (
                <>
                  {(() => {
                    const Icon = currentStepData.icon;
                    return <Icon className="w-5 h-5 text-green-400" />;
                  })()}
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {currentStepData.title}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {currentStepData.description}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="text-sm text-slate-400">
              Passo <span className="text-white font-semibold">{currentStep}</span> de{' '}
              <span className="text-white font-semibold">{STEPS.length}</span>
            </div>
          </div>
          
          <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
            <motion.div
              className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-green-500/20 text-green-400 border-2 border-green-500'
                          : 'bg-slate-800 text-slate-500 border-2 border-slate-700'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 text-center ${
                        isCurrent ? 'text-white font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        step.id < currentStep ? 'bg-green-500' : 'bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form 
          onSubmit={(e) => {
            // Proteção extra: garantir que o submit só acontece no último passo
            if (currentStep !== STEPS.length) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
            handleSubmit(e);
          }}
          onKeyDown={(e) => {
            // Prevenir submit do formulário ao pressionar Enter em campos de texto/textarea
            // exceto no último passo onde queremos permitir submit apenas no botão
            if (e.key === 'Enter') {
              const target = e.target as HTMLElement;
              
              // Se não for um textarea e não estiver no último passo, prevenir
              if (target.tagName !== 'TEXTAREA' && currentStep < STEPS.length) {
                e.preventDefault();
                e.stopPropagation();
              }
              
              // Se estiver no último passo mas não for o botão de submit, prevenir
              if (currentStep === STEPS.length && target.tagName !== 'BUTTON') {
                e.preventDefault();
                e.stopPropagation();
              }
            }
          }}
          onClick={(e) => {
            // Prevenir submit acidental ao clicar em elementos que não são botões
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
              e.stopPropagation();
            }
          }}
        >
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Informações Básicas */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Info className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Informações Básicas
                      </h2>
                      <p className="text-sm text-slate-400">
                        Nome do plano e equipamento associado
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Nome do Plano *"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                      disabled={loading}
                      error={errors.name}
                      placeholder="Ex: Manutenção Mensal Compressor"
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Equipamento * {errors.equipment_id && (
                          <span className="text-red-400 text-xs ml-2">{errors.equipment_id}</span>
                        )}
                      </label>
                      <select
                        value={formData.equipment_id}
                        onChange={(e) => handleChange('equipment_id', e.target.value)}
                        required
                        disabled={loading}
                        className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors.equipment_id ? 'border-red-500' : 'border-slate-700'
                        }`}
                      >
                        <option value="">Selecione um equipamento</option>
                        {equipmentList && equipmentList.length > 0 ? (
                          equipmentList.map((eq) => (
                            <option key={eq.id} value={eq.id}>
                              {eq.code} - {eq.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>Carregando equipamentos...</option>
                        )}
                      </select>
                    </div>

                    {/* Preview do Equipamento */}
                    <AnimatePresence>
                      {selectedEquipment && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-sm font-semibold text-green-400">
                                  {selectedEquipment.code}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className="text-white font-medium">
                                  {selectedEquipment.name}
                                </span>
                              </div>
                              {selectedEquipment.location && (
                                <p className="text-sm text-slate-400">
                                  📍 {selectedEquipment.location}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => router.push(`/equipment/${selectedEquipment.id}`)}
                              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                              title="Ver detalhes"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Frequência */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Clock className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Frequência da Manutenção
                      </h2>
                      <p className="text-sm text-slate-400">
                        Defina a periodicidade das manutenções preventivas
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Tipo de Frequência *
                      </label>
                      <select
                        value={formData.frequency_type}
                        onChange={(e) => handleChange('frequency_type', e.target.value as FrequencyType)}
                        required
                        disabled={loading}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="days">Dias</option>
                        <option value="weeks">Semanas</option>
                        <option value="months">Meses</option>
                        <option value="hours">Horas</option>
                        <option value="cycles">Ciclos</option>
                      </select>
                    </div>
                    <div>
                      <Input
                        label="Valor da Frequência *"
                        type="number"
                        min="1"
                        value={formData.frequency_value}
                        onChange={(e) => handleChange('frequency_value', parseInt(e.target.value) || 1)}
                        required
                        disabled={loading}
                        error={errors.frequency_value}
                      />
                    </div>
                  </div>

                  {/* Preview da Frequência */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-white">
                          Frequência configurada:
                        </p>
                        <p className="text-lg font-bold text-green-400">
                          {getFrequencyLabel(formData.frequency_type, formData.frequency_value)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Período */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <Calendar className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Período de Vigência
                      </h2>
                      <p className="text-sm text-slate-400">
                        Defina quando o plano começa e termina
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Data de Início *"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleChange('start_date', e.target.value)}
                      required
                      disabled={loading}
                      error={errors.start_date}
                    />
                    <Input
                      label="Data de Término (opcional)"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleChange('end_date', e.target.value)}
                      disabled={loading}
                      error={errors.end_date}
                      min={formData.start_date}
                    />
                  </div>

                  {formData.end_date && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-sm text-blue-400">
                        O plano estará ativo de {new Date(formData.start_date).toLocaleDateString('pt-BR')} até {new Date(formData.end_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Detalhes */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <BookOpen className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Detalhes da Manutenção
                      </h2>
                      <p className="text-sm text-slate-400">
                        Instruções, duração e técnico responsável
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-300">
                          Instruções de Manutenção
                        </label>
                        <AIMaintenanceInstructionsAssistant
                          equipment={selectedEquipment || null}
                          onGenerateInstructions={handleGenerateInstructions}
                          isLoading={loading}
                        />
                      </div>
                      <textarea
                        value={formData.instructions}
                        onChange={(e) => handleChange('instructions', e.target.value)}
                        rows={6}
                        disabled={loading}
                        placeholder="Descreva os passos e procedimentos da manutenção preventiva de forma detalhada..."
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Duração Estimada (minutos)"
                        type="number"
                        min="1"
                        value={formData.estimated_duration}
                        onChange={(e) => handleChange('estimated_duration', e.target.value)}
                        disabled={loading}
                        placeholder="Ex: 60"
                      />
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Técnico Responsável
                        </label>
                        <select
                          value={formData.assigned_to}
                          onChange={(e) => handleChange('assigned_to', e.target.value)}
                          disabled={loading}
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Não atribuído</option>
                          {technicians.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.full_name || tech.username}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Recursos */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                      <Package className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Recursos Necessários
                      </h2>
                      <p className="text-sm text-slate-400">
                        Ferramentas e materiais necessários para a manutenção
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          Ferramentas Necessárias
                        </label>
                        <AIResourcesAssistant
                          equipment={selectedEquipment || null}
                          instructions={formData.instructions}
                          onGenerateResources={handleGenerateResources}
                          isLoading={loading}
                        />
                      </div>
                      <textarea
                        value={formData.tools_required}
                        onChange={(e) => handleChange('tools_required', e.target.value)}
                        rows={4}
                        disabled={loading}
                        placeholder="Ex: Chave de fenda, Multímetro, Alicate, Chave inglesa..."
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Materiais Necessários
                      </label>
                      <textarea
                        value={formData.materials_required}
                        onChange={(e) => handleChange('materials_required', e.target.value)}
                        rows={4}
                        disabled={loading}
                        placeholder="Ex: Óleo hidráulico 5L, Filtro de ar, Veda rosca, Lubrificante..."
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 6: Segurança */}
              {currentStep === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <Shield className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Segurança e Documentação
                      </h2>
                      <p className="text-sm text-slate-400">
                        Procedimentos de segurança e referências
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-red-400" />
                          ⚠️ Procedimentos de Segurança
                        </label>
                        <AISafetyProceduresAssistant
                          equipment={selectedEquipment || null}
                          instructions={formData.instructions}
                          onGenerateSafety={handleGenerateSafety}
                          isLoading={loading}
                        />
                      </div>
                      <textarea
                        value={formData.safety_procedures}
                        onChange={(e) => handleChange('safety_procedures', e.target.value)}
                        onKeyDown={(e) => {
                          // Permitir Enter em textarea, mas prevenir Ctrl+Enter que pode causar submit
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                          }
                        }}
                        rows={5}
                        disabled={loading}
                        placeholder="Ex: Desligar equipamento antes de iniciar. Usar EPI completo. Verificar bloqueio de energia. Isolar área de trabalho..."
                        className="w-full px-4 py-3 bg-slate-800 border border-red-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      />
                      <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Informações críticas de segurança que devem ser seguidas obrigatoriamente
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Referência do Manual
                      </label>
                      <Input
                        value={formData.manual_reference}
                        onChange={(e) => handleChange('manual_reference', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                        disabled={loading}
                        placeholder="Ex: Manual do Compressor - Página 45-50, Seção 3.2"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Referência específica no manual do equipamento (se aplicável)
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-700">
              <Button
                type="button"
                variant="secondary"
                onClick={currentStep === 1 ? () => router.back() : handlePrevious}
                disabled={loading}
              >
                {currentStep === 1 ? 'Cancelar' : 'Anterior'}
              </Button>

              <div className="flex items-center gap-3">
                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNext}
                    disabled={loading}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Criando...' : 'Criar Plano'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
