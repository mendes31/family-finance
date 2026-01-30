import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/lib/api';
import { useAuth } from './useAuth';
import { useFamily } from './useFamily';

export type TransactionType = 'income' | 'expense' | 'investment';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'bank_slip' | 'transfer';
export type TransactionStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export type RecurrencePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  purchase_date: string | null;
  due_date: string | null;
  category_id: string | null;
  user_id: string;
  family_id: string;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  credit_card_id: string | null;
  is_installment: boolean;
  total_installments: number | null;
  current_installment: number | null;
  installment_group_id: string | null;
  is_recurring: boolean;
  recurrence_period: RecurrencePeriod | null;
  recurrence_end_date: string | null;
  recurrence_group_id: string | null;
  parent_recurrence_id: string | null;
  notes: string | null;
  attachment_url: string | null;
  attachments_count?: number;
  first_attachment_id?: string | null;
  created_at: string;
  updated_at: string;
  created_by_user_id?: string;
  created_by_full_name?: string;
  // Relacionamentos retornados pela API
  categories?: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
  } | null;
  credit_cards?: {
    id: string;
    name: string;
    brand?: string | null;
    color?: string | null;
  } | null;
}

export interface CreateTransactionInput {
  type: TransactionType;
  description: string;
  amount: number;
  purchase_date?: string;
  due_date?: string;
  category_id?: string;
  payment_method: PaymentMethod;
  status?: TransactionStatus;
  credit_card_id?: string;
  is_installment?: boolean;
  total_installments?: number;
  is_recurring?: boolean;
  recurrence_period?: RecurrencePeriod;
  recurrence_end_date?: string;
  notes?: string;
  attachment_url?: string;
}

export function useTransactions(filters?: {
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  limit?: number;
  memberId?: string;
}) {
  const { user } = useAuth();
  const { data: family } = useFamily();

  return useQuery({
    queryKey: ['transactions', user?.id, family?.id, filters],
    queryFn: async () => {
      if (!user || !family) return [];
      
      const response = await transactionsApi.list({
        type: filters?.type,
        status: filters?.status,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        categoryId: filters?.categoryId,
        limit: filters?.limit,
        memberId: filters?.memberId,
      });
      return response.transactions as Transaction[];
    },
    enabled: !!user && !!family,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      if (!user || !family) throw new Error('User or family not found');

      // Handle installments
      if (input.is_installment && input.total_installments && input.total_installments > 1) {
        const installmentGroupId = crypto.randomUUID();
        // Calcular valor base de cada parcela
        const baseInstallmentAmount = Math.floor((input.amount / input.total_installments) * 100) / 100; // Arredondar para 2 casas decimais
        // Calcular diferença de centavos para adicionar na última parcela
        const totalBaseAmount = baseInstallmentAmount * input.total_installments;
        const difference = Math.round((input.amount - totalBaseAmount) * 100) / 100; // Diferença em centavos
        
        // Usar purchase_date como base para todas as parcelas (mesma data de compra)
        if (!input.purchase_date) {
          throw new Error('purchase_date é obrigatório para transações parceladas');
        }
        
        const basePurchaseDate = new Date(input.purchase_date);
        
        // Calcular due_date base se não fornecido
        let baseDueDate: Date;
        if (input.due_date) {
          baseDueDate = new Date(input.due_date);
        } else if (input.credit_card_id) {
          // Para cartão, calcular baseado no purchase_date e due_day do cartão
          // Isso será feito no backend, aqui apenas usamos purchase_date + 1 mês como fallback
          baseDueDate = new Date(basePurchaseDate.getFullYear(), basePurchaseDate.getMonth() + 1, 1);
        } else {
          // Para outras formas, vence no mês seguinte à compra
          baseDueDate = new Date(basePurchaseDate.getFullYear(), basePurchaseDate.getMonth() + 1, 1);
        }
        
        const transactions = [];
        
        for (let i = 0; i < input.total_installments; i++) {
          // Calcular data de vencimento da parcela (mensal a partir da primeira)
          const installmentDueDate = new Date(baseDueDate);
          installmentDueDate.setMonth(installmentDueDate.getMonth() + i);
          
          // Data da compra (mesma para todas as parcelas)
          const installmentPurchaseDate = basePurchaseDate;
          
          // Adicionar diferença de centavos na última parcela
          const isLastInstallment = i === input.total_installments - 1;
          const installmentAmount = isLastInstallment 
            ? baseInstallmentAmount + difference 
            : baseInstallmentAmount;
          
          const transactionData = {
            type: input.type,
            description: `${input.description} (${i + 1}/${input.total_installments})`,
            amount: installmentAmount,
            purchase_date: installmentPurchaseDate.toISOString().split('T')[0],
            due_date: installmentDueDate.toISOString().split('T')[0],
            category_id: input.category_id || null,
            payment_method: input.payment_method,
            credit_card_id: input.credit_card_id || null,
            is_installment: true,
            total_installments: input.total_installments,
            current_installment: i + 1,
            installment_group_id: installmentGroupId,
            notes: input.notes || null,
            attachment_url: input.attachment_url || null,
          };
          
          const response = await transactionsApi.create(transactionData);
          transactions.push(response.transaction);
        }

        return transactions;
      }

      // Single transaction
      if (!input.purchase_date && !input.due_date) {
        throw new Error('purchase_date ou due_date é obrigatório');
      }
      
      const response = await transactionsApi.create({
        type: input.type,
        description: input.description,
        amount: input.amount,
        purchase_date: input.purchase_date || null,
        due_date: input.due_date || null,
        category_id: input.category_id || null,
        payment_method: input.payment_method,
        credit_card_id: input.credit_card_id || null,
        is_installment: false,
        is_recurring: input.is_recurring || false,
        recurrence_period: input.recurrence_period || null,
        recurrence_end_date: input.recurrence_end_date || null,
        notes: input.notes || null,
        attachment_url: input.attachment_url || null,
      });
      
      return response.transaction;
    },
    onSuccess: async () => {
      // Invalidar todas as queries relacionadas (com exact: false para pegar todas as variações)
      queryClient.invalidateQueries({ queryKey: ['transactions'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['card-invoice'], exact: false });
      
      // Aguardar um pouco para garantir que o commit do banco foi finalizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Forçar refetch imediato apenas das queries ativas (que estão sendo usadas)
      // type: 'active' garante que apenas queries que estão atualmente sendo usadas serão refetchadas
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['transactions'], exact: false, type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['dashboard-summary'], exact: false, type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['card-invoice'], exact: false, type: 'active' }),
      ]);
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await transactionsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['card-invoice'] });
    },
  });
}

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TransactionStatus }) => {
      const response = await transactionsApi.updateStatus(id, status);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['card-invoice'] });
    },
  });
}

