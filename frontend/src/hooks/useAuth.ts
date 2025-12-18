import { useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '../services/api';

type LoginPayload = { email: string; password: string };

// === 1. HOOK DE LOGIN (useLogin) ===
export function useLogin() {
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      // Faz o POST para o backend
      const { data } = await api.post('/auth/login', payload);
      
      // 👇 MELHORIA IMPORTANTE:
      // Salva o Token
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        // Configura o token no axios para as próximas requisições
        api.defaults.headers.Authorization = `Bearer ${data.accessToken}`;
      }
      
      // Salva o objeto User (Nome, Role, etc) para o MainLayout saber quem é você
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    },
    onError: (error) => {
      console.error("Erro ao fazer login:", error);
    }
  });
}

// === 2. HOOK DE AUTENTICAÇÃO (useAuth) - ESTAVA FALTANDO ===
// É este export que o arquivo de rotas está procurando e não achava.
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ao carregar a página, tenta recuperar o usuário salvo no navegador
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Garante que o token está no header da API
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
      } catch (error) {
        console.error("Erro ao processar usuário salvo:", error);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    }
    setIsLoading(false);
  }, []);

  return { 
    user, 
    isLoading,
    // Retorna true se tiver usuário, false se não tiver
    isAuthenticated: !!user 
  };
}