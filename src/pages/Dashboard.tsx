import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { CreditCardWidget } from '@/components/dashboard/CreditCardWidget';
import { DashboardFilters, DashboardFilters as FiltersType } from '@/components/dashboard/DashboardFilters';
import { Insights } from '@/components/dashboard/Insights';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { AddCreditCardModal } from '@/components/modals/AddCreditCardModal';
import { EditTransactionModal } from '@/components/modals/EditTransactionModal';
import { TransactionAttachmentsModal } from '@/components/modals/TransactionAttachmentsModal';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
  Calendar,
  Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardSummary, useTransactions, TransactionType, DashboardSummaryFilters, Transaction } from '@/hooks/useTransactions';
import { useCreditCards } from '@/hooks/useCreditCards';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useFamilyMembers } from '@/hooks/useFamily';
import { useIsAdmin } from '@/hooks/useUserRole';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [selectedTransactionForAttachments, setSelectedTransactionForAttachments] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllRecurrences, setDeleteAllRecurrences] = useState(false);
  const [memberFilter, setMemberFilter] = useState<string | 'all'>('all');
  
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState<FiltersType>({
    year: currentYear,
    month: 'all',
    startDate: `${currentYear}-01-01`,
    endDate: `${currentYear}-12-31`,
  });

  const { isAdmin } = useIsAdmin();
  const { data: members = [] } = useFamilyMembers();

  const summaryFilters: DashboardSummaryFilters = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    type: filters.type,
    categoryId: filters.categoryId,
    memberId: isAdmin && memberFilter !== 'all' ? memberFilter : undefined,
  };

  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(summaryFilters);
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions({ 
    limit: 5,
    type: filters.type,
    startDate: filters.startDate,
    endDate: filters.endDate,
    categoryId: filters.categoryId,
    memberId: isAdmin && memberFilter !== 'all' ? memberFilter : undefined,
  });
  const { data: creditCards = [], isLoading: cardsLoading } = useCreditCards(
    isAdmin && memberFilter !== 'all' ? memberFilter : undefined
  );

  const stats = summary || {
    income: 0,
    expense: 0,
    investment: 0,
    balance: 0,
    expense_pending: 0,
    income_pending: 0,
  };

  const handleAddTransaction = (type: TransactionType) => {
    setTransactionType(type);
    setTransactionModalOpen(true);
  };

  const handleAddCard = () => {
    setCardModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteAllOpen(false);
    setDeleteAllRecurrences(false);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    
    try {
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
      queryClient.invalidateQueries({ queryKey: ['transactions'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['card-invoice'], exact: false });
      
      toast.success(data.message || 'Transação excluída com sucesso!');
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      setDeleteAllOpen(false);
      setDeleteAllRecurrences(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir transação');
    }
  };

  const handleViewAttachments = (transaction: Transaction) => {
    setSelectedTransactionForAttachments(transaction.id);
    setIsAttachmentsModalOpen(true);
  };

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

  return (
    <MainLayout>
      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground mb-1">
              Olá, Família! 👋
            </h1>
            <p className="text-muted-foreground font-normal">
              Aqui está o resumo financeiro do período selecionado
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-expense rounded-full" />
            </Button>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <DashboardFilters filters={filters} onFiltersChange={setFilters} />
          
          {/* Filtro de Membro - apenas para admin */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Membro:</Label>
              <Select
                value={memberFilter}
                onValueChange={(value) => setMemberFilter(value)}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue>
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
            </div>
          )}
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryLoading ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Saldo do Mês"
              value={stats.balance}
              icon={<Wallet className="w-6 h-6" />}
              type="balance"
              delay={0}
            />
            <StatCard
              title="Receitas"
              value={stats.income}
              icon={<ArrowDownLeft className="w-6 h-6" />}
              type="income"
              delay={100}
              pendingValue={stats.income_pending}
            />
            <StatCard
              title="Despesas"
              value={stats.expense}
              icon={<ArrowUpRight className="w-6 h-6" />}
              type="expense"
              delay={200}
              pendingValue={stats.expense_pending}
            />
            <StatCard
              title="Investimentos"
              value={stats.investment}
              icon={<TrendingUp className="w-6 h-6" />}
              type="investment"
              delay={300}
            />
          </>
        )}
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-base font-display font-medium text-foreground mb-3">
          Ações Rápidas
        </h2>
        <QuickActions onAddTransaction={handleAddTransaction} onAddCard={handleAddCard} />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Transactions */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card h-[440px] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-base font-display font-medium text-foreground">
                Últimos Lançamentos
              </h2>
              <Link to="/transactions">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                  Ver todos
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {transactionsLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : (
                <TransactionList 
                  transactions={transactions} 
                  limit={5}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                  onAnexos={handleViewAttachments}
                />
              )}
            </div>
          </div>
        </div>

        {/* Credit Cards */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card h-[440px] flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-base font-display font-medium text-foreground">
              Cartões
            </h2>
            <Link to="/cards">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                Ver todos
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            {cardsLoading ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : (
              <CreditCardWidget 
                cards={creditCards} 
                selectedMonth={undefined} 
                selectedYear={undefined}
                memberId={isAdmin && memberFilter !== 'all' ? memberFilter : undefined}
              />
            )}
          </div>
        </div>
      </div>

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card h-[440px] flex flex-col">
            <h2 className="text-base font-display font-medium text-foreground mb-4 shrink-0">
              Despesas por Categoria
            </h2>
            <div className="flex-1 min-h-0">
              <ExpenseChart filters={{
                startDate: filters.startDate,
                endDate: filters.endDate,
                categoryId: filters.categoryId,
                memberId: isAdmin && memberFilter !== 'all' ? memberFilter : undefined,
              }} />
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card h-[440px] flex flex-col">
            <h2 className="text-base font-display font-medium text-foreground mb-4 shrink-0">
              Evolução Mensal
            </h2>
            <div className="flex-1 min-h-0">
              <MonthlyChart filters={{
                year: filters.year,
                startDate: filters.startDate,
                endDate: filters.endDate,
                type: filters.type,
                categoryId: filters.categoryId,
                memberId: isAdmin && memberFilter !== 'all' ? memberFilter : undefined,
              }} />
            </div>
          </div>
        </div>
        
        {/* Insights */}
        <div className="flex flex-col h-[440px] w-full max-w-full">
          <Insights filters={summaryFilters} />
        </div>
      </div>

      {/* Modals */}
      <AddTransactionModal 
        open={transactionModalOpen} 
        onOpenChange={setTransactionModalOpen}
        type={transactionType}
      />
      <AddCreditCardModal 
        open={cardModalOpen} 
        onOpenChange={setCardModalOpen}
      />
      <EditTransactionModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setSelectedTransaction(null);
          }
        }}
        transaction={selectedTransaction}
      />
      <TransactionAttachmentsModal
        open={isAttachmentsModalOpen}
        onOpenChange={(open) => {
          setIsAttachmentsModalOpen(open);
          if (!open) {
            setSelectedTransactionForAttachments(null);
          }
        }}
        transactionId={selectedTransactionForAttachments}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              <p>
                Tem certeza que deseja excluir a transação <strong>{transactionToDelete?.description}</strong>?
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
