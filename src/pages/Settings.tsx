import { Link, useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Settings as SettingsIcon, Mail, User, MessageSquare } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import EmailSettings from './EmailSettings';
import WhatsAppSettings from './WhatsAppSettings';

export default function Settings() {
  const location = useLocation();
  const { data: profile, isLoading } = useProfile();
  
  // Verificar pathname (remover basename se presente)
  const pathname = location.pathname.replace('/family_finance', '') || location.pathname;
  const isEmailSettings = pathname === '/settings/email' || pathname.endsWith('/settings/email');
  const isWhatsAppSettings = pathname === '/settings/whatsapp' || pathname.endsWith('/settings/whatsapp');
  const isProfileSettings = pathname === '/settings' || pathname === '/settings/' || (pathname.startsWith('/settings') && !isEmailSettings && !isWhatsAppSettings);

  return (
    <MainLayout>
      {/* Header */}
      <header className="mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-1">
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e informações da conta.
          </p>
        </div>
      </header>

      {/* Submenu */}
      <div className="mb-6 flex gap-2 border-b border-border pb-0">
        <Link
          to="/settings"
          className={cn(
            "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
            isProfileSettings
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Perfil
          </div>
        </Link>
        <Link
          to="/settings/email"
          className={cn(
            "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
            isEmailSettings
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            E-mail
          </div>
        </Link>
        <Link
          to="/settings/whatsapp"
          className={cn(
            "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
            isWhatsAppSettings
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </div>
        </Link>
      </div>

      {/* Conteúdo baseado na rota */}
      {isEmailSettings ? (
        <EmailSettings />
      ) : isWhatsAppSettings ? (
        <WhatsAppSettings />
      ) : (
        <>

      {/* Perfil */}
      <section className="bg-card border border-border rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Informações do Perfil
          </h2>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando perfil...</p>
        ) : profile ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Nome completo
              </label>
              <p className="text-sm text-muted-foreground">{profile.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                E-mail
              </label>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
            {profile.phone_whatsapp && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  WhatsApp
                </label>
                <p className="text-sm text-muted-foreground">{profile.phone_whatsapp}</p>
              </div>
            )}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Edição de perfil em breve
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Não foi possível carregar as informações do perfil.
          </p>
        )}
      </section>

      {/* Outras configurações */}
      <section className="bg-card border border-border rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Outras Configurações
        </h2>
        <div className="text-center py-8">
          <SettingsIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Mais opções de configuração em breve
          </p>
        </div>
      </section>
        </>
      )}
    </MainLayout>
  );
}

