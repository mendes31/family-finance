import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi } from '@/lib/api';
import { useAuth } from './useAuth';

export interface Family {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  joined_at: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

export function useFamily() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['family', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const response = await familyApi.get();
      return response.family as Family | null;
    },
    enabled: !!user,
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const response = await familyApi.create(name);
      return { id: response.id, name: response.name };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
    },
  });
}

export function useFamilyMembers() {
  const { data: family } = useFamily();

  return useQuery({
    queryKey: ['family-members', family?.id],
    queryFn: async () => {
      if (!family) return [];
      
      const response = await familyApi.getMembers(family.id);
      return response.members as FamilyMember[];
    },
    enabled: !!family,
  });
}

export interface InviteMemberInput {
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  invitation_type: 'pre_register' | 'full_register';
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: async (input: InviteMemberInput) => {
      if (!family) throw new Error('Você não pertence a uma família');

      const response = await familyApi.inviteMember(input);
      // Retornar resposta completa para ter acesso a email_sent e email_error
      return {
        invitation: response.invitation,
        email_sent: response.email_sent,
        email_error: response.email_error,
        message: response.message,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
    },
  });
}

export interface FamilyInvitation {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  invitation_type: 'pre_register' | 'full_register';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
}

export function useFamilyInvitations() {
  const { data: family } = useFamily();

  return useQuery({
    queryKey: ['family-invitations', family?.id],
    queryFn: async () => {
      if (!family) return [];
      
      const response = await familyApi.getInvitations(family.id);
      return response.invitations as FamilyInvitation[];
    },
    enabled: !!family,
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      await familyApi.cancelInvitation(invitationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-invitations'] });
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await familyApi.resendInvitation(invitationId);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-invitations'] });
    },
  });
}
