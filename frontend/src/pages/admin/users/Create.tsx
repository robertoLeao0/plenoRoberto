import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, User, Mail, Phone, Building2, FileText, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../services/api';

export default function AdminUserCreate() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Busca organizações
  const { data: organizations } = useQuery({
    queryKey: ['organizations-list-simple'],
    queryFn: async () => (await api.get('/organizations')).data,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    organizationId: '',
    role: 'USUARIO'
  });

  // === MÁSCARAS DE INPUT ===
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
    // Máscara: (11) 99999-9999
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); 
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    setFormData({ ...formData, phone: value.slice(0, 15) }); // Limita tamanho
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    // Máscara: 000.000.000-00
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setFormData({ ...formData, cpf: value.slice(0, 14) });
  };

  // ==========================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      return toast.warn('Por favor, preencha Nome, E-mail e Telefone.');
    }

    setIsLoading(true);
    try {
      // Limpa as máscaras antes de enviar (remove pontos e traços) se o banco pedir limpo
      // Se o banco aceita formatado, pode enviar direto. Vou enviar limpo para garantir.
      const payload = {
        ...formData,
        // Se quiser salvar limpo no banco, descomente as linhas abaixo:
        // phone: formData.phone.replace(/\D/g, ''), 
        // cpf: formData.cpf.replace(/\D/g, ''),
        organizationId: formData.organizationId || null,
      };

      await api.post('/users', payload);
      toast.success('Usuário criado com sucesso!');
      navigate('/dashboard/admin/users'); 
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('E-mail, CPF ou Telefone já cadastrados.');
      } else {
        toast.error('Erro ao criar usuário.');
      }
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Novo Usuário</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* NOME */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Roberto Leão"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail <span className="text-red-500">*</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                required
                type="email"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="usuario@email.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          {/* TELEFONE (COM MÁSCARA) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp <span className="text-red-500">*</span></label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={handlePhoneChange} // <--- Usa o formatador aqui
                maxLength={15}
              />
            </div>
          </div>

          {/* CPF (COM MÁSCARA) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={handleCPFChange} // <--- Usa o formatador aqui
                maxLength={14}
              />
            </div>
          </div>

          {/* CARGO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
            <div className="relative">
              <Shield className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <select 
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="USUARIO">Usuário Padrão</option>
                <option value="GESTOR_ORGANIZACAO">Gestor de Organização</option>
                <option value="ADMIN">Administrador (Pleno)</option>
              </select>
            </div>
          </div>

          {/* ORGANIZAÇÃO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organização</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <select 
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                value={formData.organizationId}
                onChange={e => setFormData({...formData, organizationId: e.target.value})}
              >
                <option value="">Sem Organização (Livre)</option>
                {organizations?.map((org: any) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        <div className="pt-4 border-t flex justify-end">
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
          >
            <Save size={18} />
            {isLoading ? 'Salvando...' : 'Criar Usuário'}
          </button>
        </div>

      </form>
    </div>
  );
}