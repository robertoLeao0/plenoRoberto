import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../hooks/useAuth';

const roleToPath: Record<string, string> = {
  ADMIN: '/dashboard-admin',
  GESTOR: '/dashboard-gestor',
  SERVIDOR: '/dashboard-servidor',
};

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const register = useRegister();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await register.mutateAsync({ name, email, password });
    const path = roleToPath[result.user?.role] ?? '/dashboard-servidor';
    navigate(path);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-sky-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md border border-slate-100">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Criar conta</h1>
        <p className="text-slate-500 mb-6">Cadastre-se para começar sua jornada de 21 dias.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600">Nome</label>
            <input
              className="w-full border rounded px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-indigo-200"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
            disabled={register.isPending}
          >
            {register.isPending ? 'Registrando...' : 'Criar conta'}
          </button>
        </form>
        {register.isError && (
          <p className="text-red-500 text-sm mt-4">Não foi possível criar sua conta. Tente novamente.</p>
        )}
        <p className="text-sm text-slate-600 mt-6 text-center">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
