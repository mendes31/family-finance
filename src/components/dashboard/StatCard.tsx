import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  type: 'income' | 'expense' | 'investment' | 'balance';
  change?: number;
  delay?: number;
  pendingValue?: number;
}

export function StatCard({ title, value, icon, type, change, delay = 0, pendingValue }: StatCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const typeStyles = {
    income: 'stat-card-income',
    expense: 'stat-card-expense',
    investment: 'stat-card-investment',
    balance: 'bg-gradient-hero text-primary-foreground',
  };

  const iconStyles = {
    income: 'bg-income/15 text-income',
    expense: 'bg-expense/15 text-expense',
    investment: 'bg-investment/15 text-investment',
    balance: 'bg-primary-foreground/20 text-primary-foreground',
  };

  const isBalance = type === 'balance';

  return (
    <div
      className={cn('stat-card animate-slide-up', typeStyles[type])}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            iconStyles[type]
          )}
        >
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg',
              change >= 0 ? 'bg-income/20 text-income' : 'bg-expense/20 text-expense',
              isBalance && (change >= 0 ? 'bg-income/30' : 'bg-expense/30')
            )}
          >
            {change >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <p
        className={cn(
          'text-sm font-medium mb-1',
          isBalance ? 'text-primary-foreground/80' : 'text-muted-foreground'
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          'text-2xl lg:text-3xl font-display font-semibold animate-number',
          isBalance ? 'text-primary-foreground' : 'text-foreground'
        )}
      >
        {formatCurrency(value)}
      </p>
      {pendingValue !== undefined && pendingValue > 0 && (type === 'expense' || type === 'income') && (
        <p className={cn('text-xs mt-1', isBalance ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          Em aberto: {formatCurrency(pendingValue)}
        </p>
      )}
    </div>
  );
}
