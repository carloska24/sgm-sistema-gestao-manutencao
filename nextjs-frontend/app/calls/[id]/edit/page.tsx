'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/useToast';
import { fetchData, putData } from '@/lib/api';
import { MaintenanceCall, Equipment } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft, Save, Wrench, AlertCircle, Calendar, Flag, X, Camera, Shield, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

export default function EditCallPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const callId = params?.id as string;
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [formData, setFormData] = useState({
    equipment_id: '',
    type: 'corrective' as 'preventive' | 'corrective' | 'predictive' | 'emergency',
    problem_type: '',
    description: '',
    occurrence_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'open' as string,
  });

  useEffect(() => {
    if (callId) {
      loadCall();
      loadEquipment();
    }
  }, [callId]);

  const loadCall = async () => {
    try {
      setLoading(true);
      const data = await fetchData<MaintenanceCall>(`/calls/${callId}`);
      setFormData({
        equipment_id: data.equipment_id.toString(),
        type: data.type || 'corrective',
        problem_type: data.problem_type || '',
        description: data.description,
        occurrence_date: data.occurrence_date ? data.occurrence_date.slice(0, 16) : '',
        priority: data.priority,
        status: data.status,
      });
    } catch (err) {
      showError('Erro ao carregar chamado');
      router.push('/calls');
    } finally {
      setLoading(false);
    }
  };

  const loadEquipment = async () => {
    try {
      const response = await fetchData<Equipment[]>('/equipment?limit=1000');
      // Garantir que sempre seja um array
      setEquipmentList(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Erro ao carregar equipamentos:', err);
      setEquipmentList([]); // Garantir que seja um array vazio em caso de erro
      showError('Erro ao carregar equipamentos');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        equipment_id: parseInt(formData.equipment_id),
      };

      await putData(`/calls/${callId}`, data);

      // Upload das fotos após atualizar o chamado
      if (photos.length > 0) {
        await uploadPhotos(parseInt(callId));
      }

      success('Chamado atualizado com sucesso!');
      router.push(`/calls/${callId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar chamado';
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Carregando...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 font-poppins">
              Editar Chamado
            </h1>
            <p className="text-slate-400">
              Atualize as informações do chamado
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Informações do Chamado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl border border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Informações do Chamado</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Equipamento *
                  </label>
                  <select
                    value={formData.equipment_id}
                    onChange={(e) => handleChange('equipment_id', e.target.value)}
                    required
                    disabled={saving}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de Manutenção
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'preventive', label: 'Preventiva', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
                      { value: 'corrective', label: 'Corretiva', icon: Wrench, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
                      { value: 'predictive', label: 'Preditiva', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
                      { value: 'emergency', label: 'Emergencial', icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
                    ].map((type) => {
                      const TypeIcon = type.icon;
                      const isActive = formData.type === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleChange('type', type.value)}
                          disabled={saving}
                          className={clsx(
                            'p-3 rounded-xl border transition-all text-left text-sm',
                            isActive
                              ? `${type.bg} ${type.border} border-2 shadow-lg`
                              : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <TypeIcon className={clsx('w-4 h-4', isActive ? type.color : 'text-slate-400')} />
                            <span className={clsx('font-semibold', isActive ? 'text-white' : 'text-slate-300')}>
                              {type.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de Problema
                  </label>
                  <Input
                    value={formData.problem_type}
                    onChange={(e) => handleChange('problem_type', e.target.value)}
                    disabled={saving}
                    placeholder="Ex: Falha elétrica, Vazamento, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    required
                    rows={5}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
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
                        disabled={saving || uploadingPhotos}
                        className="hidden"
                        id="photo-upload-edit"
                      />
                      <label
                        htmlFor="photo-upload-edit"
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

            {/* Data e Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl border border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Data e Status</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data e Hora da Ocorrência
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.occurrence_date}
                    onChange={(e) => handleChange('occurrence_date', e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Prioridade *
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleChange('priority', e.target.value as any)}
                      required
                      disabled={saving}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      disabled={saving}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="open">Aberto</option>
                      <option value="analysis">Em Análise</option>
                      <option value="assigned">Atribuído</option>
                      <option value="execution">Em Execução</option>
                      <option value="waiting_parts">Aguardando Peças</option>
                      <option value="completed">Concluído</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-800 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-end gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving || uploadingPhotos}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving || uploadingPhotos ? (uploadingPhotos ? 'Enviando fotos...' : 'Salvando...') : 'Salvar Alterações'}
                </Button>
              </div>
            </motion.div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

