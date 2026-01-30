import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';

const formSchema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme a senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof formSchema>;

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<{
    email: string;
    full_name?: string;
    invitation_type: string;
    valid: boolean;
    message?: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Função para aceitar convite automaticamente (full_register)
  const handleAutoAccept = async (email: string) => {
    if (!token) {
      console.error('Token não encontrado para aceitar convite');
      return;
    }

    try {
      console.log('Iniciando aceitação automática do convite...', { email, token: token.substring(0, 20) + '...' });
      setIsLoading(true);
      
      const response = await fetch('/family_finance/api/family.php?action=accept_invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token,
          password: '', // Vazio para full_register
        }),
      });

      const result = await response.json();
      console.log('Resposta da API:', result);

      if (result.error) {
        console.error('Erro ao aceitar convite:', result.error);
        toast.error(result.error);
        setInvitationInfo(prev => prev ? { ...prev, valid: false, message: result.error } : null);
        setIsLoading(false);
        return;
      }

      console.log('Convite aceito com sucesso!');
      toast.success('Convite aceito! Sua conta foi criada com sucesso. Agora você pode fazer login.');
      
      // Redirecionar para login após 3 segundos para o usuário ver a mensagem
      setTimeout(() => {
        navigate('/auth');
      }, 3000);

    } catch (error: any) {
      console.error('Erro ao aceitar convite:', error);
      toast.error(error.message || 'Erro ao aceitar convite');
      setInvitationInfo(prev => prev ? { ...prev, valid: false, message: 'Erro ao aceitar convite' } : null);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar convite ao carregar
  useEffect(() => {
    if (!token) {
      setInvitationInfo({
        email: '',
        invitation_type: 'pre_register',
        valid: false,
        message: 'Token de convite não fornecido',
      });
      setIsChecking(false);
      return;
    }

    // Verificar se o convite é válido
    fetch(`/family_finance/api/family.php?action=check_invitation&token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setInvitationInfo({
            email: data.email || '',
            invitation_type: data.invitation_type || 'pre_register',
            valid: false,
            message: data.error,
          });
        } else {
          setInvitationInfo({
            email: data.email || '',
            full_name: data.full_name,
            invitation_type: data.invitation_type || 'pre_register',
            valid: true,
          });

          // Se for full_register, aceitar automaticamente após um pequeno delay
          if (data.invitation_type === 'full_register') {
            console.log('Convite full_register detectado, aceitando automaticamente...');
            setTimeout(() => {
              handleAutoAccept(data.email);
            }, 500);
          }
        }
      })
      .catch(error => {
        setInvitationInfo({
          email: '',
          invitation_type: 'pre_register',
          valid: false,
          message: 'Erro ao verificar convite',
        });
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Token de convite não encontrado');
      return;
    }

    try {
      setIsLoading(true);

      // Aceitar convite
      const response = await fetch('/family_finance/api/family.php?action=accept_invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Fazer login automaticamente (apenas para pré-cadastro)
      // Para cadastro completo, o usuário deve usar a senha do e-mail
      if (invitationInfo!.invitation_type === 'pre_register') {
        const loginResponse = await authApi.signIn(invitationInfo!.email, data.password);
        
        if (loginResponse.error) {
          toast.error('Convite aceito, mas erro ao fazer login. Faça login manualmente.');
          navigate('/auth');
          return;
        }

        toast.success('Convite aceito com sucesso! Bem-vindo ao FinFamily!');
        navigate('/dashboard');
      } else {
        // Cadastro completo: redirecionar para login
        toast.success('Convite aceito! Use as credenciais enviadas por e-mail para fazer login.');
        navigate('/auth');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao aceitar convite');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando convite...</p>
        </div>
      </div>
    );
  }

  if (!invitationInfo || !invitationInfo.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-lg p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <XCircle className="w-16 h-16 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">Convite Inválido</h1>
            <p className="text-muted-foreground">
              {invitationInfo?.message || 'Este convite não é válido ou já expirou.'}
            </p>
            <Button onClick={() => navigate('/auth')} variant="outline">
              Ir para Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Se for cadastro completo, mostrar status de aceitação
  if (invitationInfo.invitation_type === 'full_register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-lg p-8">
          <div className="flex flex-col items-center text-center gap-4">
            {isLoading ? (
              <>
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Aceitando Convite...</h1>
                <p className="text-muted-foreground">
                  Aguarde enquanto criamos sua conta.
                </p>
              </>
            ) : (
              <>
                <CheckCircle className="w-16 h-16 text-green-500" />
                <h1 className="text-2xl font-bold text-foreground">Convite Aceito!</h1>
                <p className="text-muted-foreground">
                  Sua conta foi criada com sucesso.
                </p>
                <p className="text-sm text-muted-foreground">
                  E-mail: <strong>{invitationInfo.email}</strong>
                </p>
                <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Use a senha que foi enviada por e-mail para fazer login. Você será redirecionado automaticamente.
                  </AlertDescription>
                </Alert>
                <Button onClick={() => navigate('/auth')} className="w-full" variant="outline">
                  Ir para Login Agora
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Aceitar Convite</h1>
          <p className="text-muted-foreground">
            Complete seu cadastro para fazer parte da família
          </p>
          {invitationInfo.full_name && (
            <p className="text-sm font-medium text-foreground">
              Olá, {invitationInfo.full_name}!
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            E-mail: <strong>{invitationInfo.email}</strong>
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="password"
                        placeholder="Digite sua senha"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Mínimo de 6 caracteres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="password"
                        placeholder="Confirme sua senha"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aceitar Convite e Criar Conta
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="text-sm"
          >
            Já tem uma conta? Fazer login
          </Button>
        </div>
      </div>
    </div>
  );
}

