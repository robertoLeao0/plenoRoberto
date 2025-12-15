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
interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'GESTOR_ORGANIZACAO' | 'USUARIO';
  avatarUrl?: string | null;
  organization?: {
    name: string;
  } | null;
}

interface MainLayoutProps {
  children: React.ReactNode;
  user: User;
}

// === TIPAGEM DO MENU ===
interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType;
  exact?: boolean; // <--- NOVA PROPRIEDADE: Define se a rota deve ser exata
}

// === DEFINIÇÃO DOS MENUS ===
const MENUS: Record<string, MenuItem[]> = {
  ADMIN: [
    // exact: true impede que o Painel fique ativo ao entrar em outras telas
    { label: 'Painel Principal', path: '/dashboard/admin', icon: LayoutDashboard, exact: true },
    { label: 'Organizações', path: '/dashboard/admin/organizations', icon: Building2 },
    { label: 'Usuários', path: '/dashboard/admin/users', icon: Users },
    { label: 'Projetos', path: '/dashboard/admin/projects', icon: FolderKanban },
    { label: 'Integrações', path: '/dashboard/admin/integrations', icon: Plug },
  ],
  GESTOR_ORGANIZACAO: [
    { label: 'Painel Gestor', path: '/dashboard/gestor', icon: LayoutDashboard, exact: true },
    { label: 'Meus Projetos', path: '/dashboard/gestor/projetos', icon: FolderKanban },
    { label: 'Minha Equipe', path: '/dashboard/gestor/equipe', icon: Users },
  ],
  USUARIO: [
    { label: 'Minha Jornada', path: '/dashboard/servidor', icon: LayoutDashboard, exact: true },
    { label: 'Tarefas', path: '/dashboard/servidor/tarefas', icon: CheckSquare },
    { label: 'Ranking', path: '/dashboard/servidor/ranking', icon: Trophy },
    { label: 'Suporte', path: '/dashboard/servidor/support', icon: LifeBuoy },
  ]
};

export default function MainLayout({ children, user }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

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
          fixed md:relative h-full
        `}
      >
        {/* LOGO */}
        <div className="h-16 flex items-center justify-between px-6 bg-[#1f2937] border-b border-gray-700 shrink-0">
          {isSidebarOpen ? (
            <span className="text-xl font-bold tracking-wider">PLENO</span>
          ) : (
            <span className="text-xl font-bold">P</span>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden">
            <X size={20} />
          </button>
        </div>

        {/* NAVEGAÇÃO */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-700">
          <ul className="space-y-1 px-3">
            {currentMenu.map((item) => {
              
              // === LÓGICA CORRIGIDA ===
              // Se tiver 'exact: true', compara igualdade exata (para o Painel Principal).
              // Se não, verifica se começa com o path (para Usuários, Projetos e suas sub-telas).
              const isActive = item.exact 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                    `}
                  >
                    <div className={`${!isActive && 'group-hover:text-white'} transition-colors`}>
                        <item.icon size={20} />
                    </div>
                    
                    {isSidebarOpen && (
                        <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* RODAPÉ */}
        <div className="p-3 border-t border-gray-800 bg-[#0f1522] shrink-0">
          <ul className="space-y-1">
            <li>
              <Link
                to="/dashboard/configuracoes"
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                  ${location.pathname.startsWith('/dashboard/configuracoes')
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                `}
              >
                <Settings size={20} />
                {isSidebarOpen && <span className="text-sm font-medium">Configurações</span>}
              </Link>
            </li>
            
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

      {/* === CONTEÚDO === */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        
        {/* HEADER SUPERIOR */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-md text-gray-600"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800 leading-tight">
                {user.name || 'Usuário'}
              </p>
              
              {user.organization ? (
                 <p className="text-xs text-blue-600 font-medium">{user.organization.name}</p>
              ) : (
                 <p className="text-xs text-gray-400">Sem Organização</p>
              )}
            </div>
            
            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200">
               {user.avatarUrl ? (
                 <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <UserCircle size={28} />
               )}
            </div>
          </div>
        </header>

        {/* ÁREA ROLÁVEL (PÁGINAS) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 w-full">
          <div className="max-w-7xl mx-auto h-full">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}