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
import { Switch } from '@/components/ui/switch';
import { useUpdateCreditCard, CreditCard } from '@/hooks/useCreditCards';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  brand: z.string().min(1, 'Bandeira é obrigatória'),
  color: z.string().optional().nullable(),
  credit_limit: z.string().min(1, 'Limite é obrigatório'),
  closing_day: z.string().min(1, 'Dia de fechamento é obrigatório'),
  due_day: z.string().min(1, 'Dia de vencimento é obrigatório'),
  is_active: z.union([z.boolean(), z.undefined()]).default(true),
});

type FormData = z.infer<typeof formSchema>;

interface EditCreditCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CreditCard | null;
}

const cardBrands = [
  'Visa',
  'Mastercard',
  'Elo',
  'American Express',
  'Hipercard',
  'Diners Club',
  'Nubank',
  'Inter',
  'C6 Bank',
  'Outro',
];

const colorOptions = [
  // Cores primárias
  { value: '#1a1f71', label: 'Azul Escuro', color: '#1a1f71' },
  { value: '#eb001b', label: 'Vermelho', color: '#eb001b' },
  { value: '#00a4e0', label: 'Azul Claro', color: '#00a4e0' },
  { value: '#006fcf', label: 'Azul', color: '#006fcf' },
  { value: '#822124', label: 'Vermelho Escuro', color: '#822124' },
  { value: '#0079be', label: 'Azul Médio', color: '#0079be' },
  { value: '#8a3ab9', label: 'Roxo', color: '#8a3ab9' },
  { value: '#ff7a00', label: 'Laranja', color: '#ff7a00' },
  { value: '#1a1a1a', label: 'Preto', color: '#1a1a1a' },
  { value: '#22c55e', label: 'Verde', color: '#22c55e' },
  { value: '#f59e0b', label: 'Amarelo', color: '#f59e0b' },
  { value: '#ec4899', label: 'Rosa', color: '#ec4899' },
  // Cores adicionais
  { value: '#2BB0A6', label: 'Verde Água', color: '#2BB0A6' },
  { value: '#1F3A5F', label: 'Azul Profundo', color: '#1F3A5F' },
  { value: '#6366f1', label: 'Índigo', color: '#6366f1' },
  { value: '#8b5cf6', label: 'Roxo Claro', color: '#8b5cf6' },
  { value: '#d946ef', label: 'Fúcsia', color: '#d946ef' },
  { value: '#f43f5e', label: 'Rosa Escuro', color: '#f43f5e' },
  { value: '#ef4444', label: 'Vermelho Claro', color: '#ef4444' },
  { value: '#f97316', label: 'Laranja Claro', color: '#f97316' },
  { value: '#eab308', label: 'Amarelo Claro', color: '#eab308' },
  { value: '#84cc16', label: 'Verde Lima', color: '#84cc16' },
  { value: '#10b981', label: 'Verde Esmeralda', color: '#10b981' },
  { value: '#14b8a6', label: 'Turquesa', color: '#14b8a6' },
  { value: '#06b6d4', label: 'Ciano', color: '#06b6d4' },
  { value: '#0ea5e9', label: 'Azul Céu', color: '#0ea5e9' },
  { value: '#3b82f6', label: 'Azul Royal', color: '#3b82f6' },
  { value: '#64748b', label: 'Cinza', color: '#64748b' },
  { value: '#475569', label: 'Cinza Escuro', color: '#475569' },
  { value: '#334155', label: 'Cinza Aço', color: '#334155' },
  { value: '#0f172a', label: 'Preto Azulado', color: '#0f172a' },
  { value: '#ffffff', label: 'Branco', color: '#ffffff' },
];

