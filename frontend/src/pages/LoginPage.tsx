import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin, useRegister } from '../hooks/useAuth';

const roleToPath: Record<string, string> = {
  ADMIN: '/dashboard-admin',
  GESTOR: '/dashboard-gestor',
  SERVIDOR: '/dashboard-servidor',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const navigate = useNavigate();
  const login = useLogin();
  const register = useRegister();

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();

      if (mode === 'login') {
        const result = await login.mutateAsync({ email, password });
        const path = roleToPath[result.user?.role] ?? '/dashboard-servidor';
        navigate(path);
        return;
      }

      const result = await register.mutateAsync({ name, email, password });
      const path = roleToPath[result.user?.role] ?? '/dashboard-servidor';
      navigate(path);
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-sky-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 mb-1">Painel Descomplicadamente</h1>
            <p className="text-slate-500 text-sm">
              {mode === 'login'
                ? 'Faça login para acompanhar suas microações diárias.'
                : 'Cadastre-se para começar sua jornada de 21 dias.'}
            </p>
          </div>
          <div className="bg-slate-100 rounded-full p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`px-3 py-1 rounded-full transition ${
                mode === 'login' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`px-3 py-1 rounded-full transition ${
                mode === 'register' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'
              }`}
            >
              Cadastro
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-slate-600">Nome completo</label>
              <input
                className="w-full border rounded px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-indigo-200"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={mode === 'register'}
              />
            </div>
          )}
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
            disabled={login.isPending || register.isPending}
          >
            {mode === 'login'
              ? login.isPending
                ? 'Entrando...'
                : 'Entrar'
              : register.isPending
                ? 'Cadastrando...'
                : 'Criar conta'}
          </button>
        </form>

        {(login.isError || register.isError) && (
          <p className="text-red-500 text-sm mt-4">Não foi possível {mode === 'login' ? 'autenticar' : 'criar sua conta'}.</p>
        )}
        <p className="text-sm text-slate-600 mt-6 text-center">
          Prefere páginas separadas?{' '}
          {mode === 'login' ? (
            <Link to="/register" className="text-indigo-600 hover:underline">
              Ir para cadastro
            </Link>
          ) : (
            <Link to="/login" className="text-indigo-600 hover:underline">
              Ir para login
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}
