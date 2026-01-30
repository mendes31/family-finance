import { useState } from 'react';
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
  FormDescription,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useInviteMember } from '@/hooks/useFamily';
import { toast } from 'sonner';
import { Loader2, Mail, UserPlus, Shield, User } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('E-mail inválido'),
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional().or(z.literal('')),
  role: z.enum(['user', 'admin'], {
    required_error: 'Selecione um perfil',
  }),
  invitation_type: z.enum(['pre_register', 'full_register'], {
    required_error: 'Selecione o tipo de cadastro',
  }),
});

type FormData = z.infer<typeof formSchema>;

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleOptions = [
  { value: 'user', label: 'Usuário', description: 'Pode visualizar e criar lançamentos', icon: User },
  { value: 'admin', label: 'Administrador', description: 'Acesso total, pode gerenciar membros', icon: Shield },
];

export function InviteMemberModal({ open, onOpenChange }: InviteMemberModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inviteMember = useInviteMember();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      full_name: '',
      role: 'user',
      invitation_type: 'pre_register',
    },
  });

  const watchInvitationType = form.watch('invitation_type');
  const watchRole = form.watch('role');

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      const result = await inviteMember.mutateAsync({
        email: data.email,
        full_name: data.full_name || undefined,
        role: data.role,
        invitation_type: data.invitation_type,
      });

      // Verificar se o e-mail foi enviado
      if (result.email_sent === false) {
        const errorMsg = result.email_error || 'Verifique as configurações SMTP em Configurações > E-mail.';
        toast.warning('Convite criado, mas o e-mail não foi enviado', {
          description: errorMsg,
          duration: 8000,
        });
      } else {
        toast.success('Convite criado e e-mail enviado com sucesso!', {
          description: 'O convite foi enviado para ' + data.email,
        });
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar convite');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Convidar Membro
          </DialogTitle>
          <DialogDescription>
            Convide um novo membro para sua família financeira. Você pode fazer um pré-cadastro ou cadastro completo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de Cadastro */}
            <FormField
              control={form.control}
              name="invitation_type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Cadastro</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-start space-x-3 space-y-0 rounded-md border border-border p-4">
                        <RadioGroupItem value="pre_register" id="pre_register" className="mt-1" />
                        <Label htmlFor="pre_register" className="flex-1 cursor-pointer">
                          <div className="font-medium">Pré-cadastro</div>
                          <div className="text-sm text-muted-foreground">
                            Apenas e-mail e nome. O membro completa o cadastro depois.
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-start space-x-3 space-y-0 rounded-md border border-border p-4">
                        <RadioGroupItem value="full_register" id="full_register" className="mt-1" />
                        <Label htmlFor="full_register" className="flex-1 cursor-pointer">
                          <div className="font-medium">Cadastro Completo</div>
                          <div className="text-sm text-muted-foreground">
                            Cadastro completo com senha gerada. Credenciais serão enviadas por e-mail.
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* E-mail */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="exemplo@email.com"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    O e-mail será usado para enviar o convite e credenciais (se cadastro completo).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nome (opcional para pré-cadastro, obrigatório para cadastro completo) */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nome Completo {watchInvitationType === 'full_register' && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nome do membro"
                    />
                  </FormControl>
                  <FormDescription>
                    {watchInvitationType === 'pre_register'
                      ? 'Opcional. Pode ser preenchido depois.'
                      : 'Obrigatório para cadastro completo.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Perfil/Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {watchRole === 'admin'
                      ? 'Administradores podem gerenciar membros e configurações da família.'
                      : 'Usuários podem visualizar e criar lançamentos financeiros.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Convite
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

