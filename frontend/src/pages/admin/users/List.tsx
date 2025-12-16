import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building2, UserX, Upload, FileSpreadsheet, X, Download, Filter, Phone, Mail, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import * as XLSX from 'xlsx';

export default function AdminUsersList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [orgFilter, setOrgFilter] = useState(''); 
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // 1. BUSCAR ORGANIZAÇÕES (Para o Filtro)
  const { data: organizations } = useQuery({
    queryKey: ['organizations-list-simple'],
    queryFn: async () => (await api.get('/organizations')).data,
  });

  // 2. BUSCAR USUÁRIOS (Com Filtro de Org)
  const { data: users, isLoading } = useQuery({
    queryKey: ['users-list', orgFilter],
    queryFn: async () => {
      const params = orgFilter ? { organizationId: orgFilter } : {};
      const response = await api.get('/users', { params });
      return response.data;
    },
  });

  // Importação (Mutation)
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (orgFilter && orgFilter !== 'null') {
         formData.append('organizationId', orgFilter);
      }
      return await api.post('/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (data) => {
      toast.success(`Importação: ${data.data.success} sucessos, ${data.data.errors.length} erros.`);
      if (data.data.errors.length > 0) alert('Erros:\n' + data.data.errors.join('\n'));
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setIsImportModalOpen(false);
      setFileToUpload(null);
    },
    onError: () => toast.error('Erro ao importar.'),
  });

  const handleDownloadModel = () => {
    const ws = XLSX.utils.json_to_sheet([
      { NOME: 'Fulano da Silva', EMAIL: 'fulano@email.com', TELEFONE: '11999999999', CPF: '12345678900', MUNICIPIO: 'Nome da Org' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "modelo_importacao_usuarios.xlsx");
  };

  const filteredUsers = Array.isArray(users) 
    ? users.filter((u: any) => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())) 
    : [];

  return (
    <div className="space-y-6 p-6">
      
      {/* HEADER: Título e Ações */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
          <p className="text-gray-500">Gerencie o acesso ao sistema.</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FileSpreadsheet size={18} />
            <span className="hidden sm:inline">Importar</span>
          </button>
          
          <button 
            onClick={() => navigate('/dashboard/admin/users/create')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} /> 
            <span className="hidden sm:inline">Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* BARRA DE BUSCA E FILTROS */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <select 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none cursor-pointer"
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
          >
            <option value="">Todas Organizações</option>
            <option value="null">Sem Organização</option>
            {organizations?.map((org: any) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* === TABELA DE USUÁRIOS === */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-mail
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organização
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    Carregando usuários...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    {/* NOME + AVATAR */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatarUrl ? (
                            <img className="h-10 w-10 rounded-full object-cover" src={user.avatarUrl} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">CPF: {user.cpf || '-'}</div>
                        </div>
                      </div>
                    </td>

                    {/* TELEFONE */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone size={16} className="mr-2 text-gray-400" />
                        {user.phone || '-'}
                      </div>
                    </td>

                    {/* EMAIL */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail size={16} className="mr-2 text-gray-400" />
                        {user.email}
                      </div>
                    </td>

                    {/* ORGANIZAÇÃO */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.organization ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Building2 size={12} className="mr-1" />
                          {user.organization.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <UserX size={12} className="mr-1" />
                          Sem Organização
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL IMPORTAÇÃO (MANTIDO) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
             <div className="flex justify-between mb-4">
                <h3 className="font-bold text-lg flex gap-2"><Upload className="text-green-600"/> Importar Usuários</h3>
                <button onClick={() => setIsImportModalOpen(false)}><X size={20}/></button>
             </div>
             
             <div className="space-y-4">
                <button onClick={handleDownloadModel} className="text-sm text-blue-600 underline">Baixar Planilha Modelo</button>
                
                <div className="border-2 border-dashed p-8 text-center rounded-lg cursor-pointer hover:bg-gray-50 relative">
                    <input type="file" accept=".xlsx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFileToUpload(e.target.files?.[0] || null)} />
                    {fileToUpload ? <span className="text-green-600 font-medium">{fileToUpload.name}</span> : <span className="text-gray-500">Clique para selecionar o arquivo</span>}
                </div>

                <button 
                  onClick={() => fileToUpload && importMutation.mutate(fileToUpload)}
                  disabled={!fileToUpload || importMutation.isPending}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {importMutation.isPending ? 'Enviando...' : 'Iniciar Importação'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}