import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useUpdateTransaction } from '@/hooks/useUpdateTransaction';
import { useCategories } from '@/hooks/useCategories';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useUploadAttachment } from '@/hooks/useAttachments';
import { Transaction, PaymentMethod, TransactionType } from '@/hooks/useTransactions';
import { toast } from 'sonner';
import { Loader2, Upload, X, File } from 'lucide-react';

const formSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  date: z.string().min(1, 'Data da compra é obrigatória'),
  purchase_date: z.string().optional(),
  due_date: z.string().optional(),
  category_id: z.string().optional(),
  payment_method: z.string().min(1, 'Forma de pagamento é obrigatória'),
  status: z.string().optional(),
  credit_card_id: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_period: z.string().optional(),
  recurrence_end_date: z.string().optional(),
  notes: z.string().optional(),
  total_installments: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'bank_slip', label: 'Boleto' },
  { value: 'transfer', label: 'Transferência' },
];

export function EditTransactionModal({ open, onOpenChange, transaction }: EditTransactionModalProps) {
  const [isRecurring, setIsRecurring] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [updateAllInstallments, setUpdateAllInstallments] = useState(false);
  const [updateAllRecurrences, setUpdateAllRecurrences] = useState(false);
  const updateTransaction = useUpdateTransaction();
  const uploadAttachment = useUploadAttachment();
  const { data: categories = [] } = useCategories(transaction?.type);
  const { data: creditCards = [] } = useCreditCards();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: '',
      date: '',
      purchase_date: '',
      due_date: '',
      category_id: '',
      payment_method: 'pix',
      credit_card_id: '',
      is_recurring: false,
      recurrence_period: '',
      recurrence_end_date: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (transaction && open) {
      form.reset({
        description: transaction.description,
        amount: transaction.amount.toString(),
        date: transaction.purchase_date || transaction.due_date || new Date().toISOString().split('T')[0], // Usar purchase_date ou due_date
        purchase_date: transaction.purchase_date || '',
        due_date: transaction.due_date || '',
        category_id: transaction.category_id || '',
        payment_method: transaction.payment_method,
        status: transaction.status || 'pending',
        credit_card_id: transaction.credit_card_id || '',
        is_recurring: transaction.is_recurring || false,
        recurrence_period: transaction.recurrence_period || '',
        recurrence_end_date: transaction.recurrence_end_date || '',
        notes: transaction.notes || '',
        total_installments: transaction.total_installments?.toString() || '',
      });
      setIsRecurring(transaction.is_recurring || false);
      setIsInstallment(transaction.is_installment || false);
      setSelectedFiles([]);
    }
  }, [transaction, open, form]);

  // Reset form when modal closes
  // Reset form when modal opens (not when closes to avoid removeChild errors)
  // The form will be populated by the transaction data in the other useEffect
  useEffect(() => {
    if (open && !transaction) {
      form.reset({
        description: '',
        amount: '',
        date: '',
        purchase_date: '',
        due_date: '',
        category_id: '',
        payment_method: 'pix',
        status: 'pending',
        credit_card_id: '',
        is_recurring: false,
        recurrence_period: '',
        recurrence_end_date: '',
        notes: '',
      });
      setIsRecurring(false);
      setSelectedFiles([]);
    }
  }, [open, transaction, form]);

  const watchPaymentMethod = form.watch('payment_method');
  const watchCreditCardId = form.watch('credit_card_id');
  const watchPurchaseDate = form.watch('date');
  const showCreditCardSelect = watchPaymentMethod === 'credit_card';
  const canEditRecurrence = transaction && !transaction.parent_recurrence_id;

  // Função para calcular data de lançamento baseada no fechamento do cartão
  const calculateTransactionDate = (purchaseDate: string, creditCardId: string | undefined): string => {
    if (!purchaseDate || !creditCardId) return purchaseDate || new Date().toISOString().split('T')[0];
    
    const card = creditCards.find(c => c.id === creditCardId);
    if (!card) return purchaseDate;
    
    const purchase = new Date(purchaseDate);
    const purchaseDay = purchase.getDate();
    const purchaseMonth = purchase.getMonth();
    const purchaseYear = purchase.getFullYear();
    const closingDay = card.closing_day;
    
    // Se a compra foi antes do fechamento, lança no mês atual
    // Se a compra foi depois do fechamento, lança no próximo mês
    if (purchaseDay <= closingDay) {
      // Lança no mês atual (dia 1 do mês)
      return new Date(purchaseYear, purchaseMonth, 1).toISOString().split('T')[0];
    } else {
      // Lança no próximo mês (dia 1 do próximo mês)
      return new Date(purchaseYear, purchaseMonth + 1, 1).toISOString().split('T')[0];
    }
  };

  // Função para calcular data de vencimento baseada no due_day do cartão
  // Regra: A fatura sempre fecha no dia X do mês da compra e vence no dia Y do mês seguinte
  // Exemplo: Compra em 05/01, fecha em 25/01, vence em 07/02
  const calculateDueDate = (purchaseDate: string, creditCardId: string | undefined): string => {
    if (!purchaseDate || !creditCardId) return '';
    
    const card = creditCards.find(c => c.id === creditCardId);
    if (!card) return '';
    
    const purchase = new Date(purchaseDate);
    const purchaseMonth = purchase.getMonth();
    const purchaseYear = purchase.getFullYear();
    const dueDay = card.due_day;
    
    // A fatura sempre vence no mês seguinte ao fechamento
    // Independente de quando foi a compra no mês
    let dueMonth = purchaseMonth + 1;
    let dueYear = purchaseYear;
    
    // Ajustar se passar de dezembro
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear += 1;
    }
    
    // Criar data de vencimento com o due_day do cartão no mês seguinte
    return new Date(dueYear, dueMonth, dueDay).toISOString().split('T')[0];
  };

  // Atualizar data de vencimento quando mudar cartão ou data da compra
  useEffect(() => {
    if (showCreditCardSelect && watchCreditCardId && watchPurchaseDate) {
      const calculatedDueDate = calculateDueDate(watchPurchaseDate, watchCreditCardId);
      if (calculatedDueDate) {
        form.setValue('due_date', calculatedDueDate);
      }
    } else if (!showCreditCardSelect) {
      // Se não for cartão, limpar o campo para permitir edição manual
      // Não limpar se já tiver valor
    }
  }, [watchCreditCardId, watchPurchaseDate, showCreditCardSelect, form]);

  const performUpdate = async (data: FormData, updateAllInst: boolean, updateAllRec: boolean) => {
    if (!transaction) return;

    try {
      const amount = parseFloat(data.amount.replace(/[^\d,.-]/g, '').replace(',', '.'));

      if (isNaN(amount) || amount <= 0) {
        toast.error('Valor inválido');
        return;
      }

      // Calcular data de lançamento se for cartão de crédito
      let transactionDate = data.date; // Por padrão, usa a data da compra
      if (showCreditCardSelect && data.credit_card_id) {
        transactionDate = calculateTransactionDate(data.date, data.credit_card_id);
      }
      
      // Calcular data de vencimento se for cartão
      let calculatedDueDate = data.due_date || undefined;
      if (showCreditCardSelect && data.credit_card_id && !calculatedDueDate) {
        calculatedDueDate = calculateDueDate(data.date, data.credit_card_id);
      }

      const updateResult = await updateTransaction.mutateAsync({
        id: transaction.id,
        description: data.description,
        amount,
        date: transactionDate, // Data de lançamento calculada
        purchase_date: data.date, // Data da compra
        due_date: calculatedDueDate,
        category_id: data.category_id || undefined,
        payment_method: data.payment_method as PaymentMethod,
        status: data.status as 'pending' | 'paid' | 'overdue' | 'cancelled' | undefined,
        credit_card_id: showCreditCardSelect ? data.credit_card_id : undefined,
        is_recurring: canEditRecurrence ? isRecurring : undefined,
        recurrence_period: canEditRecurrence && isRecurring && data.recurrence_period
          ? (data.recurrence_period as 'daily' | 'weekly' | 'monthly' | 'yearly')
          : undefined,
        recurrence_end_date: canEditRecurrence && isRecurring && data.recurrence_end_date
          ? data.recurrence_end_date
          : undefined,
        notes: data.notes || undefined,
        is_installment: isInstallment,
        total_installments: isInstallment && data.total_installments 
          ? parseInt(data.total_installments) 
          : (isInstallment ? null : undefined),
        update_installments: updateAllInst,
        update_recurrences: updateAllRec,
      });

      // Fazer upload dos anexos se houver
      if (selectedFiles.length > 0) {
        try {
          await Promise.all(
            selectedFiles.map(file => 
              uploadAttachment.mutateAsync({
                transaction_id: transaction.id,
                file,
              })
            )
          );
          toast.success(`${selectedFiles.length} anexo(s) adicionado(s) com sucesso!`);
        } catch (error: any) {
          console.error('Erro ao fazer upload de anexos:', error);
          toast.error('Transação atualizada, mas houve erro ao fazer upload de alguns anexos');
        }
      }

      // Mensagem de sucesso baseada no que foi atualizado
      if (updateAllRec) {
        toast.success('Transação e todas as ocorrências recorrentes atualizadas com sucesso!');
      } else if (updateAllInst) {
        toast.success('Transação e todas as parcelas atualizadas com sucesso!');
      } else {
        toast.success('Transação atualizada com sucesso!');
      }

      // Aguardar um pouco para garantir que o refetch foi concluído
      await new Promise(resolve => setTimeout(resolve, 100));

      // Não resetar aqui para evitar removeChild errors
      // O reset será feito quando o modal abrir novamente
      setIsRecurring(false);
      setSelectedFiles([]);
      setUpdateAllInstallments(false);
      setUpdateAllRecurrences(false);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar transação');
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!transaction) return;

    // Verificar se é parcelada (qualquer parcela do grupo) ou recorrente (pai ou filha)
    const isParcelada = transaction.is_installment && transaction.installment_group_id;
    const isRecorrente = transaction.recurrence_group_id !== null; // Pode ser pai ou filha
    const isOpen = transaction.status !== 'paid' && transaction.status !== 'cancelled';

    // Se for parcelada ou recorrente E estiver aberta, perguntar se deseja atualizar todas as abertas
    if ((isParcelada || isRecorrente) && isOpen) {
      setPendingFormData(data);
      setUpdateAllInstallments(false); // Resetar checkboxes
      setUpdateAllRecurrences(false);
      setShowUpdateDialog(true);
      return;
    }

    // Se não for parcelada nem recorrente, ou se já estiver paga, atualizar normalmente
    await performUpdate(data, false, false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Não resetar aqui para evitar removeChild errors
    // O reset será feito quando o modal abrir novamente
    onOpenChange(newOpen);
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>Editar Lançamento</DialogTitle>
          <DialogDescription>
            Preencha os dados da transação. Campos marcados com (opcional) não são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Supermercado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input placeholder="R$ 0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Compra</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    {showCreditCardSelect && (
                      <p className="text-xs text-muted-foreground">
                        Data de lançamento será calculada automaticamente
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento {showCreditCardSelect && watchCreditCardId ? '(calculada)' : '(opcional)'}</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || ''}
                        disabled={showCreditCardSelect && !!watchCreditCardId}
                        placeholder="Opcional"
                      />
                    </FormControl>
                    {showCreditCardSelect && watchCreditCardId && (
                      <p className="text-xs text-muted-foreground">
                        Calculada automaticamente pelo cartão
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {transaction?.type === 'expense' && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'pending'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Paga</SelectItem>
                        <SelectItem value="overdue">Vencida</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showCreditCardSelect && (
              <FormField
                control={form.control}
                name="credit_card_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cartão de Crédito</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cartão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {creditCards.map((card) => (
                          <SelectItem key={card.id} value={card.id}>
                            {card.name} - {card.brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showCreditCardSelect && (
              <div className="flex items-center justify-between">
                <FormLabel>Parcelado?</FormLabel>
                <Switch
                  checked={isInstallment}
                  onCheckedChange={setIsInstallment}
                />
              </div>
            )}

            {isInstallment && (
              <FormField
                control={form.control}
                name="total_installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="2" 
                        max="48" 
                        placeholder="Ex: 12" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {canEditRecurrence && (
              <>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Transação Recorrente</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Repetir esta transação automaticamente
                    </div>
                  </div>
                  <Switch
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>

                {isRecurring && (
                  <>
                    <FormField
                      control={form.control}
                      name="recurrence_period"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Período de Recorrência</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o período" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Diário</SelectItem>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="monthly">Mensal</SelectItem>
                              <SelectItem value="yearly">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recurrence_end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Final (opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              placeholder="Deixe em branco para repetir indefinidamente"
                              {...field} 
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            Deixe em branco para repetir indefinidamente
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </>
            )}

            {!canEditRecurrence && transaction.is_recurring && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                Esta transação foi gerada automaticamente por uma recorrência. 
                Para editar a recorrência, edite a transação original.
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Adicione notas sobre esta transação..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo de Anexos */}
            <FormItem>
              <FormLabel>Anexos (opcional)</FormLabel>
              <div className="space-y-3">
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Adicionar arquivos
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        JPG, PNG, GIF, PDF ou WEBP (máx. 10MB cada)
                      </p>
                      <Input
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          
                          // Validar tamanho
                          const invalidFiles = files.filter(f => f.size > 10 * 1024 * 1024);
                          if (invalidFiles.length > 0) {
                            toast.error('Alguns arquivos são muito grandes. Tamanho máximo: 10MB');
                            return;
                          }
                          
                          // Validar tipos
                          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp'];
                          const invalidTypes = files.filter(f => !allowedTypes.includes(f.type));
                          if (invalidTypes.length > 0) {
                            toast.error('Alguns arquivos têm tipo não permitido. Permitidos: JPG, PNG, GIF, PDF, WEBP');
                            return;
                          }
                          
                          setSelectedFiles(prev => {
                            const newFiles = [...prev, ...files];
                            return newFiles;
                          });
                          // Não resetar o input para permitir adicionar mais arquivos
                        }}
                        className="cursor-pointer text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Lista de arquivos selecionados */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 border border-border rounded-lg bg-muted/30"
                      >
                        <File className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormItem>
            </div>
            
            <div className="flex gap-3 px-6 py-4 border-t border-border shrink-0 bg-background">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={updateTransaction.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={updateTransaction.isPending}
              >
                {updateTransaction.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
      
      {/* Diálogo de confirmação para atualizar parcelas/recorrências */}
      <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atualizar lançamentos relacionados?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-2">
              {transaction?.is_installment && transaction?.installment_group_id && (
                <div className="space-y-2">
                  <p className="text-sm text-foreground font-medium">
                    Esta transação faz parte de um parcelamento ({transaction.current_installment}/{transaction.total_installments}).
                  </p>
                  <div className="flex items-start space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="update_installments"
                      checked={updateAllInstallments}
                      onChange={(e) => setUpdateAllInstallments(e.target.checked)}
                      className="w-4 h-4 rounded border-border mt-0.5"
                    />
                    <label htmlFor="update_installments" className="text-sm font-medium cursor-pointer flex-1">
                      Atualizar todas as parcelas abertas (pendentes ou em atraso) com as mesmas alterações
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Parcelas já pagas não serão atualizadas.
                  </p>
                </div>
              )}
              {transaction?.recurrence_group_id && (
                <div className="space-y-2">
                  <p className="text-sm text-foreground font-medium">
                    Esta transação {transaction.parent_recurrence_id ? 'é uma ocorrência de uma transação recorrente' : 'é uma transação recorrente'}.
                  </p>
                  <div className="flex items-start space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="update_recurrences"
                      checked={updateAllRecurrences}
                      onChange={(e) => setUpdateAllRecurrences(e.target.checked)}
                      className="w-4 h-4 rounded border-border mt-0.5"
                    />
                    <label htmlFor="update_recurrences" className="text-sm font-medium cursor-pointer flex-1">
                      Atualizar todas as ocorrências abertas (pendentes ou em atraso) com as mesmas alterações
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Ocorrências já pagas não serão atualizadas.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUpdateDialog(false);
              setUpdateAllInstallments(false);
              setUpdateAllRecurrences(false);
              setPendingFormData(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={async (e) => {
              e.preventDefault();
              setShowUpdateDialog(false);
              if (pendingFormData) {
                const formDataToUpdate = pendingFormData;
                // Capturar os valores dos checkboxes antes de limpar
                const shouldUpdateInstallments = updateAllInstallments;
                const shouldUpdateRecurrences = updateAllRecurrences;
                setPendingFormData(null);
                setUpdateAllInstallments(false);
                setUpdateAllRecurrences(false);
                // Executar atualização com os valores capturados
                await performUpdate(formDataToUpdate, shouldUpdateInstallments, shouldUpdateRecurrences);
              }
            }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

