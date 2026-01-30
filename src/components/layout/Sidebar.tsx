import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowUpDown,
  CreditCard,
  PieChart,
  Target,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
}

// Garantir que o label seja sempre 'Dashboard' e nunca 'Painel'
const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Lançamentos', icon: ArrowUpDown, href: '/transactions' },
  { label: 'Cartões', icon: CreditCard, href: '/cards' },
  { label: 'Categorias', icon: PieChart, href: '/categories' },
  { label: 'Metas', icon: Target, href: '/goals' },
  { label: 'Família', icon: Users, href: '/family' },
];

// Garantir que o primeiro item seja sempre 'Dashboard'
if (navItems[0]?.label !== 'Dashboard') {
  navItems[0] = { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' };
}

const secondaryItems: NavItem[] = [
  { label: 'Configurações', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();

  const isActive = (href: string) => {
    if (href === '/settings') {
      // Para configurações, considerar ativo se estiver em /settings ou /settings/*
      return location.pathname === '/settings' || location.pathname.startsWith('/settings/');
    }
    return location.pathname === href;
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast({
        title: 'Até logo!',
        description: 'Você saiu da sua conta.',
      });
      navigate('/');
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível sair. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar h-16 flex items-center justify-between px-4 shadow-lg">
        <Logo size="sm" showText={true} variant="monogram" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </header>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-72 bg-sidebar transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Logo size="md" showText={true} variant="monogram" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-4 mb-3">
            Menu
          </p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => {
                // Fechar menu apenas em mobile
                if (window.innerWidth < 1024) {
                  setIsOpen(false);
                }
              }}
              className={cn(
                "nav-item group",
                isActive(item.href) && "nav-item-active"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive(item.href) && "w-6 h-6")} />
              <span className={cn(
                "flex-1",
                isActive(item.href) && "font-semibold font-weight-600"
              )}>
                {/* Forçar sempre 'Dashboard' para evitar oscilação com cache */}
                {item.href === '/dashboard' || item.href.includes('dashboard') ? 'Dashboard' : item.label}
              </span>
              {item.badge && (
                <span className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              <ChevronRight
                className={cn(
                  "w-4 h-4 opacity-0 -translate-x-2 transition-all",
                  "group-hover:opacity-100 group-hover:translate-x-0",
                  isActive(item.href) && "opacity-100 translate-x-0"
                )}
              />
            </Link>
          ))}

          <div className="pt-6">
            <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-4 mb-3">
              Sistema
            </p>
            {secondaryItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => {
                  // Fechar menu apenas em mobile
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={cn(
                  "nav-item group",
                  isActive(item.href) && "nav-item-active"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive(item.href) && "w-6 h-6")} />
                <span className={cn(
                  "flex-1",
                  isActive(item.href) && "font-semibold font-weight-600"
                )}>{item.label}</span>
                {item.badge && (
                  <span className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                <ChevronRight
                  className={cn(
                    "w-4 h-4 opacity-0 -translate-x-2 transition-all",
                    "group-hover:opacity-100 group-hover:translate-x-0",
                    isActive(item.href) && "opacity-100 translate-x-0"
                  )}
                />
              </Link>
            ))}
            <div className="px-4 mt-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/70">
                <ThemeToggle />
                <span className="flex-1 text-sm">Tema</span>
              </div>
            </div>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50">
            <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center text-accent-foreground font-semibold">
              {profile ? getInitials(profile.full_name) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-sidebar-foreground truncate">
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {profile?.email || ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
