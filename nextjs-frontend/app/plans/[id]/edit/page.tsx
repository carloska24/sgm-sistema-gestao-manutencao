'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/useToast';
import { fetchData, putData } from '@/lib/api';
import { PreventivePlan, Equipment, FrequencyType } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Save, Wrench, Package, Shield, BookOpen, Info, Calendar, Clock, Users, X } from 'lucide-react';

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const planId = params?.id as string;
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    equipment_id: '',
    frequency_type: 'months' as FrequencyType,
    frequency_value: 1,
    start_date: '',
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
    if (planId) {
      loadPlan();
      loadEquipment();
      loadTechnicians();
    }
  }, [planId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const data = await fetchData<PreventivePlan>(`/plans/${planId}`);
      setFormData({
        name: data.name,
        equipment_id: data.equipment_id.toString(),
        frequency_type: data.frequency_type,
        frequency_value: data.frequency_value,
        start_date: data.start_date.split('T')[0],
        end_date: data.end_date ? data.end_date.split('T')[0] : '',
        instructions: data.instructions || '',
        estimated_duration: data.estimated_duration?.toString() || '',
        tools_required: data.tools_required || '',
        materials_required: data.materials_required || '',
        safety_procedures: data.safety_procedures || '',
        manual_reference: data.manual_reference || '',
        assigned_to: data.assigned_to?.toString() || '',
      });
    } catch (err) {
      showError('Erro ao carregar plano');
      router.push('/plans');
    } finally {
      setLoading(false);
    }
  };

  const loadEquipment = async () => {
    try {
      const response = await fetchData<any>('/equipment?limit=1000');
      // Verificar se a resposta é um array ou se tem uma propriedade data
      const equipment = Array.isArray(response) ? response : response?.data || [];
      setEquipmentList(equipment);
    } catch (err) {
      console.error('Erro ao carregar equipamentos:', err);
      showError('Erro ao carregar equipamentos');
      setEquipmentList([]); // Garantir que sempre seja um array
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

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

      await putData(`/plans/${planId}`, data);
      success('Plano atualizado com sucesso!');
      router.push(`/plans/${planId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar plano';
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#94a3b8]">Carregando...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6 pt-4 pb-8">
        <div className="flex items-center gap-4 pb-2">
          <Button
            variant="secondary"
            onClick={() => router.back()}
          >
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Editar Plano Preventivo
            </h1>
            <p className="text-[#94a3b8]">
              Atualize as informações do plano
            </p>
          </div>
        </div>

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
              <div className="space-y-4">
                <Input
                  label="Nome do Plano *"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  disabled={saving}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Equipamento *
                  </label>
                  <select
                    value={formData.equipment_id}
                    onChange={(e) => handleChange('equipment_id', e.target.value)}
                    required
                    disabled={saving}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-border-color rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="">Selecione um equipamento</option>
                    {equipmentList && equipmentList.length > 0 ? (
                      equipmentList.map((eq: Equipment) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.code} - {eq.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Carregando equipamentos...</option>
                    )}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Frequência */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl border border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Frequência</h2>
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
                    disabled={saving}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-border-color rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="days">Dias</option>
                    <option value="weeks">Semanas</option>
                    <option value="months">Meses</option>
                    <option value="hours">Horas</option>
                    <option value="cycles">Ciclos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Valor da Frequência *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.frequency_value}
                    onChange={(e) => handleChange('frequency_value', parseInt(e.target.value) || 1)}
                    required
                    disabled={saving}
                  />
                </div>
              </div>
            </motion.div>

            {/* Período */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl border border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Período</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Data de Início *"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  required
                  disabled={saving}
                />
                <Input
                  label="Data de Término (opcional)"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  disabled={saving}
                />
              </div>
            </motion.div>

            {/* Detalhes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl border border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Detalhes</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Instruções de Manutenção
                  </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => handleChange('instructions', e.target.value)}
                      rows={5}
                      disabled={saving}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-border-color rounded-lg text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Duração Estimada (minutos)"
                    type="number"
                    min="1"
                    value={formData.estimated_duration}
                    onChange={(e) => handleChange('estimated_duration', e.target.value)}
                    disabled={saving}
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Técnico Responsável
                    </label>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) => handleChange('assigned_to', e.target.value)}
                      disabled={saving}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-border-color rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="">Não atribuído</option>
                      {technicians && technicians.length > 0 ? (
                        technicians.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.full_name || tech.username}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Carregando técnicos...</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recursos Necessários */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl border border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Wrench className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Recursos Necessários</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Ferramentas Necessárias
                  </label>
                  <textarea
                    value={formData.tools_required}
                    onChange={(e) => handleChange('tools_required', e.target.value)}
                    rows={3}
                    disabled={saving}
                    placeholder="Ex: Chave de fenda, Multímetro, Alicate..."
                    className="w-full px-4 py-3 bg-slate-800/50 border border-border-color rounded-lg text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                    rows={3}
                    disabled={saving}
                    placeholder="Ex: Óleo hidráulico 5L, Filtro de ar, Veda rosca..."
                    className="w-full px-4 py-3 bg-slate-800/50 border border-border-color rounded-lg text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </motion.div>

            {/* Segurança e Manual */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl border border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Segurança e Documentação</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    ⚠️ Procedimentos de Segurança
                  </label>
                  <textarea
                    value={formData.safety_procedures}
                    onChange={(e) => handleChange('safety_procedures', e.target.value)}
                    rows={4}
                    disabled={saving}
                    placeholder="Ex: Desligar equipamento antes de iniciar. Usar EPI completo. Verificar bloqueio de energia..."
                    className="w-full px-4 py-3 bg-slate-800/50 border border-red-500/30 rounded-lg text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    ⚠️ Informações críticas de segurança que devem ser seguidas
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
                    disabled={saving}
                    placeholder="Ex: Manual do Compressor - Página 45-50, Seção 3.2"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Referência específica no manual do equipamento (se aplicável)
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
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
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </motion.div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

