import React, { useState, useEffect } from 'react';
import { Camera, Save, Lock, User, KeyRound, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function UserProfile() {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. BUSCAR DADOS DO USUÁRIO
  // O useQuery vai buscar os dados e salvar na variável 'user'
  const { data: user, isLoading } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
    staleTime: 0, // Garante que sempre verifique dados frescos
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
  
  // Visibilidade da Senha
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2. A MÁGICA: PREENCHER OS CAMPOS ASSIM QUE OS DADOS CHEGAREM
  useEffect(() => {
    if (user) {
      // Se veio nome do banco, coloca no input. Se não, deixa vazio.
      setName(user.name || ''); 
      
      // Se veio email, coloca no input.
      setEmail(user.email || '');

      // Se veio foto, mostra o preview
      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
      }
    }
  }, [user]); // Esse comando roda toda vez que o 'user' muda (ou seja, quando termina de carregar)

  // Handler de Imagem (Preview Local)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
    }
  };

  // Handler de Salvar Perfil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append('name', name); // Envia o nome que você editou
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Perfil atualizado com sucesso!');
      
      // Atualiza o Header e os dados da tela imediatamente
      queryClient.setQueryData(['user-me'], response.data); 
      await queryClient.invalidateQueries({ queryKey: ['user-me'] });

    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handler de Senha (Placeholder)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.warning('As senhas não coincidem!');
      return;
    }
    toast.info('Funcionalidade de troca de senha será implementada no backend.');
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
        
        {/* === CARD DADOS PESSOAIS === */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-gray-700">
            <User className="text-blue-600" size={20} />
            Dados Pessoais
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            
            {/* FOTO */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group cursor-pointer">
                <div className="w-28 h-28 rounded-full border-4 border-gray-100 overflow-hidden bg-gray-100 shadow-inner flex items-center justify-center">
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
              <p className="text-xs text-gray-500">Clique na foto para alterar</p>
            </div>

            {/* NOME (Aparece o nome atual e permite editar) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input
                type="text"
                value={name} // AQUI: Vincula o input ao estado preenchido pelo useEffect
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="Seu nome completo"
              />
            </div>

            {/* EMAIL (Aparece o email atual, bloqueado) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email} // AQUI: Mostra o email vindo do banco
                disabled      // Bloqueia a edição
                className="w-full px-4 py-2 border border-gray-200 bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed font-medium"
              />
              <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado.</p>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-70"
            >
              <Save size={18} />
              {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        {/* === CARD SENHA (MANTIDO) === */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-gray-700">
            <Lock className="text-blue-600" size={20} />
            Alterar Senha
          </h2>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            
            {/* Senha Atual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
                <KeyRound className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <button 
                  type="button" 
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Nova Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <button 
                  type="button" 
                  onClick={() => setShowNewPassword(!showNewPassword)} 
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirmar Nova Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Atualizar Senha
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}