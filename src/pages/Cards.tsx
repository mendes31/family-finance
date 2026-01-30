import { useState, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, CreditCard as CardIcon, MoreVertical, Calendar, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreditCards, useCardInvoice, useDeleteCreditCard, CreditCard } from '@/hooks/useCreditCards';
import { creditCardsApi } from '@/lib/api';
import { AddCreditCardModal } from '@/components/modals/AddCreditCardModal';
import { EditCreditCardModal } from '@/components/modals/EditCreditCardModal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useFamilyMembers } from '@/hooks/useFamily';
import { useIsAdmin } from '@/hooks/useUserRole';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

function CardWithInvoice({ 
  card, 
  isSelected, 
  onSelect,
  onEdit,
  onDelete,
  selectedMonth,
  selectedYear,
  memberId,
}: { 
  card: CreditCard; 
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  selectedMonth: number;
  selectedYear: number;
  memberId?: string;
}) {
  const { data: invoice } = useCardInvoice(card.id, selectedMonth, selectedYear, memberId);
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
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300',
        isSelected ? 'ring-2 ring-accent scale-[1.02]' : 'hover:scale-[1.02]'
      )}
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
      }}
      onClick={onSelect}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border-2 border-current" />
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border-2 border-current" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-lg font-semibold text-white">{card.name}</p>
            <p className="text-xs text-white/70 uppercase tracking-wider">{card.brand}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Invoice */}
        <div className="mb-4">
          <p className="text-white/70 text-sm mb-1">Fatura Atual</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(currentInvoice)}</p>
        </div>

        {/* Usage Bar */}
        <div className="mb-3">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                usagePercentage > 80
                  ? 'bg-red-400'
                  : usagePercentage > 50
                  ? 'bg-yellow-400'
                  : 'bg-white'
              )}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>Disponível: {formatCurrency(available)}</span>
          <span>{Math.round(usagePercentage)}% usado</span>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20 text-xs text-white/60">
          <span>Fecha dia {card.closing_day}</span>
          <span>Vence dia {card.due_day}</span>
        </div>
      </div>
    </div>
  );
}

