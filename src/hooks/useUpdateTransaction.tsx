import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/lib/api';
import { Transaction, PaymentMethod } from './useTransactions';

export interface UpdateTransactionInput {
  id: string;
  description?: string;
  amount?: number;
  date?: string;
  purchase_date?: string;
  due_date?: string;
  category_id?: string;
  payment_method?: PaymentMethod;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  credit_card_id?: string;
  notes?: string;
  is_recurring?: boolean;
  recurrence_period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrence_end_date?: string;
  is_installment?: boolean;
  total_installments?: number;
  recalculate_installments?: boolean;
  installment_base_amount?: number;
  installment_difference?: number;
  update_installments?: boolean;
  update_recurrences?: boolean;
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTransactionInput) => {
      const response = await transactionsApi.update(input);
      return response.transaction as Transaction;
    },
    onSuccess: async (data, variables) => {
      // Se atualizou recorrências ou parcelas, precisa de uma atualização mais agressiva
      if (variables.update_recurrences || variables.update_installments) {
        // Aguardar um pouco para garantir que o commit do banco foi finalizado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Remover completamente do cache para forçar nova busca
        queryClient.removeQueries({ 
          queryKey: ['transactions'],
          exact: false 
        });
        
        // Remover também dashboard-summary
        queryClient.removeQueries({ 
          queryKey: ['dashboard-summary'],
          exact: false 
        });
        
        // Remover invoices de cartões
        queryClient.removeQueries({ 
          queryKey: ['card-invoice'],
          exact: false 
        });
        
        // Aguardar um pouco mais
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Forçar refetch de todas as queries ativas
        await queryClient.refetchQueries({ 
          queryKey: ['transactions'],
          exact: false,
          type: 'active'
        });
        
        await queryClient.refetchQueries({ 
          queryKey: ['dashboard-summary'],
          exact: false,
          type: 'active'
        });
        
        await queryClient.refetchQueries({ 
          queryKey: ['card-invoice'],
          exact: false,
          type: 'active'
        });
      } else {
        // Para atualizações normais (sem recorrências/parcelas), apenas invalidar
        queryClient.invalidateQueries({ 
          queryKey: ['transactions'],
          exact: false 
        });
        
        queryClient.invalidateQueries({ 
          queryKey: ['dashboard-summary'],
          exact: false 
        });
        
        queryClient.invalidateQueries({ 
          queryKey: ['card-invoice'],
          exact: false 
        });
      }
    },
  });
}

