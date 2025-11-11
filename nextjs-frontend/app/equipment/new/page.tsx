'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/useToast';
import { postData } from '@/lib/api';
import { Equipment } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  FileText,
  Info,
  Package,
  MapPin,
  Settings,
  Camera,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';

const STEPS = [
  {
    id: 1,
    title: 'Informações Básicas',
    icon: Info,
    description: 'Dados principais do equipamento',
  },
  {
    id: 2,
    title: 'Fabricante',
    icon: Package,
    description: 'Informações do fabricante',
  },
  {
    id: 3,
    title: 'Aquisição',
    icon: Settings,
    description: 'Data e custo de aquisição',
  },
  {
    id: 4,
    title: 'Localização',
    icon: MapPin,
    description: 'Status e localização',
  },
  {
    id: 5,
    title: 'Técnicas',
    icon: Settings,
    description: 'Características técnicas',
  },
  {
    id: 6,
    title: 'Documentos',
    icon: Camera,
    description: 'Fotos e manual',
  },
];

export default function NewEquipmentPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [manual, setManual] = useState<File | null>(null);
  const [manualName, setManualName] = useState<string>('');
  const [uploadingManual, setUploadingManual] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    model: '',
    manufacturer: '',
    serial_number: '',
    acquisition_date: '',
    acquisition_cost: '',
    location: '',
    status: 'active',
    criticality: 'medium',
    power: '',
    capacity: '',
    voltage: '',
    fuel_type: '',
    dimensions: '',
  });

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
      if (!formData.code.trim()) newErrors.code = 'Código é obrigatório';
    }

    if (step === 4) {
      if (!formData.status) newErrors.status = 'Status é obrigatório';
      if (!formData.criticality) newErrors.criticality = 'Criticidade é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
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

  const uploadPhotos = async (equipmentId: number) => {
    if (photos.length === 0) return;
    setUploadingPhotos(true);
    try {
      for (const photo of photos) {
        const formData = new FormData();
        formData.append('file', photo);
        formData.append('document_type', 'photo');
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/equipment/${equipmentId}/documents`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
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

  const handleManualSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        showError('Apenas arquivos PDF são permitidos para o manual');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        showError('O arquivo do manual excede 50MB');
        return;
      }
      setManual(file);
      setManualName(file.name);
    }
  };

  const removeManual = () => {
    setManual(null);
    setManualName('');
  };

  const uploadManual = async (equipmentId: number) => {
    if (!manual) return;
    setUploadingManual(true);
    try {
      const formData = new FormData();
      formData.append('file', manual);
      formData.append('document_type', 'manual');
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/equipment/${equipmentId}/documents`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer upload do manual');
      }
    } catch (err) {
      console.error('Erro ao fazer upload do manual:', err);
      throw err;
    } finally {
      setUploadingManual(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const data = {
        ...formData,
        acquisition_cost: formData.acquisition_cost ? parseFloat(formData.acquisition_cost) : undefined,
      };

      const result = await postData<Equipment>('/equipment', data);
      
      if (result?.id) {
        let uploadMessages: string[] = [];
        
        if (photos.length > 0) {
          try {
            await uploadPhotos(result.id);
            uploadMessages.push(`${photos.length} foto(s) enviada(s)`);
          } catch (photoErr) {
            console.error('Erro ao fazer upload de fotos:', photoErr);
            uploadMessages.push('Erro ao enviar algumas fotos');
          }
        }
        
        if (manual) {
          try {
            await uploadManual(result.id);
            uploadMessages.push('Manual enviado');
          } catch (manualErr) {
            console.error('Erro ao fazer upload do manual:', manualErr);
            uploadMessages.push('Erro ao enviar o manual');
          }
        }
        
        if (uploadMessages.length > 0) {
          success(`Equipamento criado com sucesso! ${uploadMessages.join(', ')}.`);
        } else {
          success('Equipamento criado com sucesso!');
        }
      
        router.push('/equipment');
      } else {
        success('Equipamento criado com sucesso!');
        router.push('/equipment');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar equipamento';
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

  const progress = (currentStep / STEPS.length) * 100;
  const currentStepData = STEPS.find(s => s.id === currentStep);

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
              Novo Equipamento
            </h1>
            <p className="text-slate-400">
              Cadastre um novo equipamento no sistema
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
        <form onSubmit={handleSubmit}>
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
                        Dados principais para identificação do equipamento
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Nome do Equipamento *"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                        disabled={loading}
                        error={errors.name}
                        placeholder="Ex: Compressor de Ar Parafuso"
                      />
                    </div>
                    <div>
                      <Input
                        label="Código de Identificação *"
                        value={formData.code}
                        onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                        required
                        disabled={loading}
                        error={errors.code}
                        placeholder="PAT-001"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Descrição
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={loading}
                        placeholder="Descreva o equipamento, sua função e características principais..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Informações do Fabricante */}
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
                      <Package className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Informações do Fabricante
                      </h2>
                      <p className="text-sm text-slate-400">
                        Dados do fabricante e modelo do equipamento
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Fabricante"
                      value={formData.manufacturer}
                      onChange={(e) => handleChange('manufacturer', e.target.value)}
                      disabled={loading}
                      placeholder="Ex: Atlas Copco"
                    />
                    <Input
                      label="Modelo"
                      value={formData.model}
                      onChange={(e) => handleChange('model', e.target.value)}
                      disabled={loading}
                      placeholder="Ex: GA 37 VSD"
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Número de Série"
                        value={formData.serial_number}
                        onChange={(e) => handleChange('serial_number', e.target.value)}
                        disabled={loading}
                        placeholder="Ex: SN123456789"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Informações de Aquisição */}
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
                      <Settings className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Informações de Aquisição
                      </h2>
                      <p className="text-sm text-slate-400">
                        Data e custo de aquisição do equipamento
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Data de Aquisição"
                      type="date"
                      value={formData.acquisition_date}
                      onChange={(e) => handleChange('acquisition_date', e.target.value)}
                      disabled={loading}
                    />
                    <Input
                      label="Custo de Aquisição (R$)"
                      type="number"
                      step="0.01"
                      value={formData.acquisition_cost}
                      onChange={(e) => handleChange('acquisition_cost', e.target.value)}
                      disabled={loading}
                      placeholder="0.00"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 4: Localização e Status */}
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
                      <MapPin className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Localização e Status
                      </h2>
                      <p className="text-sm text-slate-400">
                        Onde o equipamento está localizado e seu status atual
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Localização"
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        disabled={loading}
                        placeholder="Setor, linha, unidade..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Status * {errors.status && (
                          <span className="text-red-400 text-xs ml-2">{errors.status}</span>
                        )}
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        required
                        disabled={loading}
                        className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors.status ? 'border-red-500' : 'border-slate-700'
                        }`}
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                        <option value="maintenance">Em Manutenção</option>
                        <option value="deactivated">Desativado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Criticidade * {errors.criticality && (
                          <span className="text-red-400 text-xs ml-2">{errors.criticality}</span>
                        )}
                      </label>
                      <select
                        value={formData.criticality}
                        onChange={(e) => handleChange('criticality', e.target.value)}
                        required
                        disabled={loading}
                        className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors.criticality ? 'border-red-500' : 'border-slate-700'
                        }`}
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Características Técnicas */}
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
                      <Settings className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Características Técnicas
                      </h2>
                      <p className="text-sm text-slate-400">
                        Especificações técnicas do equipamento
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Potência"
                      value={formData.power}
                      onChange={(e) => handleChange('power', e.target.value)}
                      disabled={loading}
                      placeholder="Kw, CV, etc."
                    />
                    <Input
                      label="Capacidade"
                      value={formData.capacity}
                      onChange={(e) => handleChange('capacity', e.target.value)}
                      disabled={loading}
                      placeholder="Litros, Toneladas, RPM, etc."
                    />
                    <Input
                      label="Voltagem"
                      value={formData.voltage}
                      onChange={(e) => handleChange('voltage', e.target.value)}
                      disabled={loading}
                      placeholder="Ex: 220V, 380V"
                    />
                    <Input
                      label="Tipo de Combustível/Energia"
                      value={formData.fuel_type}
                      onChange={(e) => handleChange('fuel_type', e.target.value)}
                      disabled={loading}
                      placeholder="Ex: Elétrico, Diesel, Gás"
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Especificações Dimensionais"
                        value={formData.dimensions}
                        onChange={(e) => handleChange('dimensions', e.target.value)}
                        disabled={loading}
                        placeholder="Altura x Largura x Peso"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 6: Documentos */}
              {currentStep === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-pink-500/20 rounded-lg">
                      <Camera className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Documentos e Fotos
                      </h2>
                      <p className="text-sm text-slate-400">
                        Adicione fotos e manual do equipamento (opcional)
                      </p>
                    </div>
                  </div>

                  {/* Fotos */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Fotos do Equipamento
                    </label>
                    <div className="space-y-4">
                      <div>
                        <input
                          type="file"
                          multiple
                          onChange={handlePhotoSelect}
                          className="hidden"
                          id="photo-upload"
                          accept="image/*"
                          disabled={loading}
                        />
                        <label
                          htmlFor="photo-upload"
                          className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            loading
                              ? 'border-slate-800 bg-slate-800/50 cursor-not-allowed'
                              : 'border-slate-700 bg-slate-800/50 hover:border-green-500/50'
                          }`}
                        >
                          <div className="text-center">
                            <Upload className={`w-8 h-8 mx-auto mb-2 ${loading ? 'text-slate-600' : 'text-slate-400'}`} />
                            <span className={`block ${loading ? 'text-slate-600' : 'text-slate-400'}`}>
                              Clique para selecionar fotos
                            </span>
                            <span className="text-xs text-slate-500 mt-1 block">
                              JPG, PNG, GIF (máx. 10MB por arquivo)
                            </span>
                          </div>
                        </label>
                      </div>

                      {photoPreviews.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-slate-300">
                            Fotos selecionadas ({photos.length})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <AnimatePresence>
                              {photoPreviews.map((preview, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="relative group"
                                >
                                  <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                                    <img
                                      src={preview}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    {!loading && (
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                          onClick={() => removePhoto(index)}
                                          className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
                                          type="button"
                                        >
                                          <X className="w-5 h-5 text-white" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-400 truncate">
                                    {photos[index].name}
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manual */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Manual do Equipamento
                    </label>
                    <div className="space-y-4">
                      <div>
                        <input
                          type="file"
                          onChange={handleManualSelect}
                          className="hidden"
                          id="manual-upload"
                          accept="application/pdf"
                          disabled={loading}
                        />
                        <label
                          htmlFor="manual-upload"
                          className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            loading
                              ? 'border-slate-800 bg-slate-800/50 cursor-not-allowed'
                              : 'border-slate-700 bg-slate-800/50 hover:border-green-500/50'
                          }`}
                        >
                          <div className="text-center">
                            <FileText className={`w-8 h-8 mx-auto mb-2 ${loading ? 'text-slate-600' : 'text-slate-400'}`} />
                            <span className={`block ${loading ? 'text-slate-600' : 'text-slate-400'}`}>
                              {manualName ? manualName : 'Clique para selecionar o manual (PDF)'}
                            </span>
                            <span className="text-xs text-slate-500 mt-1 block">
                              Apenas arquivos PDF (máx. 50MB)
                            </span>
                          </div>
                        </label>
                      </div>

                      {manual && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-green-400" />
                            <div>
                              <p className="text-sm font-medium text-white">{manualName}</p>
                              <p className="text-xs text-slate-400">
                                {(manual.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          {!loading && (
                            <button
                              type="button"
                              onClick={removeManual}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5 text-red-400" />
                            </button>
                          )}
                        </motion.div>
                      )}
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
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {currentStep === 1 ? 'Cancelar' : 'Anterior'}
              </Button>

              <div className="flex items-center gap-3">
                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNext}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || uploadingPhotos || uploadingManual}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading || uploadingPhotos || uploadingManual
                      ? uploadingManual
                        ? 'Enviando manual...'
                        : uploadingPhotos
                        ? 'Enviando fotos...'
                        : 'Salvando...'
                      : 'Criar Equipamento'}
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
