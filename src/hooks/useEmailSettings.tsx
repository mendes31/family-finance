import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailApi } from '@/lib/api';

export interface EmailSettings {
  id?: string;
  smtp_host: string;
  smtp_user: string;
  smtp_port: number;
  smtp_encryption: 'none' | 'tls' | 'ssl';
  from_email: string;
  from_name: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useEmailSettings() {
  return useQuery({
    queryKey: ['email-settings'],
    queryFn: async () => {
      const response = await emailApi.get();
      return response.settings as EmailSettings | null;
    },
  });
}

export interface SaveEmailSettingsInput {
  smtp_host: string;
  smtp_user: string;
  smtp_password: string;
  smtp_port: number;
  smtp_encryption: 'none' | 'tls' | 'ssl';
  from_email: string;
  from_name: string;
}

export function useSaveEmailSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveEmailSettingsInput) => {
      const response = await emailApi.save(input);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-settings'] });
    },
  });
}

export function useTestEmailSettings() {
  return useMutation({
    mutationFn: async (input: SaveEmailSettingsInput) => {
      const response = await emailApi.test(input);
      return response;
    },
  });
}




