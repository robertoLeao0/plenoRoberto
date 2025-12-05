import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';

const roleToPath: Record<string, string> = {
  ADMIN_PLENO: '/dashboard/admin',
  GESTOR_MUNICIPIO: '/dashboard/gestor',
  SERVIDOR: '/dashboard/servidor',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const login = useLogin();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await login.mutateAsync({ email, password });
    const path = roleToPath[result.user.role] ?? '/dashboard/servidor';
    navigate(path);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-sky-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md border border-slate-100">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Painel Descomplicadamente</h1>
        <p className="text-slate-500 mb-6">Faça login para acompanhar suas microações diárias.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600">E-mail</label>
            <input
              className="w-full border rounded px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-indigo-200"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600">Senha</label>
            <input
              className="w-full border rounded px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-indigo-200"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
            disabled={login.isPending}
          >
            {login.isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        {login.isError && <p className="text-red-500 text-sm mt-4">Não foi possível autenticar.</p>}
      </div>
    </div>
  );
}
