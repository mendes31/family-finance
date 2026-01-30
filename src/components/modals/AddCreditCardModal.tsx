import { useEffect } from 'react';
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
import { useCreateCreditCard } from '@/hooks/useCreditCards';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  brand: z.string().min(1, 'Bandeira é obrigatória'),
  color: z.string().optional(),
  credit_limit: z.string().min(1, 'Limite é obrigatório'),
  closing_day: z.string().min(1, 'Dia de fechamento é obrigatório'),
  due_day: z.string().min(1, 'Dia de vencimento é obrigatório'),
});

type FormData = z.infer<typeof formSchema>;

interface AddCreditCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AddCreditCardModal({ open, onOpenChange }: AddCreditCardModalProps) {
  const createCreditCard = useCreateCreditCard();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      brand: '',
      color: '',
      credit_limit: '',
      closing_day: '',
      due_day: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Validar campos obrigatórios
      if (!data.name || !data.brand || !data.credit_limit || !data.closing_day || !data.due_day) {
        toast.error('Preencha todos os campos obrigatórios');
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

      // Converter 'default' para null/string vazia para cor
      const colorValue = data.color === 'default' || data.color === '' ? null : data.color;
      
      const result = await createCreditCard.mutateAsync({
        name: data.name.trim(),
        brand: data.brand,
        color: colorValue,
        credit_limit: creditLimit,
        closing_day: closingDay,
        due_day: dueDay,
      });

      if (result) {
        toast.success('Cartão criado com sucesso!');
        // Fechar modal - o form será resetado quando abrir novamente
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Erro ao criar cartão:', error);
      toast.error(error.message || 'Erro ao criar cartão');
    }
  };

  // Reset form when modal opens (not when closes to avoid removeChild errors)
  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        brand: '',
        color: '',
        credit_limit: '',
        closing_day: '',
        due_day: '',
      });
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Novo Cartão de Crédito</DialogTitle>
          <DialogDescription>
            Preencha os dados do cartão de crédito
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                const currentValue = field.value || '';
                return (
                  <FormItem>
                    <FormLabel>Cor do Cartão</FormLabel>
                    <div className="space-y-3">
                      <Select 
                        onValueChange={(value) => field.onChange(value === 'default' ? '' : value)} 
                        value={currentValue || 'default'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma cor" />
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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createCreditCard.isPending}
              >
                {createCreditCard.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
