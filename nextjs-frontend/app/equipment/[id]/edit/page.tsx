'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/useToast';
import { fetchData, putData } from '@/lib/api';
import { Equipment } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft, Save, Upload, X, FileText, Info, Building2, DollarSign, MapPin, Settings, Camera, BookOpen } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function EditEquipmentPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const equipmentId = params?.id as string;
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [manual, setManual] = useState<File | null>(null);
  const [manualName, setManualName] = useState<string>('');
  const [uploadingManual, setUploadingManual] = useState(false);
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

  useEffect(() => {
    if (equipmentId) {
      loadEquipment();
    }
  }, [equipmentId]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const data = await fetchData<Equipment>(`/equipment/${equipmentId}`);
      setFormData({
        name: data.name,
        code: data.code,
        description: data.description || '',
        model: data.model || '',
        manufacturer: data.manufacturer || '',
        serial_number: data.serial_number || '',
        acquisition_date: data.acquisition_date ? data.acquisition_date.split('T')[0] : '',
        acquisition_cost: data.acquisition_cost?.toString() || '',
        location: data.location || '',
        status: data.status,
        criticality: data.criticality,
        power: data.power || '',
        capacity: data.capacity || '',
        voltage: data.voltage || '',
        fuel_type: data.fuel_type || '',
        dimensions: data.dimensions || '',
      });
    } catch (err) {
      showError('Erro ao carregar equipamento');
      router.push('/equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        acquisition_cost: formData.acquisition_cost ? parseFloat(formData.acquisition_cost) : undefined,
      };

      await putData(`/equipment/${equipmentId}`, data);
      
      const equipmentIdNum = parseInt(equipmentId);
      let uploadMessages: string[] = [];
      
      // Fazer upload das fotos se houver
      if (photos.length > 0) {
        try {
          await uploadPhotos(equipmentIdNum);
          uploadMessages.push(`${photos.length} foto(s) enviada(s)`);
        } catch (photoErr) {
          console.error('Erro ao fazer upload de fotos:', photoErr);
          uploadMessages.push('Erro ao enviar algumas fotos');
        }
      }
      
      // Fazer upload do manual se houver
      if (manual) {
        try {
          await uploadManual(equipmentIdNum);
          uploadMessages.push('Manual enviado');
        } catch (manualErr) {
          console.error('Erro ao fazer upload do manual:', manualErr);
          uploadMessages.push('Erro ao enviar o manual');
        }
      }
      
      if (uploadMessages.length > 0) {
        success(`Equipamento atualizado com sucesso! ${uploadMessages.join(', ')}.`);
      } else {
        success('Equipamento atualizado com sucesso!');
      }
      
      router.push(`/equipment/${equipmentId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar equipamento';
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Filtrar apenas imagens
      const imageFiles = selectedFiles.filter(file => 
        file.type.startsWith('image/')
      );

      // Validar tamanho (máx 10MB por arquivo)
      const validFiles = imageFiles.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          showError(`Arquivo ${file.name} excede 10MB`);
          return false;
        }
        return true;
      });

      setPhotos((prev) => [...prev, ...validFiles]);

      // Criar previews
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

  const handleManualSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validar se é PDF
      if (file.type !== 'application/pdf') {
        showError('Apenas arquivos PDF são permitidos para o manual');
        return;
      }

      // Validar tamanho (máx 50MB)
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      <div className="max-w-4xl mx-auto space-y-6 pt-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4 pb-2">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 font-poppins">
              Editar Equipamento
            </h1>
            <p className="text-slate-400">
              Atualize as informações do equipamento
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Informações Básicas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl border border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Info className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Informações Básicas</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome do Equipamento *"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  disabled={saving}
                />
                <Input
                  label="Código de Identificação *"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  required
                  disabled={saving}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={saving}
                  />
                </div>
              </div>
            </motion.div>

            {/* Informações do Fabricante */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl border border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Building2 className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Informações do Fabricante</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Fabricante"
                  value={formData.manufacturer}
                  onChange={(e) => handleChange('manufacturer', e.target.value)}
                  disabled={saving}
                />
                <Input
                  label="Modelo"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  disabled={saving}
                />
                <Input
                  label="Número de Série"
                  value={formData.serial_number}
                  onChange={(e) => handleChange('serial_number', e.target.value)}
                  disabled={saving}
                />
              </div>
            </motion.div>

            {/* Informações de Aquisição */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl border border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Informações de Aquisição</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Data de Aquisição"
                  type="date"
                  value={formData.acquisition_date}
                  onChange={(e) => handleChange('acquisition_date', e.target.value)}
                  disabled={saving}
                />
                <Input
                  label="Custo de Aquisição"
                  type="number"
                  step="0.01"
                  value={formData.acquisition_cost}
                  onChange={(e) => handleChange('acquisition_cost', e.target.value)}
                  disabled={saving}
                  placeholder="0.00"
                />
              </div>
            </motion.div>

            {/* Localização e Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl border border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Localização e Status</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Localização"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  disabled={saving}
                  placeholder="Setor, linha, unidade..."
                />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    required
                    disabled={saving}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="maintenance">Em Manutenção</option>
                    <option value="deactivated">Desativado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Criticidade *
                  </label>
                  <select
                    value={formData.criticality}
                    onChange={(e) => handleChange('criticality', e.target.value)}
                    required
                    disabled={saving}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Características Técnicas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl border border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Settings className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Características Técnicas</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Potência"
                  value={formData.power}
                  onChange={(e) => handleChange('power', e.target.value)}
                  disabled={saving}
                  placeholder="Kw, CV, etc."
                />
                <Input
                  label="Capacidade"
                  value={formData.capacity}
                  onChange={(e) => handleChange('capacity', e.target.value)}
                  disabled={saving}
                  placeholder="Litros, Toneladas, RPM, etc."
                />
                <Input
                  label="Voltagem"
                  value={formData.voltage}
                  onChange={(e) => handleChange('voltage', e.target.value)}
                  disabled={saving}
                />
                <Input
                  label="Tipo de Combustível/Energia"
                  value={formData.fuel_type}
                  onChange={(e) => handleChange('fuel_type', e.target.value)}
                  disabled={saving}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Especificações Dimensionais"
                    value={formData.dimensions}
                    onChange={(e) => handleChange('dimensions', e.target.value)}
                    disabled={saving}
                    placeholder="Altura x Largura x Peso"
                  />
                </div>
              </div>
            </motion.div>

            {/* Fotos do Equipamento */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl border border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Camera className="w-5 h-5 text-pink-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Fotos do Equipamento</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id="photo-upload"
                    accept="image/*"
                    disabled={saving}
                  />
                  <label
                    htmlFor="photo-upload"
                    className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      saving
                        ? 'border-slate-800 bg-slate-800/50 cursor-not-allowed'
                        : 'border-slate-700 bg-slate-800/50 hover:border-[#22c55e]/50'
                    }`}
                  >
                    <div className="text-center">
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${saving ? 'text-slate-600' : 'text-[#94a3b8]'}`} />
                      <span className={`block ${saving ? 'text-slate-600' : 'text-[#94a3b8]'}`}>
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
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-slate-300">
                        Fotos selecionadas ({photos.length})
                      </h4>
                    </div>
                    
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
                              {!saving && (
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => removePhoto(index)}
                                    className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
                                  >
                                    <X className="w-4 h-4 text-white" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Manual do Equipamento */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl border border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Manual do Equipamento</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    onChange={handleManualSelect}
                    className="hidden"
                    id="manual-upload"
                    accept="application/pdf"
                    disabled={saving}
                  />
                  <label
                    htmlFor="manual-upload"
                    className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      saving
                        ? 'border-slate-800 bg-slate-800/50 cursor-not-allowed'
                        : 'border-slate-700 bg-slate-800/50 hover:border-[#22c55e]/50'
                    }`}
                  >
                    <div className="text-center">
                      <FileText className={`w-8 h-8 mx-auto mb-2 ${saving ? 'text-slate-600' : 'text-[#94a3b8]'}`} />
                      <span className={`block ${saving ? 'text-slate-600' : 'text-[#94a3b8]'}`}>
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
                      <FileText className="w-6 h-6 text-[#22c55e]" />
                      <div>
                        <p className="text-sm font-medium text-white">{manualName}</p>
                        <p className="text-xs text-slate-400">
                          {(manual.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    {!saving && (
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
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-800 p-6 shadow-2xl mb-4"
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
                  disabled={saving || uploadingPhotos || uploadingManual}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving || uploadingPhotos || uploadingManual
                    ? (uploadingManual ? 'Enviando manual...' : uploadingPhotos ? 'Enviando fotos...' : 'Salvando...') 
                    : 'Salvar Alterações'}
                </Button>
              </div>
            </motion.div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

