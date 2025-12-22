import React, { useState, useEffect } from 'react';
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
  exact?: boolean;
}

// === DEFINIÇÃO DOS MENUS ===
const MENUS: Record<string, MenuItem[]> = {
  ADMIN: [
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
    { label: 'Minha Jornada', path: '/dashboard/user', icon: LayoutDashboard, exact: true },
    { label: 'Tarefas', path: '/dashboard/user/tarefas', icon: CheckSquare },
    { label: 'Ranking', path: '/dashboard/user/ranking', icon: Trophy },
    { label: 'Suporte', path: '/dashboard/user/support', icon: LifeBuoy },
  ]
};

export default function MainLayout({ children, user }: MainLayoutProps) {
  // Define se a sidebar está expandida (Desktop) ou visível (Mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Começa fechado no mobile por padrão
  const location = useLocation();
  const navigate = useNavigate();

  // Seleciona o menu com base no cargo
  const currentMenu = MENUS[user.role] || [];

  // Fecha o menu automaticamente no mobile ao mudar de rota
  useEffect(() => {
    // Detecta se é tela pequena (mobile)
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* === OVERLAY MOBILE (Fundo escuro ao abrir menu no cel) === */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* === SIDEBAR (Barra Lateral) === */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 h-full bg-[#111827] text-white flex flex-col transition-all duration-300 shadow-xl
          md:relative 
          ${isSidebarOpen 
            ? 'w-64 translate-x-0' // Aberto: Largura cheia
            : 'w-64 -translate-x-full md:w-20 md:translate-x-0' // Fechado: Escondido no mobile, Mini no Desktop
          }
        `}
      >
        {/* LOGO */}
        <div className="h-16 flex items-center justify-between px-4 bg-[#1f2937] border-b border-gray-700 shrink-0">
          <div className="flex items-center justify-center w-full">
            {isSidebarOpen ? (
               <span className="text-xl font-bold tracking-wider text-white">PLENO</span>
            ) : (
               <span className="text-xl font-bold text-white md:block hidden">P</span> // Só mostra "P" no desktop fechado
            )}
            
            {/* Título PLENO no mobile mesmo quando fechado/abrindo */}
            <span className="md:hidden text-xl font-bold tracking-wider text-white ml-2 block">
                {/* No mobile, o menu sempre tem largura total quando aparece, então mostra PLENO */}
            </span>
          </div>

          {/* Botão fechar (Apenas Mobile) */}
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="md:hidden text-gray-400 hover:text-white absolute right-4"
          >
            <X size={24} />
          </button>
        </div>

        {/* NAVEGAÇÃO */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-700">
          <ul className="space-y-1 px-3">
            {currentMenu.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    title={!isSidebarOpen ? item.label : ''} // Tooltip nativo quando fechado
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                      ${!isSidebarOpen && 'md:justify-center'} // Centraliza ícones no desktop mini
                    `}
                  >
                    <div className={`${!isActive && 'group-hover:text-white'} transition-colors shrink-0`}>
                        <item.icon size={20} />
                    </div>
                    
                    {/* Texto: Mostra se aberto OU se estiver no mobile (já que no mobile ele desliza inteiro) */}
                    <span className={`
                      text-sm font-medium truncate transition-all duration-300
                      ${isSidebarOpen ? 'opacity-100 w-auto' : 'md:opacity-0 md:w-0 md:hidden'}
                    `}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* RODAPÉ (Config e Sair) */}
        <div className="p-3 border-t border-gray-800 bg-[#0f1522] shrink-0">
          <ul className="space-y-1">
            <li>
              <Link
                to="/dashboard/configuracoes"
                title="Configurações"
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                  ${location.pathname.startsWith('/dashboard/configuracoes')
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                   ${!isSidebarOpen && 'md:justify-center'}
                `}
              >
                <Settings size={20} />
                <span className={`${isSidebarOpen ? 'block' : 'md:hidden'} text-sm font-medium`}>
                  Configurações
                </span>
              </Link>
            </li>
            
            <li>
              <button
                onClick={handleLogout}
                title="Sair"
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors
                  ${!isSidebarOpen && 'md:justify-center'}
                `}
              >
                <LogOut size={20} />
                <span className={`${isSidebarOpen ? 'block' : 'md:hidden'} text-sm font-medium`}>
                  Sair
                </span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* === ÁREA DE CONTEÚDO PRINCIPAL === */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        
        {/* HEADER */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
          {/* Botão Hambúrguer (Abre/Fecha Sidebar) */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-md text-gray-600 transition-colors focus:outline-none"
          >
            <Menu size={24} />
          </button>

          {/* Área do Usuário */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800 leading-tight">
                {user.name || 'Usuário'}
              </p>
              {user.organization && (
                 <p className="text-xs text-gray-500">{user.organization.name}</p>
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

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 w-full">
          <div className="max-w-7xl mx-auto h-full">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}