export default function Cards() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);
  
  // Seleção de mês/ano para visualizar fatura
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  
  // Filtro de membro (apenas para admin)
  const { isAdmin } = useIsAdmin();
  const { data: members = [] } = useFamilyMembers();
  const [memberFilter, setMemberFilter] = useState<string | 'all'>('all');
  
  const { data: cards = [], isLoading, error } = useCreditCards(
    isAdmin && memberFilter !== 'all' ? memberFilter : undefined
  );
  const deleteCreditCard = useDeleteCreditCard();
  
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i + 5); // Últimos 5 anos + próximos 5

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalLimit = cards.reduce((acc, card) => acc + Number(card.credit_limit), 0);
  
  // Buscar invoices de todos os cartões para calcular o disponível total
  const invoiceQueries = useQueries({
    queries: cards.map(card => ({
      queryKey: ['card-invoice', card.id, selectedMonth, selectedYear, isAdmin && memberFilter !== 'all' ? memberFilter : undefined],
      queryFn: async () => {
        try {
          const response = await creditCardsApi.getInvoice(
            card.id, 
            selectedMonth, 
            selectedYear,
            isAdmin && memberFilter !== 'all' ? memberFilter : undefined
          );
          if (response.error) throw new Error(response.error);
          
          // Normalizar a resposta para sempre ter availableBalance (camelCase)
          // A API retorna available_balance (snake_case), mas vamos normalizar para camelCase
          const normalizedResponse = {
            ...response,
            availableBalance: response.available_balance !== undefined && response.available_balance !== null
              ? Number(response.available_balance)
              : (() => {
                  const limit = Number(response.credit_limit || card.credit_limit || 0);
                  const openAmount = Number(response.total_open_amount || 0);
                  return Math.max(0, limit - openAmount);
                })(),
            creditLimit: response.credit_limit || response.creditLimit || card.credit_limit || 0,
            totalOpenAmount: response.total_open_amount || response.totalOpenAmount || 0,
          };
          
          // Garantir que availableBalance é um número válido
          if (isNaN(normalizedResponse.availableBalance) || !isFinite(normalizedResponse.availableBalance)) {
            const limit = Number(normalizedResponse.creditLimit || card.credit_limit || 0);
            const openAmount = Number(normalizedResponse.totalOpenAmount || 0);
            normalizedResponse.availableBalance = Math.max(0, limit - openAmount);
          }
          
          return normalizedResponse;
        } catch (error) {
          console.error(`Erro ao buscar invoice do cartão ${card.id}:`, error);
          // Se der erro, lançar novamente para que o query seja marcado como erro
          // NÃO usar limite como fallback para não distorcer o resultado
          throw error;
        }
      },
      enabled: cards.length > 0 && !!card.id,
      staleTime: 30000, // Cache por 30 segundos
    }))
  });
  
  const totalAvailable = useMemo(() => {
    if (cards.length === 0) {
      return 0;
    }
    
    // Verificar se todas as queries já carregaram (sucesso ou erro)
    const allQueriesFinished = invoiceQueries.length === cards.length && 
                                invoiceQueries.every(query => !query.isLoading && (query.isSuccess || query.isError));
    
    // Se ainda não todas as queries finalizaram, retornar undefined para mostrar loading
    if (!allQueriesFinished || invoiceQueries.length === 0) {
      return undefined;
    }
    
    let available = 0;
    let cardsProcessed = 0;
    
    invoiceQueries.forEach((query, index) => {
      const card = cards[index];
      if (!card) return;
      
      if (query.isSuccess && query.data) {
        // A resposta pode vir em snake_case (available_balance) ou camelCase (availableBalance)
        // Verificar ambos os formatos
        let cardAvailable = null;
        
        // Prioridade 1: usar availableBalance (camelCase) se estiver presente
        let balance = query.data.availableBalance;
        // Prioridade 2: usar available_balance (snake_case) se camelCase não estiver presente
        if (balance === null || balance === undefined) {
          balance = query.data.available_balance;
        }
        
        if (balance !== null && 
            balance !== undefined && 
            typeof balance === 'number' &&
            !isNaN(balance) && 
            isFinite(balance)) {
          cardAvailable = balance;
        }
        // Prioridade 3: calcular usando total_open_amount ou totalOpenAmount se balance não estiver disponível
        else {
          const limit = Number(query.data.credit_limit || query.data.creditLimit || card.credit_limit || 0);
          const openAmount = Number(query.data.total_open_amount || query.data.totalOpenAmount || 0);
          cardAvailable = Math.max(0, limit - openAmount);
        }
        
        // Se conseguiu calcular, adicionar ao total
        if (cardAvailable !== null && cardAvailable >= 0 && !isNaN(cardAvailable) && isFinite(cardAvailable)) {
          available += cardAvailable;
          cardsProcessed++;
        } else {
          // Se não conseguiu calcular, não adicionar nada (evita usar limite como fallback)
          console.warn(`Cartão ${card.name}: não foi possível calcular available_balance. Balance: ${balance}, Dados:`, query.data);
        }
      } else if (query.isError) {
        // Se deu erro, não adicionar nada para não distorcer o resultado
        // Não usar limite como fallback porque distorceria o resultado
        console.error(`Erro ao buscar invoice do cartão ${card.name} (${card.id}):`, query.error);
      }
    });
    
    // Se não conseguiu processar nenhum cartão, retornar undefined para mostrar loading
    if (cardsProcessed === 0 && cards.length > 0) {
      console.warn('Nenhum cartão foi processado com sucesso para calcular totalAvailable');
      return undefined;
    }
    
    // Garantir que o valor calculado é válido antes de retornar
    const finalAvailable = available >= 0 && !isNaN(available) && isFinite(available) ? available : 0;
    
    // Debug: logar o valor calculado (pode remover depois)
    if (cardsProcessed > 0) {
      console.log(`Total Available calculado: R$ ${finalAvailable.toFixed(2)} (${cardsProcessed} cartões processados)`);
    }
    
    // Retornar a soma calculada (mesmo que seja 0 se não houver parcelas abertas)
    return finalAvailable;
  }, [invoiceQueries, cards]);

  const handleEdit = (card: CreditCard) => {
    setCardToEdit(card);
    setEditModalOpen(true);
  };

  const handleDelete = (card: CreditCard) => {
    setCardToDelete(card);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!cardToDelete) return;
    
    try {
      await deleteCreditCard.mutateAsync(cardToDelete.id);
      toast.success('Cartão excluído com sucesso!');
      setDeleteDialogOpen(false);
      setCardToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir cartão');
    }
  };

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4">Erro ao carregar cartões</p>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-1">
              Cartões de Crédito
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus cartões e acompanhe os limites
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Seletor de mês/ano */}
            <div className="flex items-center gap-2">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="gradient" 
              className="gap-2" 
              onClick={() => setModalOpen(true)}
            >
              <Plus className="w-5 h-5" />
              Novo Cartão
            </Button>
          </div>
        </div>
      </header>

      {/* Filtro de Membro - apenas para admin */}
      {isAdmin && (
        <div className="mb-6 flex items-center gap-4">
          <Label htmlFor="member-filter" className="text-sm font-medium">
            Membro:
          </Label>
          <Select
            value={memberFilter}
            onValueChange={(value) => setMemberFilter(value as string | 'all')}
          >
            <SelectTrigger id="member-filter" className="w-[250px]">
              <SelectValue placeholder="Selecione um membro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os membros</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.full_name || member.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-income/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-income" />
              </div>
              <span className="text-sm text-muted-foreground">Limite Total</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground mb-1">
              {formatCurrency(totalLimit)}
            </p>
            <p className="text-sm text-muted-foreground">
              Disponível: <span className="font-semibold text-foreground">
                {totalAvailable !== undefined ? formatCurrency(totalAvailable) : 'Carregando...'}
              </span>
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-expense/10 flex items-center justify-center">
                <CardIcon className="w-5 h-5 text-expense" />
              </div>
              <span className="text-sm text-muted-foreground">Cartões Ativos</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              {cards.length}
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <span className="text-sm text-muted-foreground">Este Mês</span>
            </div>
            <p className="text-2xl font-display font-bold text-accent">
              {months[selectedMonth - 1].label} de {selectedYear}
            </p>
          </div>
        </div>
      ) : null}

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
            <CardIcon className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">
            Nenhum cartão cadastrado
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Adicione seus cartões de crédito para acompanhar as faturas e limites disponíveis
          </p>
          <Button variant="gradient" className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus className="w-5 h-5" />
            Adicionar Primeiro Cartão
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardWithInvoice
                card={card}
                isSelected={selectedCard === card.id}
                onSelect={() => setSelectedCard(selectedCard === card.id ? null : card.id)}
                onEdit={() => handleEdit(card)}
                onDelete={() => handleDelete(card)}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                memberId={isAdmin && memberFilter !== 'all' ? memberFilter : undefined}
              />
            </div>
          ))}

          {/* Add Card Button */}
          <div
            className="rounded-2xl border-2 border-dashed border-border hover:border-primary/50 p-6 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 hover:bg-muted/50 min-h-[300px]"
            onClick={() => setModalOpen(true)}
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">Adicionar Cartão</p>
          </div>
        </div>
      )}

      <AddCreditCardModal open={modalOpen} onOpenChange={setModalOpen} />
      
      <EditCreditCardModal 
        open={editModalOpen} 
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setCardToEdit(null);
        }}
        card={cardToEdit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cartão "{cardToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
