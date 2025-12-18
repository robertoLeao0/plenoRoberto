import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../../hooks/useAuth';

// 👇 CORREÇÃO: Os nomes aqui devem ser IGUAIS aos do Banco de Dados (Prisma)
const roleToPath: Record<string, string> = {
  'ADMIN': '/dashboard/admin',
  'GESTOR_ORGANIZACAO': '/dashboard/gestor',
  'USUARIO': '/dashboard/user',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const login = useLogin();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const result = await login.mutateAsync({ email, password });
      
      // Pega a role do usuário (garantindo que existe)
      const userRole = (result as { user: { role: string } }).user.role;
      
      // Procura o caminho certo. Se não achar, joga para login de novo para evitar tela cinza
      const path = roleToPath[userRole] || '/login';
      
      console.log('Redirecionando usuário', userRole, 'para', path); // Para debug
      navigate(path);
      
    } catch (error) {
      console.error("Erro no login", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow-xl rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Painel Pleno</h1>
        <p className="text-gray-500 mb-6">Entre com suas credenciais</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            disabled={login.isPending}
          >
            {login.isPending ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </form>
        {login.isError && <p className="text-red-500 text-sm mt-4 text-center">E-mail ou senha incorretos.</p>}
      </div>
    </div>
  );
}