export interface DashboardSummaryFilters {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  categoryId?: string;
  memberId?: string;
}

export function useDashboardSummary(filters?: DashboardSummaryFilters) {
  const { user } = useAuth();
  const { data: family } = useFamily();

  return useQuery({
    queryKey: ['dashboard-summary', family?.id, filters],
    queryFn: async () => {
      if (!user || !family) return null;

      const now = new Date();
      const startDate = filters?.startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = filters?.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // Se houver filtros de tipo ou categoria, buscar transações e calcular
      if (filters?.type || filters?.categoryId) {
        const response = await transactionsApi.list({
          type: filters?.type,
          startDate,
          endDate,
          categoryId: filters?.categoryId,
        });

        const transactions = response.transactions || [];

        const summary = {
          income: 0,
          expense: 0,
          investment: 0,
          balance: 0,
          expense_pending: 0,
          income_pending: 0,
        };

        transactions.forEach((t: any) => {
          const amount = Number(t.amount);
          if (t.type === 'income') {
            summary.income += amount;
            if (t.status === 'pending') {
              summary.income_pending += amount;
            }
          } else if (t.type === 'expense') {
            summary.expense += amount;
            if (t.status === 'pending') {
              summary.expense_pending += amount;
            }
          } else if (t.type === 'investment') {
            summary.investment += amount;
          }
        });

        summary.balance = summary.income - summary.expense - summary.investment;

        return summary;
      }

      // Caso contrário, usar a API de resumo (mais eficiente)
      const response = await transactionsApi.getSummary(startDate, endDate, filters?.memberId);

      return {
        income: response.summary?.income || 0,
        expense: response.summary?.expense || 0,
        investment: response.summary?.investment || 0,
        expense_pending: response.summary?.expense_pending || 0,
        income_pending: response.summary?.income_pending || 0,
        balance: (response.summary?.income || 0) - (response.summary?.expense || 0) - (response.summary?.investment || 0),
      };
    },
    enabled: !!user && !!family,
  });
}
