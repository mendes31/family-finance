import { useQuery } from '@tanstack/react-query';
import { userRoleApi } from '@/lib/api';
import { useAuth } from './useAuth';

export type AppRole = 'user' | 'admin';

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const response = await userRoleApi.get();
      return response.role as AppRole | null;
    },
    enabled: !!user,
  });
}

export function useIsAdmin() {
  const { data: role, isLoading } = useUserRole();
  return { isAdmin: role === 'admin', isLoading };
}
