import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi } from '@/lib/api';

export interface WhatsAppSettings {
  id?: string;
  provider: 'evolution' | 'twilio' | 'meta';
  api_url: string;
  api_key: string;
  api_token?: string;
  instance_name: string;
  whatsapp_number: string;
  webhook_url?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useWhatsAppSettings() {
  return useQuery({
    queryKey: ['whatsapp-settings'],
    queryFn: async () => {
      const response = await whatsappApi.get();
      return response.settings as WhatsAppSettings | null;
    },
  });
}

export interface SaveWhatsAppSettingsInput {
  provider: 'evolution' | 'twilio' | 'meta';
  api_url: string;
  api_key: string;
  api_token?: string;
  instance_name: string;
  whatsapp_number: string;
  webhook_url?: string;
  is_active?: boolean;
}

export function useSaveWhatsAppSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveWhatsAppSettingsInput) => {
      const response = await whatsappApi.save(input);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-settings'] });
    },
  });
}

export interface TestWhatsAppSettingsInput extends SaveWhatsAppSettingsInput {
  test_number: string;
}

export function useTestWhatsAppSettings() {
  return useMutation({
    mutationFn: async (input: TestWhatsAppSettingsInput) => {
      const response = await whatsappApi.test(input);
      return response;
    },
  });
}

