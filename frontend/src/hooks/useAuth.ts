import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

type LoginPayload = { email: string; password: string };

export function useLogin() {
  return useMutation(async (payload: LoginPayload) => {
    const { data } = await api.post('/auth/login', payload);
    localStorage.setItem('accessToken', data.accessToken);
    return data;
  });
}
