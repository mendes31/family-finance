import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Users, ArrowRight, Loader2 } from 'lucide-react';
import { useCreateFamily } from '@/hooks/useFamily';
import { useToast } from '@/hooks/use-toast';

export default function FamilyOnboarding() {
  const [familyName, setFamilyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: createFamily } = useCreateFamily();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!familyName.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe o nome da família.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await createFamily(familyName);
      toast({
        title: 'Família criada!',
        description: 'Agora você pode começar a gerenciar suas finanças.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível criar a família. Tente novamente.';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-elegant p-8 border border-border/50">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
              <Wallet className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-foreground">
                FinFamily
              </h1>
              <p className="text-sm text-muted-foreground">Gestão Financeira Familiar</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              Crie sua família
            </h2>
            <p className="text-muted-foreground">
              Dê um nome para identificar o grupo familiar que irá gerenciar as finanças juntos.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="familyName">Nome da família</Label>
              <Input
                id="familyName"
                type="text"
                placeholder="Ex: Família Silva"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                maxLength={100}
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Começar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Você será o administrador da família e poderá convidar outros membros depois.
          </p>
        </div>
      </div>
    </div>
  );
}
