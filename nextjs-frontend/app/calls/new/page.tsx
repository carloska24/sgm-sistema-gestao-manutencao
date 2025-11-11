'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/useToast';
import { fetchData, postData } from '@/lib/api';
import { Equipment } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { clsx } from 'clsx';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Wrench,
  Clock,
  AlertTriangle,
  Info,
  FileText,
  Calendar,
  Zap,
  ExternalLink,
  MapPin,
  Camera,
  X,
  Shield,
  TrendingUp,
} from 'lucide-react';

export default function NewCallPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [formData, setFormData] = useState({
    equipment_id: '',
    type: 'corrective' as 'preventive' | 'corrective' | 'predictive' | 'emergency',
    problem_type: '',
    description: '',
    occurrence_date: new Date().toISOString().slice(0, 16),
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  useEffect(() => {
    loadEquipment();
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

  const selectedEquipment = equipmentList.find(
    (eq) => eq.id.toString() === formData.equipment_id
  );

  const getPriorityConfig = (priority: string) => {
    const configs = {
      low: {
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: Info,
        label: 'Baixa',
        description: 'Pode ser resolvido em até 7 dias',
      },
      medium: {
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        icon: Clock,
        label: 'Média',
        description: 'Deve ser resolvido em até 3 dias',
      },
      high: {
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        icon: AlertTriangle,
        label: 'Alta',
        description: 'Deve ser resolvido em até 24 horas',
      },
      urgent: {
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: Zap,
        label: 'Urgente',
        description: 'Requer atenção imediata',
      },
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  const problemTypes = [
    'Falha elétrica',
    'Vazamento',
    'Ruído anormal',
    'Quebra mecânica',
    'Superaquecimento',
    'Não liga',
    'Parada inesperada',
    'Outro',
  ];

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
      const validFiles = imageFiles.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          showError(`Arquivo ${file.name} excede 10MB`);
          return false;
        }
        return true;
      });

      setPhotos((prev) => [...prev, ...validFiles]);
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (callId: number) => {
    if (photos.length === 0) return;

    setUploadingPhotos(true);
    try {
      for (const photo of photos) {
        const formData = new FormData();
        formData.append('file', photo);
        formData.append('document_type', 'photo');
        formData.append('phase', 'during'); // Fotos durante o problema

        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/calls/${callId}/documents`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao fazer upload de foto');
        }
      }
    } catch (err) {
      console.error('Erro ao fazer upload de fotos:', err);
      throw err;
    } finally {
      setUploadingPhotos(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.equipment_id) {
      newErrors.equipment_id = 'Selecione um equipamento';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Descrição deve ter pelo menos 10 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);

    try {
      const data = {
        ...formData,
        equipment_id: parseInt(formData.equipment_id),
      };

      const result = await postData('/calls', data);
      const callId = (result as any)?.id || (result as any)?.data?.id;

      // Upload das fotos após criar o chamado
      if (photos.length > 0 && callId) {
        await uploadPhotos(callId);
      }

      success('Chamado criado com sucesso!');
      router.push('/calls');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar chamado';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const descriptionLength = formData.description.length;
  const priorityConfig = getPriorityConfig(formData.priority);
  const PriorityIcon = priorityConfig.icon;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2 font-poppins">
              Novo Chamado
            </h1>
            <p className="text-slate-400">
              Abra um chamado de manutenção corretiva
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Equipamento Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Wrench className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Equipamento Afetado
                  </h2>
                  <p className="text-sm text-slate-400">
                    Selecione o equipamento que apresenta o problema
                  </p>
                </div>
              </div>

              <div className="space-y-4">
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

                {/* Preview do Equipamento Selecionado */}
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
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <MapPin className="w-4 h-4" />
                              {selectedEquipment.location}
                            </div>
                          )}
                          {selectedEquipment.criticality && (
                            <div className="mt-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  selectedEquipment.criticality === 'high'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : selectedEquipment.criticality === 'medium'
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                Criticidade: {selectedEquipment.criticality === 'high' ? 'Alta' : selectedEquipment.criticality === 'medium' ? 'Média' : 'Baixa'}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push(`/equipment/${selectedEquipment.id}`)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                          title="Ver detalhes do equipamento"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Descrição do Problema Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Descrição do Problema
                  </h2>
                  <p className="text-sm text-slate-400">
                    Descreva o problema encontrado com detalhes
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de Problema
                  </label>
                  <select
                    value={formData.problem_type}
                    onChange={(e) => handleChange('problem_type', e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Selecione ou descreva abaixo</option>
                    {problemTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Descrição Detalhada * {errors.description && (
                        <span className="text-red-400 text-xs ml-2">{errors.description}</span>
                      )}
                    </label>
                    <span
                      className={`text-xs ${
                        descriptionLength < 10
                          ? 'text-red-400'
                          : descriptionLength < 50
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {descriptionLength} caracteres
                      {descriptionLength < 10 && ' (mín. 10)'}
                    </span>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    required
                    rows={6}
                    disabled={loading}
                    placeholder="Descreva o problema encontrado com o máximo de detalhes possível. Inclua informações como: quando começou, sintomas observados, se já ocorreu antes, condições de operação no momento do problema, etc."
                    className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${
                      errors.description ? 'border-red-500' : 'border-slate-700'
                    }`}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Quanto mais detalhes, mais rápido será o diagnóstico
                  </p>
                </div>

                {/* Upload de Fotos */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                      <Camera className="w-4 h-4 text-blue-400" />
                    </div>
                    Fotos do Problema (Opcional)
                  </label>
                  <p className="text-xs text-slate-400 mb-4 ml-8">
                    Adicione fotos mostrando o estado atual da máquina para facilitar o diagnóstico
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoSelect}
                        disabled={loading || uploadingPhotos}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg text-slate-200 hover:text-white hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-500/50 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/20"
                      >
                        <Camera className="w-5 h-5" />
                        <span className="font-medium">Tirar Foto ou Selecionar</span>
                      </label>
                    </div>

                    {photoPreviews.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                        {photoPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border-2 border-slate-700 hover:border-blue-500/50 transition-colors">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                              title="Remover foto"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-xs text-white font-medium">Foto {index + 1}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tipo de Manutenção Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-500/20 rounded-lg">
                  <Wrench className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Tipo de Manutenção
                  </h2>
                  <p className="text-sm text-slate-400">
                    Selecione o tipo de manutenção deste chamado
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'preventive', label: 'Preventiva', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
                  { value: 'corrective', label: 'Corretiva', icon: Wrench, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
                  { value: 'predictive', label: 'Preditiva', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
                  { value: 'emergency', label: 'Emergencial', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
                ].map((type) => {
                  const TypeIcon = type.icon;
                  const isActive = formData.type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleChange('type', type.value)}
                      disabled={loading}
                      className={clsx(
                        'p-4 rounded-xl border transition-all text-left',
                        isActive
                          ? `${type.bg} ${type.border} border-2 shadow-lg`
                          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={clsx(
                          'p-2 rounded-lg',
                          isActive ? type.bg : 'bg-slate-700/50'
                        )}>
                          <TypeIcon className={clsx('w-5 h-5', isActive ? type.color : 'text-slate-400')} />
                        </div>
                        <span className={clsx(
                          'font-semibold text-sm',
                          isActive ? 'text-white' : 'text-slate-300'
                        )}>
                          {type.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Data e Prioridade Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Data e Prioridade
                  </h2>
                  <p className="text-sm text-slate-400">
                    Quando ocorreu e qual a urgência
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data e Hora da Ocorrência
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.occurrence_date}
                    onChange={(e) => handleChange('occurrence_date', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Urgência Sugerida *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value as any)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                  
                  {/* Preview da Prioridade */}
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-3 p-3 rounded-lg border ${priorityConfig.color} flex items-start gap-3`}
                    >
                      <PriorityIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">{priorityConfig.label}</p>
                        <p className="text-xs opacity-80">{priorityConfig.description}</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Aviso Informativo */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-400 font-medium mb-1">
                  Importante
                </p>
                <p className="text-sm text-yellow-300">
                  Seja o mais detalhado possível na descrição do problema. Isso ajudará os técnicos a diagnosticar e resolver mais rapidamente. Inclua informações sobre sintomas, quando começou, frequência e condições de operação.
                </p>
              </div>
            </motion.div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || uploadingPhotos}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading || uploadingPhotos ? (uploadingPhotos ? 'Enviando fotos...' : 'Criando...') : 'Criar Chamado'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
