import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import authApi, { LoginRequest, LoginResponse } from '../apis/auth.api';

const AUTH_USER_KEY = ['auth', 'user'];
const TOKEN_KEY = 'auth_token';

export function useAuth() {
  const queryClient = useQueryClient();

  // ─────────────────────────────
  // Get current user
  // ─────────────────────────────
  const userQuery = useQuery({
    queryKey: AUTH_USER_KEY,
    queryFn: authApi.getCurrentUser,
    enabled: !!localStorage.getItem(TOKEN_KEY),
    retry: false,
  });

  // ─────────────────────────────
  // Login
  // ─────────────────────────────
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data: LoginResponse) => {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      queryClient.setQueryData(AUTH_USER_KEY, data.user);
    },
  });

  // ─────────────────────────────
  // Logout
  // ─────────────────────────────
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      localStorage.removeItem(TOKEN_KEY);
      queryClient.removeQueries({ queryKey: AUTH_USER_KEY });
    },
  });

  return {
    // state
    user: userQuery.data ?? null,
    isAuthenticated: !!userQuery.data,
    isLoadingUser: userQuery.isLoading,

    // actions
    login: loginMutation.mutateAsync,
    register: (data: any) => {
      // We'll define a proper mutation for this
      return authApi.register(data).then(res => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        queryClient.setQueryData(AUTH_USER_KEY, res.user);
        return res;
      });
    },
    logout: logoutMutation.mutateAsync,

    // status
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
  };
}
