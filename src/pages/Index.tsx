import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import {
  Wallet,
  ArrowRight,
  BarChart3,
  CreditCard,
  Users,
  Shield,
  Smartphone,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Gestão Familiar',
    description: 'Controle colaborativo para toda a família com perfis individuais.',
  },
  {
    icon: CreditCard,
    title: 'Cartões de Crédito',
    description: 'Acompanhe faturas, limites e datas de vencimento automaticamente.',
  },
  {
    icon: BarChart3,
    title: 'Dashboards Inteligentes',
    description: 'Visualize seus gastos por categoria, período e integrante.',
  },
  {
    icon: Shield,
    title: 'Seguro e Privado',
    description: 'Seus dados financeiros protegidos com criptografia de ponta.',
  },
  {
    icon: Smartphone,
    title: 'WhatsApp Integrado',
    description: 'Lance despesas e consulte saldos diretamente pelo WhatsApp.',
  },
  {
    icon: TrendingUp,
    title: 'Investimentos',
    description: 'Acompanhe a evolução do seu patrimônio e investimentos.',
  },
];

const plans = [
  'Lançamentos ilimitados',
  'Múltiplos cartões de crédito',
  'Parcelamentos automáticos',
  'Relatórios por categoria',
  'Metas financeiras',
  'Exportação em Excel/PDF',
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" showText={true} variant="monogram" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>+10.000 famílias já economizaram juntas</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 animate-slide-up">
            Controle financeiro
            <span className="block text-accent">para toda a família</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
            Gerencie receitas, despesas e investimentos de forma colaborativa.
            Acompanhe metas e tome decisões financeiras mais inteligentes em família.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Link to="/auth">
              <Button variant="gradient" size="xl" className="gap-2 w-full sm:w-auto">
                Começar Gratuitamente
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="xl" className="gap-2 w-full sm:w-auto">
                Ver Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-slide-up" style={{ animationDelay: '300ms' }}>
            {[
              { value: 'R$50M+', label: 'Economizados' },
              { value: '10K+', label: 'Famílias' },
              { value: '1M+', label: 'Lançamentos' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Tudo que você precisa para organizar suas finanças
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Recursos completos para você e sua família terem controle total sobre o dinheiro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-hero rounded-3xl p-8 md:p-12 lg:p-16 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-40 h-40 border border-current rounded-full" />
              <div className="absolute bottom-10 right-10 w-60 h-60 border border-current rounded-full" />
            </div>

            <div className="relative text-center text-primary-foreground max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Comece a controlar suas finanças hoje
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8">
                Cadastro gratuito, sem cartão de crédito. Comece a organizar suas finanças em família agora mesmo.
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left max-w-md mx-auto">
                {plans.map((plan) => (
                  <li key={plan} className="flex items-center gap-2 text-sm text-primary-foreground/90">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    {plan}
                  </li>
                ))}
              </ul>

              <Link to="/auth">
                <Button variant="accent" size="xl" className="gap-2">
                  Criar Conta Gratuita
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">FinFamily</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 FinFamily. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