export function EditCreditCardModal({ open, onOpenChange, card }: EditCreditCardModalProps) {
  const updateCreditCard = useUpdateCreditCard();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      brand: '',
      color: '',
      credit_limit: '',
      closing_day: '',
      due_day: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (card && open) {
      // Garantir que is_active seja sempre boolean
      const isActive = typeof card.is_active === 'boolean' ? card.is_active : (card.is_active === 1 || card.is_active === '1');
      
      form.reset({
        name: card.name || '',
        brand: card.brand || '',
        color: card.color || '',
        credit_limit: card.credit_limit?.toString() || '',
        closing_day: card.closing_day?.toString() || '',
        due_day: card.due_day?.toString() || '',
        is_active: isActive,
      });
    }
  }, [card, open, form]);

  // Reset form when modal opens (not when closes to avoid removeChild errors)
  // The form will be populated by the card data in the other useEffect
  useEffect(() => {
    if (open && !card) {
      form.reset({
        name: '',
        brand: '',
        color: '',
        credit_limit: '',
        closing_day: '',
        due_day: '',
        is_active: true,
      });
    }
  }, [open, card, form]);

  const onSubmit = async (data: FormData) => {
    if (!card) {
      console.error('Card não encontrado');
      return;
    }

    console.log('onSubmit chamado com dados:', data);

    try {
      // Validar campos obrigatórios
      if (!data.name || !data.brand || !data.credit_limit || !data.closing_day || !data.due_day) {
        toast.error('Preencha todos os campos obrigatórios');
        console.error('Campos obrigatórios faltando:', { 
          name: !!data.name, 
          brand: !!data.brand, 
          credit_limit: !!data.credit_limit, 
          closing_day: !!data.closing_day, 
          due_day: !!data.due_day 
        });
        return;
      }

      const creditLimit = parseFloat(data.credit_limit.replace(/[^\d,.-]/g, '').replace(',', '.'));
      const closingDay = parseInt(data.closing_day);
      const dueDay = parseInt(data.due_day);

      if (isNaN(creditLimit) || creditLimit <= 0) {
        toast.error('Limite inválido');
        return;
      }

      if (isNaN(closingDay) || closingDay < 1 || closingDay > 31) {
        toast.error('Dia de fechamento deve estar entre 1 e 31');
        return;
      }

      if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
        toast.error('Dia de vencimento deve estar entre 1 e 31');
        return;
      }

      // Converter 'default' ou string vazia para null para cor
      let colorValue = data.color;
      if (colorValue === 'default' || colorValue === '' || !colorValue) {
        colorValue = null;
      }
      
      console.log('Enviando dados para API:', {
        id: card.id,
        name: data.name.trim(),
        brand: data.brand,
        color: colorValue,
        credit_limit: creditLimit,
        closing_day: closingDay,
        due_day: dueDay,
        is_active: data.is_active,
      });
      
      const result = await updateCreditCard.mutateAsync({
        id: card.id,
        name: data.name.trim(),
        brand: data.brand,
        color: colorValue,
        credit_limit: creditLimit,
        closing_day: closingDay,
        due_day: dueDay,
        is_active: data.is_active,
      });

      console.log('Resultado da mutation:', result);

      if (result) {
        toast.success('Cartão atualizado com sucesso!');
        // Fechar modal primeiro, o useEffect vai resetar o form
        onOpenChange(false);
      } else {
        toast.error('Erro ao atualizar cartão: resposta inválida');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar cartão:', error);
      const errorMessage = error?.message || error?.error || 'Erro ao atualizar cartão';
      toast.error(errorMessage);
    }
  };

  // Não renderizar se não houver card
  if (!card) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Editar Cartão de Crédito</DialogTitle>
          <DialogDescription>
            Atualize os dados do cartão de crédito
          </DialogDescription>
        </DialogHeader>

        {!card ? (
          <div className="py-4">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <Form {...form}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              console.log('Form submit event capturado');
              form.handleSubmit(
                (data) => {
                  console.log('Validação passou, chamando onSubmit');
                  onSubmit(data);
                },
                (errors) => {
                  console.error('Erros de validação:', errors);
                  toast.error('Por favor, corrija os erros no formulário');
                }
              )(e);
            }} 
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cartão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nubank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bandeira</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a bandeira" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cardBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
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
              name="color"
              render={({ field }) => {
                // Garantir que o valor seja sempre uma string válida
                const currentValue = field.value || '';
                const selectValue = currentValue === '' ? 'default' : currentValue;
                
                return (
                  <FormItem>
                    <FormLabel>Cor do Cartão</FormLabel>
                    <div className="space-y-3">
                      <Select 
                        onValueChange={(value) => {
                          // Converter 'default' para string vazia para o form
                          const newValue = value === 'default' ? '' : value;
                          field.onChange(newValue);
                        }} 
                        value={selectValue}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma cor">
                              {selectValue === 'default' || selectValue === '' ? (
                                'Cor padrão da bandeira'
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded-full border border-border"
                                    style={{ backgroundColor: selectValue }}
                                  />
                                  {colorOptions.find(opt => opt.value === selectValue)?.label || 'Cor personalizada'}
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="default">Cor padrão da bandeira</SelectItem>
                          {colorOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full border border-border"
                                  style={{ backgroundColor: option.color }}
                                />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Color Picker Grid */}
                      <div className="grid grid-cols-10 gap-2 p-3 border border-border rounded-lg bg-muted/30">
                        {colorOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            className={`
                              w-8 h-8 rounded-full border-2 transition-all hover:scale-110
                              ${currentValue === option.value ? 'border-foreground ring-2 ring-primary' : 'border-border'}
                            `}
                            style={{ backgroundColor: option.color }}
                            title={option.label}
                          />
                        ))}
                      </div>
                      {/* Custom Color Picker */}
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={currentValue || '#1a1f71'}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-16 h-10 cursor-pointer"
                          title="Cor personalizada"
                        />
                        <Input
                          type="text"
                          placeholder="#1a1f71"
                          value={currentValue || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^#[0-9A-Fa-f]{6}$/.test(value)) {
                              field.onChange(value);
                            }
                          }}
                          className="flex-1 font-mono text-sm"
                          maxLength={7}
                        />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="credit_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite</FormLabel>
                  <FormControl>
                    <Input placeholder="R$ 5.000,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="closing_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de Fechamento</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="31" 
                        placeholder="Ex: 20" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de Vencimento</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="31" 
                        placeholder="Ex: 27" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Cartão Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Desative para ocultar o cartão sem excluí-lo
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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={updateCreditCard.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={updateCreditCard.isPending}
              >
                {updateCreditCard.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

