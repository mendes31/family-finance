import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';
import { useAuth } from './useAuth';
import { useFamily } from './useFamily';
import { TransactionType } from './useTransactions';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string | null;
  color: string | null;
  family_id: string | null;
  is_default: boolean;
  created_at: string;
}

export function useCategories(type?: TransactionType) {
  const { user } = useAuth();
  const { data: family } = useFamily();

  return useQuery({
    queryKey: ['categories', family?.id, type],
    queryFn: async () => {
      if (!user) return [];
      
      const response = await categoriesApi.list(type);
      return response.categories as Category[];
    },
    enabled: !!user,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: async (input: { name: string; type: TransactionType; icon?: string; color?: string }) => {
      if (!family) throw new Error('Família não encontrada');

      const response = await categoriesApi.create({
        name: input.name,
        type: input.type,
        icon: input.icon || null,
        color: input.color || null,
      });
      
      return response.category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; name?: string; icon?: string; color?: string }) => {
      const response = await categoriesApi.update(input);
      return response.category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await categoriesApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
