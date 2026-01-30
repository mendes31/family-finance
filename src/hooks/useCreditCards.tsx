import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditCardsApi, transactionsApi } from '@/lib/api';
import { useAuth } from './useAuth';
import { useFamily } from './useFamily';

export interface CreditCard {
  id: string;
  name: string;
  brand: string;
  color?: string | null;
  holder_id: string;
  family_id: string;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCreditCardInput {
  name: string;
  brand: string;
  color?: string | null;
  credit_limit: number;
  closing_day: number;
  due_day: number;
}

export interface UpdateCreditCardInput {
  id: string;
  name?: string;
  brand?: string;
  color?: string | null;
  credit_limit?: number;
  closing_day?: number;
  due_day?: number;
  is_active?: boolean;
}

export function useCreditCards(memberId?: string) {
  const { user } = useAuth();
  const { data: family } = useFamily();

  return useQuery<CreditCard[], Error>({
    queryKey: ['credit-cards', family?.id, memberId],
    queryFn: async () => {
      if (!user || !family) return [];
      
      const response = await creditCardsApi.list(true, memberId);
      if (response.error) {
        throw new Error(response.error);
      }
      return (response.credit_cards || []) as CreditCard[];
    },
    enabled: !!user && !!family,
  });
}

export function useCreateCreditCard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: family } = useFamily();

  return useMutation<CreditCard, Error, CreateCreditCardInput>({
    mutationFn: async (input: CreateCreditCardInput) => {
      if (!user || !family) throw new Error('Usuário ou família não encontrada');

      try {
        const response = await creditCardsApi.create({
          name: input.name,
          brand: input.brand,
          color: input.color || null,
          credit_limit: input.credit_limit,
          closing_day: input.closing_day,
          due_day: input.due_day,
        });
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        if (!response.credit_card) {
          throw new Error('Resposta inválida da API');
        }
        
        return response.credit_card as CreditCard;
      } catch (error: any) {
        console.error('Erro na mutation createCreditCard:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
    },
  });
}

export function useUpdateCreditCard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: family } = useFamily();

  return useMutation<CreditCard, Error, UpdateCreditCardInput>({
    mutationFn: async (input: UpdateCreditCardInput) => {
      if (!user || !family) throw new Error('Usuário ou família não encontrada');

      try {
        console.log('Enviando atualização do cartão:', input);
        const response = await creditCardsApi.update(input);
        console.log('Resposta da API:', response);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        if (!response.credit_card) {
          throw new Error('Resposta inválida da API');
        }
        
        return response.credit_card as CreditCard;
      } catch (error: any) {
        console.error('Erro na mutation updateCreditCard:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
    },
  });
}

export function useDeleteCreditCard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user || !family) throw new Error('Usuário ou família não encontrada');
      await creditCardsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
    },
  });
}

export function useCardInvoice(cardId: string, month?: number, year?: number, memberId?: string) {
  const { data: family } = useFamily();

  return useQuery({
    queryKey: ['card-invoice', cardId, month, year, memberId],
    queryFn: async () => {
      if (!family || !cardId) return null;

      const response = await creditCardsApi.getInvoice(cardId, month, year, memberId);
      if (response.error) {
        throw new Error(response.error);
      }
      
      return {
        total: response.current_invoice?.total || 0,
        transactionCount: response.current_invoice?.transaction_count || 0,
        availableBalance: response.available_balance || 0,
        creditLimit: response.credit_limit || 0,
        totalOpenAmount: response.total_open_amount || 0,
        usedPercentage: response.used_percentage || 0,
        currentInvoice: response.current_invoice,
        nextInvoice: response.next_invoice,
      };
    },
    enabled: !!cardId && !!family,
  });
}
