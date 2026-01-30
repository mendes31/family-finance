import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Mail, X, RotateCw } from 'lucide-react';
import { useFamily, useFamilyMembers, useFamilyInvitations, useCancelInvitation, useResendInvitation } from '@/hooks/useFamily';
import { InviteMemberModal } from '@/components/modals/InviteMemberModal';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Family() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [invitationToCancel, setInvitationToCancel] = useState<string | null>(null);
  
  const { data: family, isLoading: isLoadingFamily } = useFamily();
  const { data: members = [], isLoading: isLoadingMembers } = useFamilyMembers();
  const { data: invitations = [], isLoading: isLoadingInvitations } = useFamilyInvitations();
  const cancelInvitation = useCancelInvitation();
  const resendInvitation = useResendInvitation();

  return (
    <MainLayout>
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-1">
            Família
          </h1>
          <p className="text-muted-foreground">
            Gerencie os membros da sua família financeira.
          </p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)} variant="outline" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Convidar membro
        </Button>
      </header>

      {/* Informações da Família */}
      {isLoadingFamily ? (
        <section className="bg-card border border-border rounded-2xl shadow-sm p-6 mb-6">
          <p className="text-muted-foreground text-sm">Carregando informações da família...</p>
        </section>
      ) : family ? (
        <section className="bg-card border border-border rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {family.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Criada em {new Date(family.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Membros */}
      <section className="bg-card border border-border rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Membros da família
        </h2>

        {isLoadingMembers ? (
          <p className="text-muted-foreground text-sm">Carregando membros...</p>
        ) : members.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum membro encontrado.
          </p>
        ) : (
          <ul className="space-y-3">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                  {(member.full_name || member.email || 'U')[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{member.full_name || 'Sem nome'}</p>
                  <p className="text-xs text-muted-foreground">{member.email || ''}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Entrou em {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Convites Pendentes */}
      {invitations.length > 0 && (
        <section className="bg-card border border-border rounded-2xl shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Convites Pendentes
          </h2>
          <ul className="space-y-3">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{invitation.full_name || invitation.email}</p>
                    <p className="text-xs text-muted-foreground">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Perfil: {invitation.role === 'admin' ? 'Administrador' : 'Usuário'} • 
                      Tipo: {invitation.invitation_type === 'full_register' ? 'Cadastro Completo' : 'Pré-cadastro'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Expira em {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        const result = await resendInvitation.mutateAsync(invitation.id);
                        if (result.email_sent) {
                          toast.success('Convite reenviado com sucesso!');
                        } else {
                          toast.warning('Convite atualizado, mas o e-mail não foi enviado', {
                            description: result.email_error || 'Verifique as configurações SMTP',
                          });
                        }
                      } catch (error: any) {
                        toast.error(error.message || 'Erro ao reenviar convite');
                      }
                    }}
                    className="h-8 w-8 p-0"
                    title="Reenviar convite"
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInvitationToCancel(invitation.id)}
                    className="h-8 w-8 p-0"
                    title="Cancelar convite"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Modal de Convite */}
      <InviteMemberModal open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen} />

      {/* Dialog de Confirmação de Cancelamento */}
      <AlertDialog open={!!invitationToCancel} onOpenChange={(open) => !open && setInvitationToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Convite?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este convite? O membro não poderá mais aceitá-lo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setInvitationToCancel(null)}>Não</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (invitationToCancel) {
                  try {
                    await cancelInvitation.mutateAsync(invitationToCancel);
                    toast.success('Convite cancelado com sucesso');
                    setInvitationToCancel(null);
                  } catch (error: any) {
                    toast.error(error.message || 'Erro ao cancelar convite');
                  }
                }
              }}
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

