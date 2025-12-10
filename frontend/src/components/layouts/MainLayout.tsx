import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FolderKanban, 
  Plug, 
  LogOut, 
  Menu, 
  X,
  Trophy,
  LifeBuoy,
  CheckSquare,
  Settings,
  UserCircle
} from 'lucide-react';

// === TIPAGEM DO USUÁRIO ===
// Precisa bater com o que vem do Backend
interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'GESTOR_ORGANIZACAO' | 'USUARIO';
  avatarUrl?: string | null;
  organization?: {
    name: string;
  };
}

interface MainLayoutProps {
  children: React.ReactNode;
  user: User; // Recebe o usuário completo
}

// === DEFINIÇÃO DOS MENUS POR PERFIL ===
const MENUS = {
  ADMIN: [
    { label: 'Painel Principal', path: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Organizações', path: '/dashboard/admin/organizations', icon: Building2 },
    { label: 'Usuários', path: '/dashboard/admin/users', icon: Users },
    { label: 'Projetos', path: '/dashboard/admin/projects', icon: FolderKanban },
    { label: 'Integrações', path: '/dashboard/admin/integrations', icon: Plug },
  ],
  GESTOR_ORGANIZACAO: [
    { label: 'Painel Gestor', path: '/dashboard/gestor', icon: LayoutDashboard },
    { label: 'Meus Projetos', path: '/dashboard/gestor/projetos', icon: FolderKanban },
    { label: 'Minha Equipe', path: '/dashboard/gestor/equipe', icon: Users },
  ],
  USUARIO: [
    { label: 'Minha Jornada', path: '/dashboard/servidor', icon: LayoutDashboard },
    { label: 'Tarefas', path: '/dashboard/servidor/tarefas', icon: CheckSquare },
    { label: 'Ranking', path: '/dashboard/servidor/ranking', icon: Trophy },
    { label: 'Suporte', path: '/dashboard/servidor/support', icon: LifeBuoy },
  ]
};

export default function MainLayout({ children, user }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Seleciona o menu baseado na role do usuário
  const currentMenu = MENUS[user.role] || [];

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* === SIDEBAR === */}
      <aside 
        className={`
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          bg-[#111827] text-white flex flex-col transition-all duration-300 shadow-xl z-20
          absolute md:relative h-full
        `}
      >
        {/* LOGO */}
        <div className="h-16 flex items-center justify-between px-6 bg-[#1f2937] border-b border-gray-700">
          {isSidebarOpen ? (
            <span className="text-xl font-bold tracking-wider">PLENO</span>
          ) : (
            <span className="text-xl font-bold">P</span>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden">
            <X size={20} />
          </button>
        </div>

        {/* NAVEGAÇÃO PRINCIPAL (Cresce com flex-1) */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {currentMenu.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                    `}
                  >
                    <item.icon size={20} />
                    {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* RODAPÉ DO SIDEBAR (CONFIGURAÇÕES E SAIR) */}
        <div className="p-3 border-t border-gray-800 bg-[#0f1522]">
          <ul className="space-y-1">
            {/* Link Configurações */}
            <li>
              <Link
                to="/dashboard/configuracoes"
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                  ${location.pathname === '/dashboard/configuracoes' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                `}
              >
                <Settings size={20} />
                {isSidebarOpen && <span className="text-sm font-medium">Configurações</span>}
              </Link>
            </li>
            
            {/* Botão Sair */}
            <li>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
              >
                <LogOut size={20} />
                {isSidebarOpen && <span className="text-sm font-medium">Sair</span>}
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* === ÁREA DE CONTEÚDO === */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* HEADER SUPERIOR */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-md text-gray-600"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              {/* NOME: Exibe o nome do usuário */}
              <p className="text-sm font-bold text-gray-800">
                {user.name || 'Usuário'}
              </p>
              
              {/* ORGANIZAÇÃO: Exibe o nome ou 'Sem Organização' */}
              {user.organization ? (
                 <p className="text-xs text-blue-600 font-medium">{user.organization.name}</p>
              ) : (
                 <p className="text-xs text-gray-400">Sem Organização</p>
              )}
            </div>
            
            {/* AVATAR */}
            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 overflow-hidden border border-gray-300">
               {user.avatarUrl ? (
                 <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <UserCircle size={28} />
               )}
            </div>
          </div>
        </header>

        {/* CONTEÚDO DA PÁGINA (Outlet) */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}