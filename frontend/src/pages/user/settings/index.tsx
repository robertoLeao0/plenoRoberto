import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { FaUserCircle, FaEnvelope, FaLock } from 'react-icons/fa';
import { Eye, EyeOff, X, Save } from 'lucide-react';

export default function UserSettings() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Definindo tipos para o formulário
  const { 
    register, 
    handleSubmit, 
    reset, 
    watch, 
    formState: { errors, isSubmitting } 
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
    retry: false,
  });

  const onUpdatePassword = async (data: any) => {
    console.log("Enviando dados de troca de senha...", data);
    try {
      // Chama a rota definida no UsersController do backend
      await api.patch('/users/update-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });
      
      toast.success("Senha alterada com sucesso!");
      setIsChangingPassword(false);
      reset();
    } catch (error: any) {
      console.error("Erro na requisição:", error);
      const msg = error.response?.data?.message || "Erro ao alterar senha";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  if (isLoading) return <div className="p-6 text-slate-600 font-medium">Carregando perfil...</div>;
  if (isError || !user) return <div className="p-6 text-red-600 font-medium">Não foi possível carregar os dados.</div>;

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl font-semibold text-slate-800 flex items-center">
          <FaUserCircle className="mr-3 text-indigo-600" size={32} /> Configurações de Perfil
        </h1>
        <p className="text-slate-500">Gerencie suas informações pessoais e credenciais de acesso.</p>
      </header>
      
      <div className="bg-white rounded-lg shadow-xl p-6 space-y-6 border border-slate-100">
        
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
              <span className="capitalize">{user.role?.toLowerCase()}</span>
            </div>
            
            {!isChangingPassword ? (
              <button 
                onClick={() => setIsChangingPassword(true)}
                className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition mt-2"
              >
                <FaLock className="mr-2" /> Alterar Senha
              </button>
            ) : (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase">Alterar Senha</h3>
                  <button type="button" onClick={() => {setIsChangingPassword(false); reset();}}>
                    <X size={18} className="text-slate-400 hover:text-red-500" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit(onUpdatePassword)} className="space-y-4">
                  {/* Senha Atual */}
                  <div className="relative">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Senha Atual</label>
                    <div className="relative">
                      <input 
                        type={showCurrentPassword ? "text" : "password"}
                        {...register("currentPassword", { required: "Senha atual obrigatória" })}
                        className={`w-full border p-2 rounded-md pr-10 outline-none focus:ring-2 focus:ring-indigo-500 ${errors.currentPassword ? 'border-red-500' : 'border-slate-300'}`} 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.currentPassword && <p className="text-xs text-red-500 mt-1">{errors.currentPassword.message as string}</p>}
                  </div>

                  {/* Nova Senha */}
                  <div className="relative">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Nova Senha</label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"}
                        {...register("newPassword", { 
                          required: "Nova senha obrigatória",
                          minLength: { value: 6, message: "Mínimo 6 caracteres" }
                        })}
                        className={`w-full border p-2 rounded-md pr-10 outline-none focus:ring-2 focus:ring-indigo-500 ${errors.newPassword ? 'border-red-500' : 'border-slate-300'}`} 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword.message as string}</p>}
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div className="relative">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Confirmar Nova Senha</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"}
                        {...register("confirmPassword", { 
                          required: "Confirmação obrigatória",
                          validate: (val: string) => val === watch('newPassword') || "As senhas não coincidem"
                        })}
                        className={`w-full border p-2 rounded-md pr-10 outline-none focus:ring-2 focus:ring-indigo-500 ${errors.confirmPassword ? 'border-red-500' : 'border-slate-300'}`} 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message as string}</p>}
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 text-white py-2 rounded-md font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:bg-slate-400 transition shadow-md shadow-indigo-100"
                  >
                    {isSubmitting ? "Processando..." : <><Save size={18} /> Atualizar Senha</>}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Informações Pessoais */}
        <div className="pt-6 border-t">
          <h2 className="text-xl font-medium text-slate-700 mb-4 border-b pb-2">Informações Pessoais</h2>
          <div className="space-y-4">
            <div className="text-slate-600">
              <span className="font-medium">Nome:</span> {user.name}
            </div>
            {user.organization && (
              <div className="text-slate-600 flex items-center">
                <span className="font-medium mr-2">Instituição:</span> 
                <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold border border-indigo-100">
                  {user.organization.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}