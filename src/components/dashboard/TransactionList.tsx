import { ArrowDownLeft, ArrowUpRight, TrendingUp, MoreVertical, Edit, Trash2, Repeat, CheckCircle2, ArrowDownCircle, File, CreditCard, Wallet, Banknote, Receipt, ArrowRightLeft, Paperclip, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Transaction, TransactionType, useUpdateTransactionStatus } from '@/hooks/useTransactions';
import { toast } from 'sonner';
import { useState } from 'react';
import { getCategoryIcon } from '@/lib/categoryIcons';

interface TransactionListProps {
  transactions: Transaction[];
  limit?: number;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onAnexos?: (transaction: Transaction) => void;
}

const typeConfig: Record<TransactionType, { icon: React.ElementType; color: string; bgColor: string }> = {
  income: { icon: ArrowDownLeft, color: 'text-income', bgColor: 'bg-income/10' },
  expense: { icon: ArrowUpRight, color: 'text-expense', bgColor: 'bg-expense/10' },
  investment: { icon: TrendingUp, color: 'text-investment', bgColor: 'bg-investment/10' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color?: string }> = {
  pending: { label: 'Pendente', variant: 'outline', color: 'text-yellow-600' },
  paid: { label: 'Paga/Recebida', variant: 'default', color: 'text-green-600' },
  overdue: { label: 'Vencida', variant: 'destructive', color: 'text-red-600' },
  cancelled: { label: 'Cancelada', variant: 'secondary', color: 'text-gray-500' },
};

export function TransactionList({ transactions, limit, onEdit, onDelete, onAnexos }: TransactionListProps) {
  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;
  const updateStatus = useUpdateTransactionStatus();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  const toggleCard = (transactionId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  const handlePay = async (transaction: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateStatus.mutateAsync({ id: transaction.id, status: 'paid' });
      toast.success(transaction.type === 'expense' ? 'Despesa marcada como paga!' : 'Receita marcada como recebida!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar status');
    }
  };

  const handleReceive = async (transaction: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateStatus.mutateAsync({ id: transaction.id, status: 'paid' });
      toast.success('Receita marcada como recebida!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar status');
    }
  };

  const handleDownloadAttachment = async (attachmentId: string, transactionId: string) => {
    try {
      // Fazer download do anexo
      const response = await fetch(`/family_finance/api/attachments.php?action=download&id=${attachmentId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao baixar anexo');
      }

      // Obter nome do arquivo do header
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'anexo';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }

      // Criar blob e fazer download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Anexo baixado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao baixar anexo');
    }
  };

  const handleViewAttachments = async (transactionId: string) => {
    try {
      // Buscar lista de anexos
      const response = await fetch(`/family_finance/api/attachments.php?action=list&transaction_id=${transactionId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar anexos');
      }

      const data = await response.json();
      const attachments = data.attachments || [];

      if (attachments.length === 0) {
        toast.error('Nenhum anexo encontrado');
        return;
      }

      // Se houver apenas um anexo, baixar diretamente
      if (attachments.length === 1) {
        handleDownloadAttachment(attachments[0].id, transactionId);
      } else {
        // Se houver múltiplos anexos, baixar o primeiro (ou abrir modal no futuro)
        handleDownloadAttachment(attachments[0].id, transactionId);
        toast.info(`${attachments.length} anexos encontrados. Baixando o primeiro...`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao buscar anexos');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  };

  if (displayTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <ArrowUpRight className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">Nenhum lançamento encontrado</p>
        <p className="text-sm text-muted-foreground mt-1">
          Adicione sua primeira transação usando as ações rápidas acima
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {displayTransactions.map((transaction, index) => {
        const config = typeConfig[transaction.type];
        const Icon = config.icon;

        const isExpanded = expandedCards.has(transaction.id);
        
        return (
          <div
            key={transaction.id}
            className={cn(
              "rounded-xl bg-card border border-border hover:shadow-md transition-all duration-200 animate-slide-up group",
              index < displayTransactions.length - 1 && "mb-2"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Card Principal - Mobile Friendly */}
            <div className="flex items-start gap-3 p-3 sm:p-4">
              {/* Ícone do tipo */}
              <div className={cn('w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0', config.bgColor)}>
                <Icon className={cn('w-5 h-5', config.color)} />
              </div>
              
              {/* Conteúdo Principal */}
              <div className="flex-1 min-w-0">
                {/* Linha 1: Descrição e Anexos */}
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground text-sm sm:text-base truncate">
                    {transaction.description}
                  </p>
                  {/* Ícone de anexo apenas se existir (sem mostrar zero) */}
                  {transaction.attachments_count && transaction.attachments_count > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (transaction.first_attachment_id) {
                          handleDownloadAttachment(transaction.first_attachment_id, transaction.id);
                        } else {
                          handleViewAttachments(transaction.id);
                        }
                      }}
                      className="p-1 hover:bg-muted rounded transition-colors flex items-center justify-center flex-shrink-0"
                      title={`Anexos: ${transaction.attachments_count} arquivo${transaction.attachments_count > 1 ? 's' : ''} - Clique para baixar`}
                    >
                      <Paperclip className="w-4 h-4 text-primary hover:text-primary/80 cursor-pointer" />
                      {transaction.attachments_count > 1 && (
                        <span className="ml-1 text-xs text-primary font-medium">{transaction.attachments_count}</span>
                      )}
                    </button>
                  )}
                </div>
                
                {/* Desktop: Todas as informações sempre visíveis */}
                <div className="hidden sm:flex sm:items-center sm:gap-2 sm:flex-wrap text-xs text-muted-foreground mb-1">
                  {/* Data principal */}
                  {transaction.purchase_date ? (
                    <span>
                      {transaction.type === 'income' ? 'Recebimento' : 'Compra'}: {formatDate(transaction.purchase_date)}
                    </span>
                  ) : transaction.due_date ? (
                    <span>{formatDate(transaction.due_date)}</span>
                  ) : null}
                  
                  {/* Forma de pagamento */}
                  {transaction.payment_method === 'credit_card' && transaction.credit_cards?.name && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        <span>{transaction.credit_cards.name}</span>
                      </span>
                    </>
                  )}
                  {transaction.payment_method && transaction.payment_method !== 'credit_card' && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {transaction.payment_method === 'debit_card' && <CreditCard className="w-3 h-3" />}
                        {transaction.payment_method === 'pix' && <Wallet className="w-3 h-3" />}
                        {transaction.payment_method === 'cash' && <Banknote className="w-3 h-3" />}
                        {transaction.payment_method === 'bank_slip' && <Receipt className="w-3 h-3" />}
                        {transaction.payment_method === 'transfer' && <ArrowRightLeft className="w-3 h-3" />}
                        <span>
                          {transaction.payment_method === 'debit_card' ? 'Débito' :
                           transaction.payment_method === 'pix' ? 'PIX' :
                           transaction.payment_method === 'cash' ? 'Dinheiro' :
                           transaction.payment_method === 'bank_slip' ? 'Boleto' :
                           transaction.payment_method === 'transfer' ? 'Transferência' : ''}
                        </span>
                      </span>
                    </>
                  )}
                  
                  {/* Categoria */}
                  {transaction.categories?.name && (
                    (() => {
                      const CategoryIcon = getCategoryIcon(transaction.categories.icon);
                      return (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {CategoryIcon && (
                              <CategoryIcon className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span>{transaction.categories.name}</span>
                          </span>
                        </>
                      );
                    })()
                  )}
                  
                  {/* Parcela */}
                  {transaction.is_installment && transaction.current_installment && transaction.total_installments && (
                    <>
                      <span>•</span>
                      <span>Parcela {transaction.current_installment}/{transaction.total_installments}</span>
                    </>
                  )}
                  
                  {/* Data de vencimento/recebimento */}
                  {transaction.due_date && (
                    <>
                      <span>•</span>
                      <span>
                        {transaction.type === 'income' ? 'Receb:' : 'Venc:'} {formatDate(transaction.due_date)}
                      </span>
                    </>
                  )}
                  
                  {/* Status */}
                  {transaction.status && (transaction.type === 'expense' || transaction.type === 'income') && (
                    <Badge 
                      variant={statusConfig[transaction.status]?.variant || 'outline'} 
                      className={cn('text-xs font-medium', statusConfig[transaction.status]?.color)}
                    >
                      {statusConfig[transaction.status]?.label || transaction.status}
                    </Badge>
                  )}
                  
                  {/* Botões de ação */}
                  {transaction.type === 'expense' && transaction.status === 'pending' && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                      onClick={(e) => handlePay(transaction, e)}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Pagar
                    </Button>
                  )}
                  {transaction.type === 'income' && transaction.status === 'pending' && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={(e) => handleReceive(transaction, e)}
                      disabled={updateStatus.isPending}
                    >
                      <ArrowDownCircle className="w-3.5 h-3.5" />
                      Receber
                    </Button>
                  )}
                </div>
                
                {/* Mobile: Informações principais + Botão Ver Mais */}
                <div className="sm:hidden">
                  {/* Linha 2: Informações Principais (mobile) */}
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-1">
                    {/* Data principal */}
                    <div className="flex items-center gap-1">
                      {transaction.purchase_date ? (
                        <span>
                          {transaction.type === 'income' ? 'Recebimento' : 'Compra'}: {formatDate(transaction.purchase_date)}
                        </span>
                      ) : transaction.due_date ? (
                        <span>{formatDate(transaction.due_date)}</span>
                      ) : null}
                    </div>
                    
                    {/* Valor - Mobile */}
                    <div>
                      <p className={cn('font-semibold text-sm', transaction.type === 'expense' ? 'text-expense' : config.color)}>
                        {transaction.type === 'expense' ? '-' : '+'}
                        {formatCurrency(Number(transaction.amount))}
                      </p>
                    </div>
                    
                    {/* Status e botões de ação */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {transaction.status && (transaction.type === 'expense' || transaction.type === 'income') && (
                        <Badge 
                          variant={statusConfig[transaction.status]?.variant || 'outline'} 
                          className={cn('text-xs font-medium', statusConfig[transaction.status]?.color)}
                        >
                          {statusConfig[transaction.status]?.label || transaction.status}
                        </Badge>
                      )}
                      {transaction.type === 'expense' && transaction.status === 'pending' && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-6 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => handlePay(transaction, e)}
                          disabled={updateStatus.isPending}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Pagar
                        </Button>
                      )}
                      {transaction.type === 'income' && transaction.status === 'pending' && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-6 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={(e) => handleReceive(transaction, e)}
                          disabled={updateStatus.isPending}
                        >
                          <ArrowDownCircle className="w-3 h-3" />
                          Receber
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Botão Ver Mais (Mobile) */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary hover:text-primary/80 w-full justify-between mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCard(transaction.id);
                    }}
                  >
                    <span>{isExpanded ? 'Ver menos' : 'Ver mais'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                  
                  {/* Detalhes Expandidos (Mobile) */}
                  {isExpanded && (
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground border-t border-border pt-2">
                      {/* Forma de pagamento */}
                      {transaction.payment_method === 'credit_card' && transaction.credit_cards?.name && (
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          <span>{transaction.credit_cards.name}</span>
                        </div>
                      )}
                      {transaction.payment_method && transaction.payment_method !== 'credit_card' && (
                        <div className="flex items-center gap-1">
                          {transaction.payment_method === 'debit_card' && <CreditCard className="w-3 h-3" />}
                          {transaction.payment_method === 'pix' && <Wallet className="w-3 h-3" />}
                          {transaction.payment_method === 'cash' && <Banknote className="w-3 h-3" />}
                          {transaction.payment_method === 'bank_slip' && <Receipt className="w-3 h-3" />}
                          {transaction.payment_method === 'transfer' && <ArrowRightLeft className="w-3 h-3" />}
                          <span>
                            {transaction.payment_method === 'debit_card' ? 'Débito' :
                             transaction.payment_method === 'pix' ? 'PIX' :
                             transaction.payment_method === 'cash' ? 'Dinheiro' :
                             transaction.payment_method === 'bank_slip' ? 'Boleto' :
                             transaction.payment_method === 'transfer' ? 'Transferência' : ''}
                          </span>
                        </div>
                      )}
                      
                      {/* Categoria */}
                      {transaction.categories?.name && (
                        (() => {
                          const CategoryIcon = getCategoryIcon(transaction.categories.icon);
                          return (
                            <div className="flex items-center gap-1">
                              {CategoryIcon && (
                                <CategoryIcon className="w-3 h-3 text-muted-foreground" />
                              )}
                              <span>Categoria: {transaction.categories.name}</span>
                            </div>
                          );
                        })()
                      )}
                      
                      {/* Parcela */}
                      {transaction.is_installment && transaction.current_installment && transaction.total_installments && (
                        <div>Parcela {transaction.current_installment}/{transaction.total_installments}</div>
                      )}
                      
                      {/* Data de vencimento/recebimento */}
                      {transaction.due_date && (
                        <div>
                          {transaction.type === 'income' ? 'Receb:' : 'Venc:'} {formatDate(transaction.due_date)}
                        </div>
                      )}
                      
                      {/* Recorrência */}
                      {transaction.is_recurring && (
                        <div className="flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          <span>
                            {transaction.recurrence_period === 'daily' && 'Diário'}
                            {transaction.recurrence_period === 'weekly' && 'Semanal'}
                            {transaction.recurrence_period === 'monthly' && 'Mensal'}
                            {transaction.recurrence_period === 'yearly' && 'Anual'}
                          </span>
                        </div>
                      )}
                      
                      {/* Observações e Criado por */}
                      {(transaction.notes && transaction.notes.trim()) || transaction.created_by_full_name ? (
                        <>
                          {transaction.notes && transaction.notes.trim() && (
                            <div className="italic text-muted-foreground pt-1 border-t border-border">
                              {transaction.notes}
                            </div>
                          )}
                          
                          {/* Criado por - abaixo das observações (mobile) */}
                          {transaction.created_by_full_name && (
                            <div className={`text-xs text-muted-foreground ${transaction.notes && transaction.notes.trim() ? 'pt-1' : 'pt-1 border-t border-border'}`}>
                              Criado por: <span className="font-medium">{transaction.created_by_full_name}</span>
                            </div>
                          )}
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
                
                {/* Observações - Desktop (sempre visível) */}
                {(transaction.notes && transaction.notes.trim()) || transaction.created_by_full_name ? (
                  <div className="hidden sm:block mt-1 space-y-1">
                    {transaction.notes && transaction.notes.trim() && (
                      <div className="text-xs text-muted-foreground italic">
                        {transaction.notes}
                      </div>
                    )}
                    {/* Criado por - abaixo das observações (desktop) */}
                    {transaction.created_by_full_name && (
                      <div className="text-xs text-muted-foreground">
                        Criado por: <span className="font-medium">{transaction.created_by_full_name}</span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              
              {/* Lado Direito: Valor (Desktop) e Botões */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {/* Valor - Desktop */}
                <div className="hidden sm:block text-right">
                  <p className={cn('font-semibold text-base', transaction.type === 'expense' ? 'text-expense' : config.color)}>
                    {transaction.type === 'expense' ? '-' : '+'}
                    {formatCurrency(Number(transaction.amount))}
                  </p>
                  {transaction.is_recurring && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 justify-end">
                      <Repeat className="w-3 h-3" />
                      <span>
                        {transaction.recurrence_period === 'daily' && 'Diário'}
                        {transaction.recurrence_period === 'weekly' && 'Semanal'}
                        {transaction.recurrence_period === 'monthly' && 'Mensal'}
                        {transaction.recurrence_period === 'yearly' && 'Anual'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Botão Mostrar Mais/Menos - Desktop (oculto, pois todas as informações já estão visíveis) */}
                <div className="hidden sm:block"></div>
                
                {/* Menu de 3 pontos */}
                {(onEdit || onDelete || onAnexos) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity h-7 w-7"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      {onEdit && transaction.status !== 'paid' && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(transaction);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {onAnexos && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onAnexos(transaction);
                          }}
                        >
                          <File className="w-4 h-4 mr-2" />
                          Anexos
                        </DropdownMenuItem>
                      )}
                      {onDelete && transaction.status !== 'paid' && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(transaction);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
