import { Plus, ArrowDownLeft, ArrowUpRight, TrendingUp, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickAction {
  label: string;
  icon: React.ElementType;
  variant: 'income' | 'expense' | 'investment' | 'default';
  onClick: () => void;
}

interface QuickActionsProps {
  onAddTransaction: (type: 'income' | 'expense' | 'investment') => void;
  onAddCard: () => void;
}

export function QuickActions({ onAddTransaction, onAddCard }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      label: 'Receita',
      icon: ArrowDownLeft,
      variant: 'income',
      onClick: () => onAddTransaction('income'),
    },
    {
      label: 'Despesa',
      icon: ArrowUpRight,
      variant: 'expense',
      onClick: () => onAddTransaction('expense'),
    },
    {
      label: 'Investimento',
      icon: TrendingUp,
      variant: 'investment',
      onClick: () => onAddTransaction('investment'),
    },
    {
      label: 'Cartão',
      icon: CreditCard,
      variant: 'default',
      onClick: onAddCard,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action, index) => (
        <Button
          key={action.label}
          variant={action.variant === 'default' ? 'secondary' : action.variant}
          className={cn(
            'h-auto py-3 flex-col gap-2 animate-scale-in',
            action.variant === 'default' && 'border-2 border-dashed border-border hover:border-primary'
          )}
          style={{ animationDelay: `${index * 100}ms` }}
          onClick={action.onClick}
        >
          <div className="w-10 h-10 rounded-xl bg-background/20 flex items-center justify-center">
            <action.icon className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
