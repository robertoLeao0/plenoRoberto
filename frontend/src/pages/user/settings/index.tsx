import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { FaUserCircle, FaEnvelope, FaLock } from 'react-icons/fa';

export default function UserSettings() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
    retry: false,
  });

  if (isLoading) {
    return <div className="p-6">Carregando perfil...</div>;
  }

  if (isError || !user) {
    return <div className="p-6 text-red-600">Não foi possível carregar os dados do seu perfil.</div>;
  }

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl font-semibold text-slate-800 flex items-center">
          <FaUserCircle className="mr-3 text-indigo-600" size={32} /> Configurações de Perfil
        </h1>
        <p className="text-slate-500">Gerencie suas informações pessoais e credenciais de acesso.</p>
      </header>
      
      <div className="bg-white rounded-lg shadow-xl p-6 space-y-6">
        
        {/* Seção 1: Informações Básicas */}
        <div>
          <h2 className="text-xl font-medium text-slate-700 mb-4 border-b pb-2">Dados de Acesso</h2>
          <div className="space-y-4">
            <div className="flex items-center text-slate-600">
              <FaEnvelope className="mr-3 text-indigo-400" />
              <span className="font-medium mr-2">E-mail:</span>
              <span>{user.email}</span>
            </div>
            <div className="flex items-center text-slate-600">
              <FaUserCircle className="mr-3 text-indigo-400" />
              <span className="font-medium mr-2">Perfil:</span>
              <span>{user.role}</span>
            </div>
            
            {/* Botão de Edição de Senha */}
            <button className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition">
                <FaLock className="mr-2" /> Alterar Senha
            </button>
          </div>
        </div>

        {/* Seção 2: Dados Pessoais (Placeholder) */}
        <div className="pt-6 border-t">
          <h2 className="text-xl font-medium text-slate-700 mb-4 border-b pb-2">Informações Pessoais</h2>
          <div className="space-y-4">
            <div className="text-slate-600">
              <span className="font-medium">Nome:</span> {user.name}
              {/* Adicionar um botão de edição aqui futuramente */}
            </div>
            {user.municipalityId && (
              <div className="text-slate-600">
                <span className="font-medium">Município:</span> {user.municipalityId} (Ajustar para nome)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}