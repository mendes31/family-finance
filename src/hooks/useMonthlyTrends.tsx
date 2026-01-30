import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '@/lib/api';
import { useAuth } from './useAuth';
import { useFamily } from './useFamily';

export interface MonthlyTrendData {
  month: string;
  receitas: number;
  despesas: number;
  investimentos: number;
}

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export interface MonthlyTrendsFilters {
  year?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
  categoryId?: string;
  memberId?: string;
}

export function useMonthlyTrends(filters?: MonthlyTrendsFilters) {
  const { user } = useAuth();
  const { data: family } = useFamily();

  return useQuery({
    queryKey: ['monthly-trends', family?.id, filters],
    queryFn: async () => {
      if (!user || !family) return [];

      const year = filters?.year || new Date().getFullYear();
      const startDate = filters?.startDate || `${year}-01-01`;
      const endDate = filters?.endDate || `${year}-12-31`;

      const response = await transactionsApi.getMonthlyTrends(startDate, endDate, filters?.memberId);

      // Initialize all 12 months of the year
      const monthsData = new Map<string, MonthlyTrendData>();
      for (let i = 0; i < 12; i++) {
        const date = new Date(year, i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthsData.set(key, {
          month: monthNames[date.getMonth()],
          receitas: 0,
          despesas: 0,
          investimentos: 0,
        });
      }

      // Aggregate transactions by month
      response.trends?.forEach((t: any) => {
        const key = `${t.year}-${String(t.month).padStart(2, '0')}`;
        
        if (monthsData.has(key)) {
          const monthData = monthsData.get(key)!;
          const amount = Number(t.total_amount);

          if (t.type === 'income') {
            monthData.receitas += amount;
          } else if (t.type === 'expense') {
            monthData.despesas += amount;
          } else if (t.type === 'investment') {
            monthData.investimentos += amount;
          }
        }
      });

      return Array.from(monthsData.values());
    },
    enabled: !!user && !!family,
  });
}
