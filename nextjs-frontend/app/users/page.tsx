'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { fetchData, deleteData } from '@/lib/api';
import { User } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users as UsersIcon,
  Shield,
  UserCheck
} from 'lucide-react';
import { clsx } from 'clsx';

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchData<User[]>('/users');
      setUsers(data);
    } catch (err) {
      showError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (id === currentUser?.id) {
      showError('Você não pode deletar seu próprio usuário');
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar o usuário "${username}"?`)) {
      return;
    }

    try {
      await deleteData(`/users/${id}`);
      success('Usuário deletado com sucesso');
      loadUsers();
    } catch (err) {
      showError('Erro ao deletar usuário');
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrador',
      manager: 'Gerente',
      technician: 'Técnico',
      requester: 'Solicitante',
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-500/10 text-red-500 border-red-500/20',
      manager: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      technician: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      requester: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };
    return colors[role as keyof typeof colors] || colors.requester;
  };

  const filteredUsers = users.filter((user) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchLower)) ||
      (user.department && user.department.toLowerCase().includes(searchLower))
    );
  });

  return (
    <MainLayout>
      <div className="space-y-6 max-w-full pt-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-2">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 font-poppins">
              Usuários
            </h1>
            <p className="text-slate-400">
              Gerencie usuários do sistema
            </p>
          </div>
          <Button
            onClick={() => router.push('/users/new')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </div>

        {/* Busca */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar por nome, email, username ou departamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Carregando...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-lg border border-slate-800">
            <UsersIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">Nenhum usuário encontrado</p>
            <p className="text-sm text-slate-500 mb-4">
              {search
                ? 'Tente ajustar os termos de busca'
                : 'Comece criando seu primeiro usuário'
              }
            </p>
            {!search && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/users/new')}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Usuário
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-slate-900 rounded-lg border p-6 hover:border-slate-700 transition-colors ${
                  user.id === currentUser?.id 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <UsersIcon className={`w-5 h-5 flex-shrink-0 ${
                        user.id === currentUser?.id ? 'text-green-400' : 'text-blue-400'
                      }`} />
                      <h3 className="text-lg font-semibold text-white truncate">
                        {user.full_name || user.username}
                      </h3>
                      {user.id === currentUser?.id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-medium text-green-400 flex-shrink-0">
                          <UserCheck className="w-3 h-3" />
                          Você
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-mono text-slate-400 mb-2">
                      @{user.username}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-slate-500">Email:</span>
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.department && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="text-slate-500">Departamento:</span>
                      <span>{user.department}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        getRoleColor(user.role)
                      )}
                    >
                      {user.role === 'admin' && <Shield className="w-3 h-3" />}
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>

                <div 
                  className="flex items-center gap-2 pt-4 border-t border-slate-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => router.push(`/users/${user.id}/edit`)}
                    className="flex-1 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-yellow-400 flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  {user.id !== currentUser?.id && (
                    <button
                      onClick={() => handleDelete(user.id, user.username)}
                      className="px-3 py-2 text-sm bg-slate-800 hover:bg-red-500/10 rounded-lg transition-colors text-red-400"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

