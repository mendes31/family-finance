import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useEmailSettings, useSaveEmailSettings, useTestEmailSettings } from '@/hooks/useEmailSettings';
import { toast } from 'sonner';
import { Loader2, Mail, Save, Send, ExternalLink, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  smtp_host: z.string().min(1, 'Servidor SMTP é obrigatório'),
  smtp_user: z.string().email('E-mail inválido'),
  smtp_password: z.string().min(1, 'Senha é obrigatória'),
  smtp_port: z.coerce.number().min(1).max(65535, 'Porta inválida'),
  smtp_encryption: z.enum(['none', 'tls', 'ssl'], {
    required_error: 'Selecione o tipo de criptografia',
  }),
  from_email: z.string().email('E-mail remetente inválido'),
  from_name: z.string().min(1, 'Nome remetente é obrigatório'),
});

type FormData = z.infer<typeof formSchema>;

export default function EmailSettings() {
  const [isTesting, setIsTesting] = useState(false);
  const { data: settings, isLoading } = useEmailSettings();
  const saveSettings = useSaveEmailSettings();
  const testSettings = useTestEmailSettings();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      smtp_host: 'smtp.gmail.com',
      smtp_user: '',
      smtp_password: '',
      smtp_port: 587,
      smtp_encryption: 'tls',
      from_email: '',
      from_name: '',
    },
  });

  // Carregar dados quando disponíveis (usar useEffect para evitar erro de hooks)
  useEffect(() => {
    if (settings && !form.formState.isDirty) {
      form.reset({
        smtp_host: settings.smtp_host || 'smtp.gmail.com',
        smtp_user: settings.smtp_user || '',
        smtp_password: '', // Não preencher senha por segurança
        smtp_port: settings.smtp_port || 587,
        smtp_encryption: settings.smtp_encryption || 'tls',
        from_email: settings.from_email || '',
        from_name: settings.from_name || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: FormData) => {
    try {
      await saveSettings.mutateAsync(data);
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar configurações');
    }
  };

  const handleTest = async () => {
    const formData = form.getValues();
    
    // Validar antes de testar
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error('Corrija os erros no formulário antes de testar');
      return;
    }

    try {
      setIsTesting(true);
      await testSettings.mutateAsync(formData);
      toast.success('E-mail de teste enviado com sucesso! Verifique sua caixa de entrada.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar e-mail de teste');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-1">
            Configuração de Servidor de E-mail (SMTP)
          </h1>
          <p className="text-muted-foreground">
            Configure o servidor SMTP para envio de e-mails do sistema.
          </p>
        </div>
      </header>

      {/* Dicas para Gmail */}
      <Alert className="mb-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">Dicas para Gmail</AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200 mt-2 space-y-1">
          <p>• Use smtp.gmail.com como servidor</p>
          <p>• Porta: 587 com criptografia TLS</p>
          <p>• Use uma senha de app (não sua senha normal)</p>
          <p>• Ative a verificação em duas etapas no Google</p>
          <a
            href="https://support.google.com/accounts/answer/185833"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline mt-2"
          >
            Gerar senha de app <ExternalLink className="w-3 h-3" />
          </a>
        </AlertDescription>
      </Alert>

      {/* Formulário */}
      <section className="bg-card border border-border rounded-2xl shadow-sm p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Servidor SMTP */}
              <FormField
                control={form.control}
                name="smtp_host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servidor SMTP (Host)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="smtp.gmail.com" />
                    </FormControl>
                    <FormDescription>Para Gmail: smtp.gmail.com</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Usuário SMTP */}
              <FormField
                control={form.control}
                name="smtp_user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário SMTP (E-mail)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="seu-email@gmail.com"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Seu endereço de e-mail completo</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Senha SMTP */}
              <FormField
                control={form.control}
                name="smtp_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha SMTP</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Sua senha de app" />
                    </FormControl>
                    <FormDescription>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        IMPORTANTE:
                      </span>{' '}
                      Use uma senha de app do Google, não sua senha normal!
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Porta */}
              <FormField
                control={form.control}
                name="smtp_port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porta</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="587" />
                    </FormControl>
                    <FormDescription>Para Gmail: 587</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Criptografia */}
              <FormField
                control={form.control}
                name="smtp_encryption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Criptografia</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a criptografia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Para Gmail: TLS</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* E-mail Remetente */}
              <FormField
                control={form.control}
                name="from_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail Remetente</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="seu-email@gmail.com" />
                    </FormControl>
                    <FormDescription>E-mail que aparecerá como remetente</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nome Remetente */}
              <FormField
                control={form.control}
                name="from_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Remetente</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome da Empresa" />
                    </FormControl>
                    <FormDescription>Nome que aparecerá como remetente</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTest}
                  disabled={isTesting || saveSettings.isPending}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Testar Configuração
                    </>
                  )}
                </Button>
                <Button type="submit" disabled={saveSettings.isPending || isTesting}>
                  {saveSettings.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </section>
    </>
  );
}

