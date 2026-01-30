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
import { Checkbox } from '@/components/ui/checkbox';
import { useWhatsAppSettings, useSaveWhatsAppSettings, useTestWhatsAppSettings } from '@/hooks/useWhatsAppSettings';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Save, Send, ExternalLink, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  provider: z.enum(['evolution', 'twilio', 'meta'], {
    required_error: 'Selecione o provedor da API',
  }),
  api_url: z.string().optional().or(z.literal('')).refine((val) => !val || val === '' || z.string().url().safeParse(val).success, {
    message: 'URL inválida',
  }),
  api_key: z.string().min(1, 'API Key é obrigatória'),
  api_token: z.string().optional().or(z.literal('')),
  instance_name: z.string().min(1, 'Nome da instância é obrigatório'),
  whatsapp_number: z.string().min(1, 'Número WhatsApp é obrigatório'),
  webhook_url: z.string().refine((val) => !val || val === '' || z.string().url().safeParse(val).success, {
    message: 'URL inválida',
  }).optional().or(z.literal('')),
  is_active: z.boolean().default(true),
}).refine((data) => {
  // Se for Twilio ou Meta, API Token é obrigatório
  if ((data.provider === 'twilio' || data.provider === 'meta') && (!data.api_token || data.api_token.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'API Token é obrigatório para Twilio e Meta',
  path: ['api_token'],
});

type FormData = z.infer<typeof formSchema>;

export default function WhatsAppSettings() {
  const [isTesting, setIsTesting] = useState(false);
  const { data: settings, isLoading } = useWhatsAppSettings();
  const saveSettings = useSaveWhatsAppSettings();
  const testSettings = useTestWhatsAppSettings();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: 'evolution',
      api_url: '',
      api_key: '',
      api_token: '',
      instance_name: 'WhatsApp',
      whatsapp_number: '',
      webhook_url: '',
      is_active: true,
    },
  });

  const watchProvider = form.watch('provider');

  // Carregar dados quando disponíveis
  useEffect(() => {
    if (settings && !form.formState.isDirty) {
      form.reset({
        provider: settings.provider || 'evolution',
        api_url: settings.api_url || '',
        api_key: settings.api_key || '',
        api_token: settings.api_token || '',
        instance_name: settings.instance_name || 'WhatsApp',
        whatsapp_number: settings.whatsapp_number || '',
        webhook_url: settings.webhook_url || '',
        is_active: settings.is_active ?? true,
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

    if (!formData.whatsapp_number) {
      toast.error('Informe o número para teste');
      return;
    }

    try {
      setIsTesting(true);
      await testSettings.mutateAsync({
        ...formData,
        test_number: formData.whatsapp_number,
      });
      toast.success('Mensagem de teste enviada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar mensagem de teste');
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
            Configuração de WhatsApp
          </h1>
          <p className="text-muted-foreground">
            Configure a integração com WhatsApp para envio de mensagens automáticas.
          </p>
        </div>
      </header>

      {/* Alerta para Evolution API */}
      {form.watch('provider') === 'evolution' && (
        <Alert className="mb-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">Importante: Criar Instância na Evolution API</AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200 mt-2 space-y-1">
            <p>Antes de testar, você precisa criar a instância na Evolution API:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Acesse o painel da Evolution API: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{form.watch('api_url') || 'http://seu-servidor:8080'}</code></li>
              <li>Crie uma nova instância com o nome: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{form.watch('instance_name') || 'WhatsApp'}</code></li>
              <li>Escaneie o QR Code com seu WhatsApp</li>
              <li>Após a instância estar conectada, teste novamente</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Principal - Dados de Conexão */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulário */}
          <section className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Dados de Conexão
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Provedor da API */}
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provedor da API</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o provedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="evolution">
                              Evolution API (Recomendado - Open Source)
                            </SelectItem>
                            <SelectItem value="twilio">Twilio</SelectItem>
                            <SelectItem value="meta">Meta (Facebook)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {watchProvider === 'evolution' && (
                            <span className="text-green-600 dark:text-green-400">
                              Evolution API: Grátis, open source, fácil de hospedar
                            </span>
                          )}
                          {watchProvider === 'twilio' && (
                            <span className="text-amber-600 dark:text-amber-400">
                              Twilio: Pago, confiável, internacional
                            </span>
                          )}
                          {watchProvider === 'meta' && (
                            <span className="text-blue-600 dark:text-blue-400">
                              Meta: Oficial, requer aprovação do Facebook
                            </span>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* URL da API */}
                  <FormField
                    control={form.control}
                    name="api_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL da API</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://api.evolution-api.com" />
                        </FormControl>
                        <FormDescription>
                          URL base da API (sem barra no final)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* API Key */}
                  <FormField
                    control={form.control}
                    name="api_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Sua API Key" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* API Token */}
                  <FormField
                    control={form.control}
                    name="api_token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Token</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Seu API Token" />
                        </FormControl>
                        <FormDescription>
                          {watchProvider === 'twilio' && 'Obrigatório para Twilio (Auth Token)'}
                          {watchProvider === 'meta' && 'Obrigatório para Meta (Access Token)'}
                          {watchProvider === 'evolution' && 'Opcional para Evolution API'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Nome da Instância */}
                  <FormField
                    control={form.control}
                    name="instance_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Instância</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="WhatsApp" />
                        </FormControl>
                        <FormDescription>
                          Nome configurado na API
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Número WhatsApp */}
                  <FormField
                    control={form.control}
                    name="whatsapp_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número WhatsApp</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="5599999999999" />
                        </FormControl>
                        <FormDescription>
                          Número com DDI (sem espaços)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Webhook URL */}
                  <FormField
                    control={form.control}
                    name="webhook_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook URL (Opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://seusite.com.br/webhook/whatsapp" />
                        </FormControl>
                        <FormDescription>
                          URL para receber respostas e notificações
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ativar integração */}
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Ativar integração WhatsApp
                          </FormLabel>
                          <FormDescription>
                            Desative para pausar temporariamente o envio de mensagens
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Botão Salvar */}
                  <div className="flex justify-end pt-4 border-t border-border">
                    <Button type="submit" disabled={saveSettings.isPending || isTesting} className="bg-green-600 hover:bg-green-700">
                      {saveSettings.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Configuração
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </section>
        </div>

        {/* Painel Lateral Direito */}
        <div className="space-y-6">
          {/* Testar Configuração */}
          <section className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Testar Configuração
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Número de Teste
                </label>
                <Input
                  placeholder="5599999999999"
                  value={form.watch('whatsapp_number')}
                  readOnly
                  className="mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  Digite o número para receber a mensagem de teste
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={isTesting || saveSettings.isPending}
                className="w-full bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950 dark:hover:bg-yellow-900 border-yellow-300 dark:border-yellow-700"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Teste
                  </>
                )}
              </Button>
            </div>
          </section>

          {/* Onde Usar */}
          <section className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Info className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Onde Usar
              </h2>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Esta configuração será usada em:
            </p>

            <div className="space-y-3">
              {[
                'Recuperar Senha (enviar código via WhatsApp)',
                'CRM (contatar parceiros/clientes)',
                'Notificações (alertas automáticos)',
                'Lembretes (atividades, vencimentos)',
                'Confirmações (pedidos, agendamentos)',
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Documentação */}
          <section className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Documentação
              </h2>
            </div>

            <div className="space-y-4">
              {/* Evolution API */}
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-2">
                  Evolution API (Recomendado)
                </h3>
                <div className="space-y-2 text-sm">
                  <a
                    href="https://github.com/EvolutionAPI/evolution-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    GitHub: EvolutionAPI/evolution-api
                  </a>
                  <a
                    href="https://hub.docker.com/r/atendai/evolution-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Docker: atendai/evolution-api
                  </a>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span className="text-muted-foreground">Grátis e open source</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span className="text-muted-foreground">Hospedagem própria</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span className="text-muted-foreground">Sem limites de mensagens</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Twilio */}
              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold text-sm text-foreground mb-2">
                  Twilio
                </h3>
                <div className="space-y-2 text-sm">
                  <a
                    href="https://www.twilio.com/whatsapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Site: twilio.com/whatsapp
                  </a>
                  <p className="text-muted-foreground">
                    Account SID = API Key
                  </p>
                  <p className="text-muted-foreground">
                    Auth Token = API Token
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-600 dark:text-amber-400 text-xs">Pago por mensagem</span>
                  </div>
                </div>
              </div>

              {/* Meta/Facebook */}
              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold text-sm text-foreground mb-2">
                  Meta/Facebook
                </h3>
                <div className="space-y-2 text-sm">
                  <a
                    href="https://developers.facebook.com/docs/whatsapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Site: developers.facebook.com
                  </a>
                  <p className="text-muted-foreground">
                    Requer App Business verificado
                  </p>
                  <p className="text-muted-foreground">
                    Phone Number ID necessário
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-600 dark:text-amber-400 text-xs">Processo de aprovação longo</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

