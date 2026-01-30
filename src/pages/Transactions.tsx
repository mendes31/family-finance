import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { EditTransactionModal } from '@/components/modals/EditTransactionModal';
import { TransactionAttachmentsModal } from '@/components/modals/TransactionAttachmentsModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  CalendarIcon,
  X,
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionType, TransactionStatus, useTransactions, useDeleteTransaction, Transaction, PaymentMethod } from '@/hooks/useTransactions';
import { useQueryClient } from '@tanstack/react-query';
import { useCategories } from '@/hooks/useCategories';
import { useFamilyMembers } from '@/hooks/useFamily';
import { useIsAdmin } from '@/hooks/useUserRole';
import { useCreditCards } from '@/hooks/useCreditCards';
import { exportToExcel } from '@/utils/exportToExcel';
import { exportToPdf } from '@/utils/exportToPdf';
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
import { toast } from 'sonner';

export default function Transactions() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<TransactionType>('expense');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [selectedTransactionForAttachments, setSelectedTransactionForAttachments] = useState<string | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllRecurrences, setDeleteAllRecurrences] = useState(false);
  
  // Filtros adicionais
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [creditCardFilter, setCreditCardFilter] = useState<string | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [memberFilter, setMemberFilter] = useState<string | 'all'>('all');
  
  // Buscar categorias, cartões e membros para os filtros
  const { data: allCategories = [] } = useCategories(undefined);
  const { data: creditCards = [] } = useCreditCards();
  const { data: members = [] } = useFamilyMembers();
  const { isAdmin } = useIsAdmin();
  
  // Filtros de período
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [exportYear, setExportYear] = useState(now.getFullYear()); // Ano para exportação
  const [customDateRange, setCustomDateRange] = useState<{ start?: string; end?: string } | null>(null);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  
  // Calcular datas do período
  const getPeriodDates = () => {
    if (customDateRange?.start && customDateRange?.end) {
      return {
        startDate: customDateRange.start,
        endDate: customDateRange.end,
      };
    }
    
    if (selectedMonth === 'all') {
      // Todos os meses do ano
      return {
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`,
      };
    }
    
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };
  
  // Datas para exportação (sempre ano completo)
  const getExportDates = () => {
    return {
      startDate: `${exportYear}-01-01`,
      endDate: `${exportYear}-12-31`,
    };
  };
  
  const periodDates = getPeriodDates();
  const exportDates = getExportDates();
  
  const { data: transactions = [], isLoading } = useTransactions({
    type: activeFilter !== 'all' ? activeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: periodDates.startDate,
    endDate: periodDates.endDate,
    categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
    memberId: isAdmin && memberFilter !== 'all' ? memberFilter : undefined,
  });
  
  // Buscar todas as transações do ano para exportação (sempre por família; role já restringe no backend)
  const { data: allYearTransactions = [] } = useTransactions({
    startDate: exportDates.startDate,
    endDate: exportDates.endDate,
    memberId: isAdmin && memberFilter !== 'all' ? memberFilter : undefined,
  });
  const deleteTransaction = useDeleteTransaction();
  
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
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  const getPeriodLabel = () => {
    if (customDateRange?.start && customDateRange?.end) {
      return `${format(new Date(customDateRange.start), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(customDateRange.end), 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    if (selectedMonth === 'all') {
      return `Todos os meses ${selectedYear}`;
    }
    return `${months[selectedMonth - 1].label} ${selectedYear}`;
  };
  
  const clearDateRange = () => {
    setCustomDateRange(null);
    setIsDateRangeOpen(false);
  };

  const filters: { value: TransactionType | 'all'; label: string; icon: React.ElementType }[] = [
    { value: 'all', label: 'Todos', icon: Filter },
    { value: 'income', label: 'Receitas', icon: ArrowDownLeft },
    { value: 'expense', label: 'Despesas', icon: ArrowUpRight },
    { value: 'investment', label: 'Investimentos', icon: TrendingUp },
  ];

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [transactions, searchQuery]);

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteAllOpen(false);
    setDeleteAllRecurrences(false);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    
    try {
      // Usar a API diretamente com o parâmetro deleteAllOpen
      const response = await fetch('/family_finance/api/transactions.php?action=delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: transactionToDelete.id,
          delete_all_open: deleteAllOpen,
          delete_all_recurrences: deleteAllRecurrences,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir transação');
      }
      
      const data = await response.json();
      
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      
      toast.success(data.message || 'Transação excluída com sucesso!');
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      setDeleteAllOpen(false);
      setDeleteAllRecurrences(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir transação');
    }
  };

  const handleExportExcel = async () => {
    try {
      if (allYearTransactions.length === 0) {
        toast.error('Não há transações para exportar no ano selecionado');
        return;
      }

      await exportToExcel({
        transactions: allYearTransactions,
        year: exportYear,
      });

      toast.success('Exportação Excel iniciada!');
    } catch (error: any) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar para Excel. Tente novamente.');
    }
  };

  const handleExportPdf = async () => {
    try {
      if (allYearTransactions.length === 0) {
        toast.error('Não há transações para exportar no ano selecionado');
        return;
      }

      await exportToPdf({
        transactions: allYearTransactions,
        year: exportYear,
      });

      toast.success('Exportação PDF concluída!');
    } catch (error: any) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar para PDF. Tente novamente.');
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-1">
              Lançamentos
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas receitas, despesas e investimentos
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="gradient" 
              className="gap-2"
              onClick={() => {
                setAddModalType('expense');
                setIsAddModalOpen(true);
              }}
            >
              <Plus className="w-5 h-5" />
              Nova Despesa
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => {
                setAddModalType('income');
                setIsAddModalOpen(true);
              }}
            >
              <Plus className="w-5 h-5" />
              Nova Receita
            </Button>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar lançamentos..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Filtro de Período */}
          <div className="flex gap-2">
            <Select
              value={selectedMonth === 'all' ? 'all' : selectedMonth.toString()}
              onValueChange={(value) => {
                if (value === 'all') {
                  setSelectedMonth('all');
                } else {
                  setSelectedMonth(parseInt(value));
                }
                setCustomDateRange(null);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => {
                setSelectedYear(parseInt(value));
                setCustomDateRange(null);
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Popover open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={customDateRange ? "default" : "outline"}
                  className={cn(
                    'gap-2',
                    customDateRange && 'bg-primary text-primary-foreground'
                  )}
                >
                  <CalendarIcon className="w-4 h-4" />
                  {getPeriodLabel()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Período Personalizado</Label>
                    {customDateRange && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearDateRange}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Data inicial</Label>
                      <Input
                        type="date"
                        value={customDateRange?.start || ''}
                        onChange={(e) => {
                          setCustomDateRange({
                            start: e.target.value,
                            end: customDateRange?.end,
                          });
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Data final</Label>
                      <Input
                        type="date"
                        value={customDateRange?.end || ''}
                        onChange={(e) => {
                          setCustomDateRange({
                            start: customDateRange?.start,
                            end: e.target.value,
                          });
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {customDateRange?.start && customDateRange?.end && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setIsDateRangeOpen(false)}
                    >
                      Aplicar
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <Button
                key={filter.value}
                variant={activeFilter === filter.value ? 'default' : 'secondary'}
                size="sm"
                className={cn(
                  'gap-2 whitespace-nowrap',
                  activeFilter === filter.value && 'shadow-md'
                )}
                onClick={() => setActiveFilter(filter.value)}
              >
                <filter.icon className="w-4 h-4" />
                {filter.label}
              </Button>
            ))}
          </div>
          
          {/* Filtro de Status - Sempre visível */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as TransactionStatus | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status">
                {statusFilter === 'all' ? 'Todos os status' : 
                 statusFilter === 'pending' ? 'Pendente' :
                 statusFilter === 'paid' ? 'Paga/Recebida' :
                 statusFilter === 'overdue' ? 'Vencida' :
                 statusFilter === 'cancelled' ? 'Cancelada' : 'Filtrar por status'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Paga/Recebida</SelectItem>
              <SelectItem value="overdue">Vencida</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={paymentMethodFilter}
            onValueChange={(value) => setPaymentMethodFilter(value as PaymentMethod | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Forma de pagamento">
                {paymentMethodFilter === 'all' ? 'Todas as formas' :
                 paymentMethodFilter === 'credit_card' ? 'Cartão de Crédito' :
                 paymentMethodFilter === 'debit_card' ? 'Cartão de Débito' :
                 paymentMethodFilter === 'pix' ? 'PIX' :
                 paymentMethodFilter === 'cash' ? 'Dinheiro' :
                 paymentMethodFilter === 'bank_slip' ? 'Boleto' :
                 paymentMethodFilter === 'transfer' ? 'Transferência' : 'Forma de pagamento'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as formas</SelectItem>
              <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
              <SelectItem value="debit_card">Cartão de Débito</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="cash">Dinheiro</SelectItem>
              <SelectItem value="bank_slip">Boleto</SelectItem>
              <SelectItem value="transfer">Transferência</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de Membro - apenas para admin */}
          {isAdmin && (
            <Select
              value={memberFilter}
              onValueChange={(value) => setMemberFilter(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Membro">
                  {memberFilter === 'all'
                    ? 'Todos os membros'
                    : members.find((m) => m.user_id === memberFilter)?.full_name || 'Membro'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os membros</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {paymentMethodFilter === 'credit_card' && (
            <Select
              value={creditCardFilter}
              onValueChange={(value) => setCreditCardFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Cartão">
                  {creditCardFilter === 'all' ? 'Todos os cartões' : 
                   creditCards.find(c => c.id === creditCardFilter)?.name || 'Cartão'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cartões</SelectItem>
                {creditCards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria">
                {categoryFilter === 'all' ? 'Todas as categorias' : 
                 allCategories.find(c => c.id === categoryFilter)?.name || 'Categoria'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {allCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Seção de Exportação */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium whitespace-nowrap">Exportar ano:</Label>
            <Select
              value={exportYear.toString()}
              onValueChange={(value) => setExportYear(parseInt(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportExcel}
              className="gap-2"
              disabled={allYearTransactions.length === 0}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportPdf}
              className="gap-2"
              disabled={allYearTransactions.length === 0}
            >
              <FileText className="w-4 h-4" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        {isLoading ? (
          <p className="text-muted-foreground text-sm text-center py-8">Carregando transações...</p>
        ) : (
          <TransactionList 
            transactions={filteredTransactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAnexos={(transaction) => {
              setSelectedTransactionForAttachments(transaction.id);
              setIsAttachmentsModalOpen(true);
            }}
          />
        )}
      </div>

      <AddTransactionModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        type={addModalType}
      />

      <EditTransactionModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        transaction={selectedTransaction}
      />

      <TransactionAttachmentsModal
        open={isAttachmentsModalOpen}
        onOpenChange={(open) => {
          setIsAttachmentsModalOpen(open);
          if (!open) setSelectedTransactionForAttachments(null);
        }}
        transactionId={selectedTransactionForAttachments}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) {
          setTransactionToDelete(null);
          setDeleteAllOpen(false);
          setDeleteAllRecurrences(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Tem certeza que deseja excluir a transação "{transactionToDelete?.description}"?
                {(() => {
                  const hasInstallments = transactionToDelete?.is_installment && transactionToDelete?.installment_group_id;
                  const hasRecurrences = transactionToDelete?.recurrence_group_id !== null && transactionToDelete?.recurrence_group_id !== undefined;
                  const openInstallments = hasInstallments ? transactions.filter(
                    t => t.installment_group_id === transactionToDelete?.installment_group_id &&
                    (t.status === 'pending' || t.status === 'overdue') &&
                    t.id !== transactionToDelete?.id
                  ) : [];
                  const openRecurrences = hasRecurrences ? transactions.filter(
                    t => t.recurrence_group_id === transactionToDelete?.recurrence_group_id &&
                    (t.status === 'pending' || t.status === 'overdue') &&
                    t.id !== transactionToDelete?.id
                  ) : [];
                  
                  if (openInstallments.length === 0 && openRecurrences.length === 0) {
                    return ' Esta ação não pode ser desfeita.';
                  }
                  return null;
                })()}
              </p>
              {(() => {
                const hasInstallments = transactionToDelete?.is_installment && transactionToDelete?.installment_group_id;
                const hasRecurrences = transactionToDelete?.recurrence_group_id !== null && transactionToDelete?.recurrence_group_id !== undefined;
                const openInstallments = hasInstallments ? transactions.filter(
                  t => t.installment_group_id === transactionToDelete?.installment_group_id &&
                  (t.status === 'pending' || t.status === 'overdue') &&
                  t.id !== transactionToDelete?.id
                ) : [];
                const openRecurrences = hasRecurrences ? transactions.filter(
                  t => t.recurrence_group_id === transactionToDelete?.recurrence_group_id &&
                  (t.status === 'pending' || t.status === 'overdue') &&
                  t.id !== transactionToDelete?.id
                ) : [];
                
                if (openInstallments.length === 0 && openRecurrences.length === 0) {
                  return null;
                }
                
                return (
                  <div className="mt-4 space-y-3">
                    {openInstallments.length > 0 && (
                      <div className="p-3 bg-muted rounded-lg space-y-3">
                        <p className="text-sm font-medium">
                          Esta transação faz parte de um parcelamento e possui <strong>{openInstallments.length}</strong> parcela(s) aberta(s) (pendente(s) ou em atraso).
                        </p>
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="deleteAllOpen"
                            checked={deleteAllOpen}
                            onChange={(e) => setDeleteAllOpen(e.target.checked)}
                            className="h-4 w-4 mt-0.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                          />
                          <label htmlFor="deleteAllOpen" className="text-sm cursor-pointer flex-1">
                            Excluir todas as parcelas abertas ({openInstallments.length})
                          </label>
                        </div>
                        {!deleteAllOpen && (
                          <p className="text-xs text-muted-foreground">
                            Se não marcar esta opção, apenas a transação selecionada será excluída.
                          </p>
                        )}
                      </div>
                    )}
                    {openRecurrences.length > 0 && (
                      <div className="p-3 bg-muted rounded-lg space-y-3">
                        <p className="text-sm font-medium">
                          Esta transação {transactionToDelete?.parent_recurrence_id ? 'é uma ocorrência de uma transação recorrente' : 'é uma transação recorrente'} e possui <strong>{openRecurrences.length}</strong> ocorrência(s) aberta(s) (pendente(s) ou em atraso).
                        </p>
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="deleteAllRecurrences"
                            checked={deleteAllRecurrences}
                            onChange={(e) => setDeleteAllRecurrences(e.target.checked)}
                            className="h-4 w-4 mt-0.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                          />
                          <label htmlFor="deleteAllRecurrences" className="text-sm cursor-pointer flex-1">
                            Excluir todas as ocorrências abertas ({openRecurrences.length})
                          </label>
                        </div>
                        {!deleteAllRecurrences && (
                          <p className="text-xs text-muted-foreground">
                            Se não marcar esta opção, apenas a transação selecionada será excluída.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {(deleteAllOpen || deleteAllRecurrences) ? 'Excluir Todas' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
