import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '@/lib/api';
import { useAuth } from './useAuth';
import { useFamily } from './useFamily';

export interface ExpenseByCategory {
  name: string;
  value: number;
  color: string;
}

export interface ExpensesByCategoryFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  memberId?: string;
}

export function useExpensesByCategory(filters?: ExpensesByCategoryFilters) {
  const { user } = useAuth();
  const { data: family } = useFamily();

  return useQuery({
    queryKey: ['expenses-by-category', family?.id, filters],
    queryFn: async () => {
      if (!user || !family) return [];

      const now = new Date();
      const startDate = filters?.startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = filters?.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await transactionsApi.getExpensesByCategory(startDate, endDate, filters?.memberId);

      // Aggregate by category
      const categoryMap = new Map<string, { name: string; value: number; color: string }>();

      response.expenses?.forEach((t: any) => {
        const categoryName = t.category_name || 'Sem categoria';
        // Usar cor da categoria, se não houver, gerar uma cor baseada no nome
        let categoryColor = t.category_color;
        if (!categoryColor || categoryColor === '') {
          // Gerar cor baseada no hash do nome da categoria
          const hash = categoryName.split('').reduce((acc: number, char: string) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
          }, 0);
          const hue = Math.abs(hash) % 360;
          categoryColor = `hsl(${hue}, 70%, 50%)`;
        }
        const amount = Number(t.total_amount || 0);

        // Só adicionar se o valor for maior que zero
        if (amount <= 0) return;

        // Filter by category if specified
        if (filters?.categoryId && t.category_id !== filters.categoryId) {
          return;
        }

        if (categoryMap.has(categoryName)) {
          const existing = categoryMap.get(categoryName)!;
          existing.value += amount;
        } else {
          categoryMap.set(categoryName, {
            name: categoryName,
            value: amount,
            color: categoryColor,
          });
        }
      });

      return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);
    },
    enabled: !!user && !!family,
  });
}
