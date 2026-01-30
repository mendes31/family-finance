import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useCreateGoal, useUpdateGoal, FinancialGoal } from '@/hooks/useGoals';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  target_amount: z.string().min(1, 'Valor alvo é obrigatório'),
  current_amount: z.string().optional(),
  deadline: z.string().optional(),
  is_completed: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface GoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: FinancialGoal | null;
}

export function GoalModal({ open, onOpenChange, goal }: GoalModalProps) {
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const isEditing = !!goal;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: goal?.name || '',
      target_amount: goal?.target_amount?.toString() || '',
      current_amount: goal?.current_amount?.toString() || '0',
      deadline: goal?.deadline || '',
      is_completed: goal?.is_completed || false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const targetAmount = parseFloat(data.target_amount.replace(/[^\d,.-]/g, '').replace(',', '.'));
      const currentAmount = parseFloat((data.current_amount || '0').replace(/[^\d,.-]/g, '').replace(',', '.'));

      if (isNaN(targetAmount) || targetAmount <= 0) {
        toast.error('Valor alvo inválido');
        return;
      }

      if (isNaN(currentAmount) || currentAmount < 0) {
        toast.error('Valor atual inválido');
        return;
      }

      if (isEditing) {
        await updateGoal.mutateAsync({
          id: goal.id,
          name: data.name,
          target_amount: targetAmount,
          current_amount: currentAmount,
          deadline: data.deadline || null,
          is_completed: data.is_completed,
        });
        toast.success('Meta atualizada com sucesso!');
      } else {
        await createGoal.mutateAsync({
          name: data.name,
          target_amount: targetAmount,
          current_amount: currentAmount,
          deadline: data.deadline || null,
        });
        toast.success('Meta criada com sucesso!');
      }
      // Não resetar aqui para evitar removeChild errors
      // O reset será feito quando o modal abrir novamente
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar meta');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Meta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Reserva de Emergência" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="target_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Alvo</FormLabel>
                  <FormControl>
                    <Input placeholder="R$ 0,00" {...field} />
                  </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Atual</FormLabel>
                    <FormControl>
                      <Input placeholder="R$ 0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo (opcional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <FormField
                control={form.control}
                name="is_completed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Meta Concluída</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Marque quando a meta for alcançada
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createGoal.isPending || updateGoal.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createGoal.isPending || updateGoal.isPending}>
                {createGoal.isPending || updateGoal.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  isEditing ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

