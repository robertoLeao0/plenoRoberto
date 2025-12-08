import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useQuery } from '@tanstack/react-query'; 

// === NOVAS IMPORTAÇÕES ORGANIZADAS ===

// Auth
import LoginPage from './pages/auth/Login';

// Layouts
import MainLayout from './components/layouts/MainLayout'; 

// Páginas do Servidor
import ServidorDashboard from './pages/servidor/dashboard';
import ServidorRanking from './pages/servidor/ranking';
import ServidorSettings from './pages/servidor/settings';
import Support from './pages/servidor/support';
import ServerTasks from './pages/servidor/tasks';

// Páginas do Gestor
import GestorDashboard from './pages/gestor/dashboard';

// Páginas do Admin
import AdminDashboard from './pages/admin/dashboard';
import AdminUsersList from './pages/admin/users/List';
import AdminCreateUser from './pages/admin/users/Create';
import AdminProjectsList from './pages/admin/projects/List';
import AdminProjectCreate from './pages/admin/projects/Create';
import EditTask from './pages/admin/projects/Edit';
import ProjectTasks from './pages/admin/projects/Tasks';


// Serviços
import api from './services/api'; 

// Componente que lida com o redirecionamento e carrega o layout
function DashboardWrapper() {
  const { data: user, isLoading } = useQuery<{role: 'ADMIN_PLENO' | 'GESTOR_MUNICIPIO' | 'SERVIDOR'}>({
    queryKey: ['user-me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
    retry: false, 
  });

  if (isLoading) {
    return <div className="p-6 text-center">Carregando perfil...</div>;
  }
  
  if (!user || !user.role) {
    return <Navigate to="/login" replace />;
  }
  
  // Determina a rota base para redirecionamento
  const userBaseRoute = `/dashboard/${user.role.toLowerCase().replace('_', '-')}`;
  const isDashboardRoute = window.location.pathname.endsWith(userBaseRoute);

  // Renderiza o Layout que recebe a Role para desenhar o menu correto
  return (
    <MainLayout userRole={user.role}>
      <Routes>
        {/* Rotas Específicas do Servidor */}
        <Route path="servidor" element={<ServidorDashboard />} />
        <Route path="servidor/ranking" element={<ServidorRanking />} />
        <Route path="servidor/settings" element={<ServidorSettings />} />
        <Route path="servidor/support" element={<Support />} />
        <Route path="servidor/tarefas" element={<ServerTasks />} />

        {/* Rotas Específicas do Admin */}
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/users" element={<AdminUsersList />} />
        <Route path="admin/users/create" element={<AdminCreateUser />} />
        <Route path="admin/projects" element={<AdminProjectsList />} /> 
        <Route path="admin/projects/create" element={<AdminProjectCreate />} />
        <Route path="admin/projects/edit/:id" element={<EditTask />} />
        <Route path="admin/projects/:projectId/tasks" element={<ProjectTasks />} />
        <Route path="gestor" element={<GestorDashboard />} />
        
        
        {/* Rota Padrão: Redireciona para o dashboard correto */}
        {isDashboardRoute && <Route path="/" element={<Navigate to={userBaseRoute} replace />} />}
        
      </Routes>
    </MainLayout>
  );
}


function App() {
  return (
    <>
      <ToastContainer autoClose={3000} position="top-right" aria-label="Notifications" />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* O DashboardWrapper vai pegar o perfil logado e decidir qual Layout/Menu usar */}
        <Route path="/dashboard/*" element={<DashboardWrapper />} /> 

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;