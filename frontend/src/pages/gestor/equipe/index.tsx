import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { UserCircle, Mail, Phone } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'GESTOR_ORGANIZACAO' | 'USUARIO';
  avatarUrl?: string;
}

export default function GestorEquipePage() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['gestor-team-list'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users'); 
      return data;
    },
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'GESTOR_ORGANIZACAO': return 'Gestor';
      case 'USUARIO': return 'Colaborador';
      default: return role;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Minha Equipe</h1>
        <p className="text-slate-500 mt-1">Membros vinculados à sua organização.</p>
      </header>

      {isLoading ? (
        <div className="text-center p-10 text-slate-500">Carregando equipe...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users?.map((user) => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                    <UserCircle className="text-slate-400" size={32} />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-slate-800 truncate">{user.name}</h3>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700 mb-2">
                    {getRoleLabel(user.role)}
                </span>
                <div className="space-y-1 text-sm text-slate-500">
                    <div className="flex items-center gap-2 truncate"><Mail size={14} /><span>{user.email}</span></div>
                    {user.phone && <div className="flex items-center gap-2"><Phone size={14} /><span>{user.phone}</span></div>}
                </div>
              </div>
            </div>
          ))}
          {(!users || users.length === 0) && !error && (
             <p className="text-slate-500 col-span-full text-center py-10">Nenhum membro encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
}