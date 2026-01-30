import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Target, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { useGoals, useDeleteGoal, FinancialGoal } from '@/hooks/useGoals';
import { GoalModal } from '@/components/modals/GoalModal';
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
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function Goals() {
  const { data: goals = [], isLoading } = useGoals();
  const deleteGoal = useDeleteGoal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);

  const handleEdit = (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    setIsModalOpen(true);
  };

  const handleDelete = (goal: FinancialGoal) => {
    setGoalToDelete(goal);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;
    
    try {
      await deleteGoal.mutateAsync(goalToDelete.id);
      toast.success('Meta excluída com sucesso!');
      setDeleteDialogOpen(false);
      setGoalToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir meta');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateProgress = (goal: FinancialGoal) => {
    if (goal.target_amount === 0) return 0;
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  return (
    <MainLayout>
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-1">
            Metas
          </h1>
          <p className="text-muted-foreground">
            Defina e acompanhe suas metas financeiras.
          </p>
        </div>
        <Button onClick={() => {
          setSelectedGoal(null);
          setIsModalOpen(true);
        }} variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Nova meta
        </Button>
      </header>

      {/* Metas ativas */}
      {activeGoals.length > 0 && (
        <section className="bg-card border border-border rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Metas em andamento
            </h2>
          </div>

          <div className="space-y-4">
            {activeGoals.map((goal) => {
              const progress = calculateProgress(goal);
              return (
                <div
                  key={goal.id}
                  className="rounded-lg border border-border/60 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{goal.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}</span>
                        {goal.deadline && (
                          <span>Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(goal)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(goal)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {progress.toFixed(1)}% concluído
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Metas concluídas */}
      {completedGoals.length > 0 && (
        <section className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-foreground">
              Metas concluídas
            </h2>
          </div>

          <div className="space-y-3">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-foreground">{goal.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(goal.target_amount)} alcançado
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(goal)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(goal)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Estado vazio */}
      {!isLoading && goals.length === 0 && (
        <section className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhuma meta criada ainda
            </p>
            <p className="text-sm text-muted-foreground/80 mb-4">
              Crie sua primeira meta financeira para começar a acompanhar seus objetivos.
            </p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Criar primeira meta
            </Button>
          </div>
        </section>
      )}

      {isLoading && (
        <section className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <p className="text-muted-foreground text-sm">Carregando metas...</p>
        </section>
      )}

      <GoalModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        goal={selectedGoal}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a meta "{goalToDelete?.name}"?
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

