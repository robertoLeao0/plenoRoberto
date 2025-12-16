import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Mail, Phone, User, ShieldCheck, 
  Settings, Trash2, Crown, Plus
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api';

export default function OrganizationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Estado para abrir/fechar o modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // 1. BUSCAR DADOS
  const { data: org, isLoading } = useQuery({
    queryKey: ['organization', id],
    queryFn: async () => {
      const res = await api.get(`/organizations/${id}`);
      return res.data;
    },
  });

  // 2. MUTATION: ADICIONAR
  const addMemberMutation = useMutation({
    mutationFn: async (email: string) => {
      return api.post(`/organizations/${id}/members`, { email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
      toast.success('Membro adicionado!');
      setIsModalOpen(false);
      setNewMemberEmail('');
    },
    onError: () => toast.error('Erro ao adicionar membro. Verifique o e-mail.')
  });

  // 3. MUTATION: PROMOVER GESTOR
  const promoteManagerMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.patch(`/organizations/${id}/manager`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
      toast.success('Gestor atualizado!');
    },
  });

  // 4. MUTATION: REMOVER
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.delete(`/organizations/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
      toast.success('Membro removido.');
    },
  });

  if (isLoading) return <div className="p-8">Carregando...</div>;
  if (!org) return <div className="p-8">Organização não encontrada.</div>;

  const gestorAtual = org.members?.find((m: any) => m.role === 'GESTOR_ORGANIZACAO');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* HEADER VOLTAR */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Voltar para Organizações
      </button>

      {/* HEADER INFO */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <BuildingIcon />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{org.name}</h1>
                    <p className="text-gray-400 text-sm">Matriz do Sistema • {org.location || 'Local não definido'}</p>
                </div>
            </div>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${org.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {org.active ? 'Ativa' : 'Inativa'}
            </span>
        </div>

        {/* BOX GESTOR */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-4">
            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm">
                <User size={20} />
            </div>
            <div>
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wide">Gestor Responsável</p>
                {gestorAtual ? (
                    <p className="text-gray-800 font-medium">{gestorAtual.name}</p>
                ) : (
                    <p className="text-gray-400 italic">Nenhum gestor definido</p>
                )}
            </div>
        </div>
      </div>

      {/* LISTA DE MEMBROS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Membros e Acompanhamento</h2>
            <p className="text-sm text-gray-400">Gerencie quem tem acesso a esta organização.</p>
          </div>
          
          {/* 👇 AQUI ESTÁ O BOTÃO QUE VOCÊ QUERIA 👇 */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Settings size={16} />
            Gerenciar
          </button>
        </div>

        <table className="w-full text-left text-sm text-gray-600">
          <tbody className="divide-y divide-gray-100">
            {org.members?.map((member: any) => (
              <tr key={member.id} className="hover:bg-gray-50 group">
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{member.name}</p>
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                            {member.role}
                        </span>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-4">
                   <p className="flex items-center gap-2"><Mail size={12}/> {member.email}</p>
                   <p className="flex items-center gap-2 text-gray-400"><Phone size={12}/> {member.phone || '-'}</p>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {member.role !== 'GESTOR_ORGANIZACAO' && (
                        <button title="Tornar Gestor" onClick={() => promoteManagerMutation.mutate(member.id)} className="p-2 text-purple-600 hover:bg-purple-50 rounded"><Crown size={16}/></button>
                      )}
                      <button title="Remover" onClick={() => removeMemberMutation.mutate(member.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* === MODAL DE ADICIONAR === */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Adicionar Membro</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
             </div>
             
             <p className="text-sm text-gray-500 mb-4">
               Digite o e-mail de um usuário já cadastrado no sistema para vinculá-lo aqui.
             </p>
             
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail do Usuário</label>
                    <input 
                    type="email" 
                    placeholder="ex: roberto@pleno.com"
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    autoFocus
                    />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => addMemberMutation.mutate(newMemberEmail)}
                        disabled={addMemberMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {addMemberMutation.isPending ? 'Adicionando...' : <><Plus size={18}/> Adicionar</>}
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Pequeno helper para o ícone
function BuildingIcon() { return <ShieldCheck size={24} />; }