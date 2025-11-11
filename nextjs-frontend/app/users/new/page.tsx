'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/useToast';
import { postData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewUserPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    department: '',
    role: 'requester' as 'admin' | 'manager' | 'technician' | 'requester',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await postData('/users', formData);
      success('Usuário criado com sucesso!');
      router.push('/users');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar usuário';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

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
              Novo Usuário
            </h1>
            <p className="text-slate-400">
              Crie um novo usuário no sistema
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Informações Básicas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Username *"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  required
                  disabled={loading}
                  placeholder="nomeusuario"
                />
                <Input
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  disabled={loading}
                  placeholder="usuario@empresa.com"
                />
                <Input
                  label="Senha *"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
                <Input
                  label="Nome Completo"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  disabled={loading}
                  placeholder="Nome completo do usuário"
                />
                <Input
                  label="Departamento"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  disabled={loading}
                  placeholder="Ex: Manutenção, Produção..."
                />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Perfil *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value as any)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="requester">Solicitante</option>
                    <option value="technician">Técnico</option>
                    <option value="manager">Gerente</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Solicitante: pode abrir chamados
                    <br />
                    Técnico: pode executar manutenções
                    <br />
                    Gerente: pode gerenciar chamados e planos
                    <br />
                    Administrador: acesso total
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
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
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

