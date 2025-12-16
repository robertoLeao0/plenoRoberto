import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/Login';
import MainLayout from '../components/layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';

// Imports das páginas
import AdminDashboard from '../pages/admin/dashboard'; 
import GestorDashboard from '../pages/gestor/dashboard';
import UserDashboard from '../pages/user/dashboard';
// 👇 IMPORTAR A NOVA PÁGINA AQUI
import UserTasks from '../pages/user/tasks'; 

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  return <MainLayout user={user}>{children}</MainLayout>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" />} />

      {/* ADMIN */}
      <Route path="/dashboard/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />

      {/* GESTOR */}
      <Route path="/dashboard/gestor" element={<PrivateRoute><GestorDashboard /></PrivateRoute>} />

      {/* User (USUARIO) */}
      <Route path="/dashboard/user" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
      
      {/* 👇 ADICIONE ESTA LINHA PARA A TELA BRANCA SUMIR */}
      <Route path="/dashboard/user/tarefas" element={<PrivateRoute><UserTasks /></PrivateRoute>} />
      
      {/* Adicionei também as outras rotas do menu lateral para evitar tela branca nelas também */}
      <Route path="/dashboard/user/ranking" element={<PrivateRoute><div className="p-6">Página de Ranking em construção</div></PrivateRoute>} />
      <Route path="/dashboard/user/support" element={<PrivateRoute><div className="p-6">Página de Suporte em construção</div></PrivateRoute>} />

      <Route path="*" element={<div>Página não encontrada</div>} />
    </Routes>
  );
}