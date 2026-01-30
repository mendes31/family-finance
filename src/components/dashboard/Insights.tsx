import { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Target, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DashboardSummaryFilters } from '@/hooks/useTransactions';
import { useDashboardSummary } from '@/hooks/useTransactions';
import { useTransactions } from '@/hooks/useTransactions';

interface InsightsProps {
  filters?: DashboardSummaryFilters;
}

export function Insights({ filters }: InsightsProps) {
  const { data: summary } = useDashboardSummary(filters);
  const { data: transactions = [] } = useTransactions({
    type: filters?.type,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
    memberId: filters?.memberId,
  });

  const insights = useMemo(() => {
    if (!summary || transactions.length === 0) return [];

    const insightsList: Array<{
      type: 'positive' | 'warning' | 'info';
      icon: React.ElementType;
      title: string;
      description: string;
      value?: string;
    }> = [];

    // Insight 1: Saldo positivo/negativo
    if (summary.balance > 0) {
      insightsList.push({
        type: 'positive',
        icon: TrendingUp,
        title: 'Saldo Positivo',
        description: 'Parabéns! Você está com saldo positivo no período.',
        value: `R$ ${summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      });
    } else if (summary.balance < 0) {
      insightsList.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'Atenção: Saldo Negativo',
        description: 'Seu saldo está negativo. Considere revisar suas despesas.',
        value: `R$ ${Math.abs(summary.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      });
    }

    // Insight 2: Proporção receitas/despesas
    if (summary.income > 0 && summary.expense > 0) {
      const ratio = summary.expense / summary.income;
      if (ratio > 0.9) {
        insightsList.push({
          type: 'warning',
          icon: AlertCircle,
          title: 'Despesas Altas',
          description: `Você está gastando ${(ratio * 100).toFixed(0)}% das suas receitas. Considere reduzir despesas.`,
        });
      } else if (ratio < 0.5) {
        insightsList.push({
          type: 'positive',
          icon: Target,
          title: 'Boa Gestão',
          description: `Você está gastando apenas ${(ratio * 100).toFixed(0)}% das suas receitas. Ótimo controle!`,
        });
      }
    }

    // Insight 3: Investimentos
    if (summary.investment > 0 && summary.income > 0) {
      const investmentRatio = summary.investment / summary.income;
      if (investmentRatio >= 0.2) {
        insightsList.push({
          type: 'positive',
          icon: TrendingUp,
          title: 'Excelente!',
          description: `Você está investindo ${(investmentRatio * 100).toFixed(0)}% das suas receitas. Continue assim!`,
        });
      } else if (investmentRatio > 0) {
        insightsList.push({
          type: 'info',
          icon: Target,
          title: 'Invista Mais',
          description: `Você está investindo ${(investmentRatio * 100).toFixed(0)}% das receitas. Considere aumentar para 20% ou mais.`,
        });
      }
    }

    // Insight 4: Maior receita/despesa
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    if (incomeTransactions.length > 0) {
      const maxIncome = incomeTransactions.reduce((max, t) => 
        t.amount > max.amount ? t : max
      );
      insightsList.push({
        type: 'info',
        icon: ArrowDownLeft,
        title: 'Maior Receita',
        description: `${maxIncome.description}`,
        value: `R$ ${maxIncome.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      });
    }

    if (expenseTransactions.length > 0) {
      const maxExpense = expenseTransactions.reduce((max, t) => 
        t.amount > max.amount ? t : max
      );
      insightsList.push({
        type: 'info',
        icon: ArrowUpRight,
        title: 'Maior Despesa',
        description: `${maxExpense.description}`,
        value: `R$ ${maxExpense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      });
    }

    return insightsList.slice(0, 4); // Limitar a 4 insights
  }, [summary, transactions]);

  if (insights.length === 0) {
    return (
      <div className="h-full w-full max-w-full flex flex-col bg-card rounded-2xl border border-border shadow-card">
        <div className="pb-4 shrink-0 p-5 pb-4 border-b border-border">
          <h2 className="text-base font-display font-medium text-foreground">Insights</h2>
          <p className="text-xs text-muted-foreground mt-1">Análises inteligentes sobre suas finanças</p>
        </div>
        <div className="flex-1 p-5 pt-4 max-w-full">
          <p className="text-sm text-muted-foreground text-center py-4">
            Adicione transações para ver insights personalizados
          </p>
        </div>
      </div>
    );
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'positive':
        return {
          bg: 'bg-green-500/10 border-green-500/20',
          icon: 'text-green-500',
          badge: 'bg-green-500/20 text-green-600',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/20',
          icon: 'text-yellow-500',
          badge: 'bg-yellow-500/20 text-yellow-600',
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/20',
          icon: 'text-blue-500',
          badge: 'bg-blue-500/20 text-blue-600',
        };
    }
  };

  return (
    <div className="h-full w-full max-w-full flex flex-col bg-card rounded-2xl border border-border shadow-card">
      <div className="pb-4 shrink-0 p-5 pb-4 border-b border-border">
        <h2 className="text-base font-display font-medium text-foreground">Insights</h2>
        <p className="text-xs text-muted-foreground mt-1">Análises inteligentes sobre suas finanças</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-5 pt-4 min-h-0 max-w-full">
        {insights.map((insight, index) => {
          const styles = getTypeStyles(insight.type);
          const Icon = insight.icon;
          
          return (
            <div
              key={index}
              className={`p-3 rounded-lg border ${styles.bg} transition-all hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${styles.icon} bg-background/50 shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-foreground">{insight.title}</h4>
                    {insight.value && (
                      <Badge variant="outline" className={`${styles.badge} text-xs px-2 py-0.5`}>
                        {insight.value}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

