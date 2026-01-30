import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi } from '@/lib/api';
import { useAuth } from './useAuth';
import { useFamily } from './useFamily';

export interface FinancialGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  family_id: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string;
}

export interface UpdateGoalInput {
  id: string;
  name?: string;
  target_amount?: number;
  current_amount?: number;
  deadline?: string;
  is_completed?: boolean;
}

export function useGoals(isCompleted?: boolean) {
  const { user } = useAuth();
  const { data: family } = useFamily();

  return useQuery({
    queryKey: ['goals', family?.id, isCompleted],
    queryFn: async () => {
      if (!user || !family) return [];
      
      const response = await goalsApi.list(isCompleted);
      return response.goals as FinancialGoal[];
    },
    enabled: !!user && !!family,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      if (!family) throw new Error('Família não encontrada');

      const response = await goalsApi.create(input);
      return response.goal as FinancialGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateGoalInput) => {
      const response = await goalsApi.update(input);
      return response.goal as FinancialGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await goalsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

