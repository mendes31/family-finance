import { cn } from '@/lib/utils';
import { CreditCard as CreditCardType } from '@/hooks/useCreditCards';
import { useCardInvoice } from '@/hooks/useCreditCards';
import { CreditCard as CardIcon } from 'lucide-react';

interface CreditCardWidgetProps {
  cards?: CreditCardType[];
}

const brandColors: Record<string, string> = {
  'Visa': '#1a1f71',
  'Mastercard': '#eb001b',
  'Elo': '#00a4e0',
  'American Express': '#006fcf',
  'Hipercard': '#822124',
  'Diners Club': '#0079be',
  'Nubank': '#8a3ab9',
  'Inter': '#ff7a00',
  'C6 Bank': '#1a1a1a',
};

function CardItem({ card, selectedMonth, selectedYear }: { card: CreditCardType; selectedMonth?: number; selectedYear?: number }) {
  const { data: invoice } = useCardInvoice(card.id, selectedMonth, selectedYear);
  // Fatura atual = soma das transações no período de fechamento
  const currentInvoice = invoice?.total || 0;
  // Valor disponível = limite - todas as parcelas abertas
  const available = invoice?.availableBalance ?? (Number(card.credit_limit) - (invoice?.totalOpenAmount || 0));
  const limit = invoice?.creditLimit || Number(card.credit_limit);
  // Percentual de uso baseado no total de parcelas abertas (não apenas fatura atual)
  const usagePercentage = invoice?.usedPercentage || 0;
  // Usar cor personalizada primeiro, depois fallback para cores padrão
  const color = card.color || brandColors[card.name] || brandColors[card.brand] || '#6b7280';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 cursor-pointer group opacity-90 hover:opacity-100 transition-opacity w-full flex flex-col min-h-[180px]"
      style={{
        background: `linear-gradient(135deg, ${color}dd 0%, ${color}bb 100%)`,
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border-2 border-current" />
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border-2 border-current" />
      </div>

      <div className="relative flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-white/70 mb-0.5">Fatura Atual</p>
              <p className="text-lg font-bold text-white">{formatCurrency(currentInvoice)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70 uppercase tracking-wider">{card.brand}</p>
              <p className="text-sm font-semibold text-white">{card.name}</p>
            </div>
          </div>

          {/* Usage Bar */}
          <div className="mb-2">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  usagePercentage > 80 ? 'bg-red-400' : usagePercentage > 50 ? 'bg-yellow-400' : 'bg-white'
                )}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-white/70">
              Disponível: <span className="font-semibold text-white">{formatCurrency(available)}</span>
            </span>
            <span className="text-white/70">
              Limite: {formatCurrency(limit)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-white/20 text-xs text-white/60">
          <span>Fecha dia {card.closing_day}</span>
          <span>Vence dia {card.due_day}</span>
        </div>
      </div>
    </div>
  );
}

export function CreditCardWidget({ cards = [], selectedMonth, selectedYear, memberId }: CreditCardWidgetProps & { selectedMonth?: number; selectedYear?: number; memberId?: string }) {
  if (cards.length === 0) {
    return (
      <div className="bg-card rounded-2xl border-2 border-dashed border-border p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <CardIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">Nenhum cartão cadastrado</p>
        <p className="text-sm text-muted-foreground mt-1">
          Adicione um cartão usando as ações rápidas
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col gap-3 overflow-y-auto overflow-x-hidden pr-1" style={{ scrollbarWidth: 'thin' }}>
      {cards.map((card, index) => (
        <div
          key={card.id}
          className="animate-slide-up shrink-0"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardItem card={card} selectedMonth={selectedMonth} selectedYear={selectedYear} memberId={memberId} />
        </div>
      ))}
    </div>
  );
}
