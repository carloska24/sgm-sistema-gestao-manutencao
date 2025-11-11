'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { fetchData, putData } from '@/lib/api';
import {
  User,
  Mail,
  Briefcase,
  Save,
  X,
  Upload,
  Camera,
  ArrowLeft,
} from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'technician' | 'requester';
  department?: string;
  photo_url?: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  const { user: currentUser, reloadUser } = useAuth();
  const { success, error } = useToast();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Verificar se o usuário está tentando editar seu próprio perfil
  useEffect(() => {
    if (currentUser && userId) {
      if (currentUser.id !== parseInt(userId as string)) {
        error('Você só pode editar seu próprio perfil');
        router.back();
        return;
      }
      loadUser();
    }
  }, [userId, currentUser]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await fetchData<UserProfile>(`/users/${userId}`);
      setUser(userData);
      if (userData.photo_url) {
        setPhotoPreview(userData.photo_url);
      }
    } catch (err) {
      console.error('Erro ao carregar usuário:', err);
      error('Erro ao carregar dados do usuário');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUser(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho do arquivo
      if (file.size > 5 * 1024 * 1024) {
        error('Arquivo muito grande. Máximo 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        
        // Comprimir imagem se necessário
        if (result.length > 1024 * 1024) {
          compressImage(result);
        } else {
          setPhotoPreview(result);
          if (user) {
            setUser({ ...user, photo_url: result });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const compressImage = (base64String: string) => {
    const img = new Image();
    img.src = base64String;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Reduzir tamanho se for maior que 1000px
      if (width > 1000 || height > 1000) {
        const ratio = Math.min(1000 / width, 1000 / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para JPEG com qualidade reduzida
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        setPhotoPreview(compressed);
        if (user) {
          setUser({ ...user, photo_url: compressed });
        }
      }
    };

    img.onerror = () => {
      error('Erro ao processar imagem');
    };
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      
      // Validar campos obrigatórios
      if (!user.email || !user.full_name) {
        error('Email e Nome Completo são obrigatórios');
        return;
      }

      // Preparar dados para enviar
      const payload = {
        email: user.email,
        full_name: user.full_name,
        department: user.department || '',
        photo_url: user.photo_url || null,
      };

      await putData(`/users/${userId}`, payload);
      success('Perfil atualizado com sucesso!');
      // Recarregar dados do usuário no contexto
      await reloadUser();
      router.push('/dashboard');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar perfil';
      error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Carregando perfil...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-400">Erro ao carregar o perfil</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const roleLabels = {
    admin: 'Administrador',
    manager: 'Gerenciador',
    technician: 'Técnico',
    requester: 'Solicitante',
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-800/50 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Editar Perfil</h1>
            <p className="text-slate-400 text-sm mt-1">Atualize suas informações pessoais</p>
          </div>
        </motion.div>

        {/* Card Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-700/50 rounded-2xl p-8 space-y-8"
        >
          {/* Seção de Foto */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-green-400" />
              Foto de Perfil
            </h2>
            <div className="flex items-center gap-8">
              {/* Avatar Redondo com Upload Overlay */}
              <div className="relative group">
                <div className="w-32 h-32 bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 rounded-full flex items-center justify-center border-4 border-green-400/40 shadow-xl overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-bold text-white">
                      {user.full_name?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Overlay com botão de upload */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-white" />
                    <span className="text-xs text-white font-medium">Trocar Foto</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-slate-300 mb-2">
                  Passe o mouse sobre a foto para fazer upload
                </p>
                <p className="text-xs text-slate-400">
                  Formatos aceitos: PNG, JPG<br />
                  Tamanho máximo: 5MB
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-700/30" />

          {/* Seção de Informações */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-green-400" />
              Informações Pessoais
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome Completo */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={user.full_name || ''}
                  onChange={handleInputChange}
                  placeholder="Digite seu nome completo"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/30 transition-all"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  name="username"
                  value={user.username}
                  disabled
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-400 cursor-not-allowed opacity-60"
                />
                <p className="text-xs text-slate-500 mt-1">Não pode ser alterado</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-400" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={user.email}
                  onChange={handleInputChange}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/30 transition-all"
                />
              </div>

              {/* Departamento */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Departamento
                </label>
                <input
                  type="text"
                  name="department"
                  value={user.department || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: Manutenção, TI, etc"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/30 transition-all"
                />
              </div>

              {/* Função */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-green-400" />
                  Função
                </label>
                <select
                  name="role"
                  value={user.role}
                  disabled
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-400 cursor-not-allowed opacity-60"
                >
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Não pode ser alterada</p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="h-px bg-slate-700/30" />
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </Button>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
