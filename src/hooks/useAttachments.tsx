import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface TransactionAttachment {
  id: string;
  transaction_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  uploaded_by: string;
  uploaded_by_email?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadAttachmentInput {
  transaction_id: string;
  file: File;
}

const attachmentsApi = {
  list: async (transactionId: string): Promise<TransactionAttachment[]> => {
    const response = await apiRequest(`/attachments.php?action=list&transaction_id=${transactionId}`);
    return response.attachments || [];
  },
  
  upload: async (input: UploadAttachmentInput): Promise<TransactionAttachment> => {
    const formData = new FormData();
    formData.append('action', 'upload');
    formData.append('transaction_id', input.transaction_id);
    formData.append('file', input.file);
    
    const API_BASE = '/family_finance/api';
    const response = await fetch(`${API_BASE}/attachments.php`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        const text = await response.text().catch(() => '');
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.attachment;
  },
  
  delete: async (attachmentId: string): Promise<void> => {
    await apiRequest<{ success?: boolean }>('/attachments.php?action=delete', {
      method: 'POST',
      body: JSON.stringify({ id: attachmentId }),
    });
  },
  
  getDownloadUrl: (attachmentId: string): string => {
    const API_BASE = '/family_finance/api';
    return `${API_BASE}/attachments.php?action=download&id=${attachmentId}`;
  },
};

export function useAttachments(transactionId: string | null) {
  return useQuery({
    queryKey: ['attachments', transactionId],
    queryFn: () => attachmentsApi.list(transactionId!),
    enabled: !!transactionId,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attachmentsApi.upload,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attachments', variables.transaction_id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attachmentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

