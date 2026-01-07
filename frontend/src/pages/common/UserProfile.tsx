import React, { useState, useEffect } from 'react';
import { Camera, Save, Lock, User, KeyRound, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function UserProfile() {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 1. BUSCAR DADOS DO USUÁRIO
  const { data: user, isLoading } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
    staleTime: 0,
  });

  // === ESTADOS DO FORMULÁRIO ===
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // === ESTADOS DE SENHA ===
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || ''); 
      setEmail(user.email || '');
      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
      }
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Perfil atualizado com sucesso!');
      queryClient.setQueryData(['user-me'], response.data); 
      await queryClient.invalidateQueries({ queryKey: ['user-me'] });
    } catch (error) {
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica no front
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warning('Preencha todos os campos de senha.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warning('As senhas novas não coincidem!');
      return;
    }

    if (newPassword.length < 6) {
      toast.warning('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsChangingPassword(true);

    try {
      // Envia para a rota @Patch('update-password') que criamos
      await api.patch('/users/update-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });

      toast.success('Senha alterada com sucesso!');
      
      // Limpa os campos após o sucesso
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      // Captura o erro do backend (ex: senha atual incorreta)
      const msg = error.response?.data?.message || 'Erro ao alterar senha.';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center text-gray-500">Carregando seus dados...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Configurações da Conta</h1>
        <p className="text-gray-500">Gerencie seus dados pessoais e segurança.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CARD DADOS PESSOAIS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-gray-700">
            <User className="text-blue-600" size={20} /> Dados Pessoais
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group cursor-pointer">
                <div className="w-28 h-28 rounded-full border-4 border-gray-100 overflow-hidden bg-gray-100 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-gray-300" />
                  )}
                </div>
                <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="text-white" size={24} />
                </label>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input type="email" value={email} disabled className="w-full px-4 py-2 border border-gray-200 bg-gray-100 text-gray-600 rounded-lg font-medium" />
            </div>
            <button type="submit" disabled={isUpdating} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg">
              <Save size={18} /> {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        {/* CARD SENHA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-gray-700">
            <Lock className="text-blue-600" size={20} /> Alterar Senha
          </h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
              <div className="relative">
                <input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg outline-none" placeholder="••••••••" />
                <KeyRound className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-2.5 text-gray-400">
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
              <div className="relative">
                <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg outline-none" placeholder="••••••••" />
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-2.5 text-gray-400">
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg outline-none" placeholder="••••••••" />
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-gray-400">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" disabled={isChangingPassword} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50">
                {isChangingPassword ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}