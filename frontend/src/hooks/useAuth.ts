import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

type LoginPayload = { email: string; password: string };
type RegisterPayload = { name: string; email: string; password: string };

const persistSession = (data: any) => {
  if (data.accessToken) {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('accessToken', data.accessToken);
  }
  if (data.refreshToken) {
    localStorage.setItem('refreshToken', data.refreshToken);
  }
  if (data.user) {
    localStorage.setItem('role', data.user.role);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
  }
  return data;
};

export function useLogin() {
  return useMutation(async (payload: LoginPayload) => {
    const { data } = await api.post('/auth/login', payload);
    return persistSession(data);
  });
}

export function useRegister() {
  return useMutation(async (payload: RegisterPayload) => {
    const { data } = await api.post('/auth/register', payload);
    return persistSession(data);
  });
}
