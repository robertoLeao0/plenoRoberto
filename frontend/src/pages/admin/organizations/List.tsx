import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MapPin, Users, FolderKanban, Building2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

interface Organization {
  id: string;
  name: string;
  location?: string;
  type: 'SYSTEM' | 'CUSTOMER';
  active: boolean;
  _count?: { // O segredo: Pode ser opcional
    users: number;
    projects: number;
  };
}

export default function OrganizationsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // === BUSCAR ORGANIZAÇÕES ===
  const { data: organizations, isLoading, isError, error } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await api.get('/organizations');
      console.log("Back retornou:", response.data); // Debug no F12
      return response.data;
    },
  });

  // === CRIAR ===
  const createOrgMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/organizations', data);
    },
    onSuccess: () => {
      toast.success('Organização criada!');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setIsModalOpen(false);
    },
    onError: () => {
      toast.error('Erro ao criar organização.');
    },
  });

  // Filtro Seguro
  const filteredOrgs = Array.isArray(organizations) 
    ? organizations.filter(org => org?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  if (isLoading) return <div className="p-10 text-center text-gray-500">Carregando...</div>;
  
  if (isError) {
    console.error(error);
    return <div className="p-10 text-center text-red-500">Erro ao carregar lista. Verifique o console.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Organizações</h1>
          <p className="text-gray-500">Gerencie as prefeituras e empresas clientes.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
        >
          <Plus size={20} /> Nova Organização
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrgs.map((org) => (
          <div key={org.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${org.type === 'SYSTEM' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{org.name || 'Sem Nome'}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${org.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {org.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-6">
               <div className="flex items-center gap-2">
                 <MapPin size={16} className="text-gray-400" />
                 <span>{org.location || 'Local não definido'}</span>
               </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {/* A CORREÇÃO ESTÁ AQUI: O ? e o ?? evitam a tela branca */}
                <div className="flex items-center gap-1" title="Usuários">
                  <Users size={16} /> {org._count?.users ?? 0}
                </div>
                <div className="flex items-center gap-1" title="Projetos">
                  <FolderKanban size={16} /> {org._count?.projects ?? 0}
                </div>
              </div>
              
              <button 
                onClick={() => navigate(`/dashboard/admin/organizations/${org.id}`)}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                Detalhes
              </button>
            </div>
          </div>
        ))}

        {filteredOrgs.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            Nenhuma organização encontrada.
          </div>
        )}
      </div>

      {/* Modal Simplificado */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
             <div className="flex justify-between mb-4">
                <h3 className="font-bold">Nova Organização</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={20}/></button>
             </div>
             <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createOrgMutation.mutate({ 
                    name: fd.get('name'), 
                    location: fd.get('location'), 
                    cnpj: fd.get('cnpj'),
                    type: 'CUSTOMER' 
                });
             }} className="space-y-4">
                <input name="name" required placeholder="Nome" className="w-full border p-2 rounded" />
                <input name="location" placeholder="Localização" className="w-full border p-2 rounded" />
                <input name="cnpj" placeholder="CNPJ" className="w-full border p-2 rounded" />
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Criar</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}