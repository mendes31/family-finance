/**
 * Cliente API para comunicação com o backend PHP
 */

const API_BASE = '/family_finance/api';

export interface ApiResponse<T = any> {
  user?: T;
  error?: string;
  message?: string;
}

/**
 * Faz uma requisição para a API
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}/${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Importante para cookies/sessão
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.error || errorMessage;
    } catch {
      // Se não conseguir parsear JSON, usar texto da resposta
      const text = await response.text().catch(() => '');
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Autenticação
 */
export const authApi = {
  signUp: async (email: string, password: string, fullName: string) => {
    return apiRequest<ApiResponse>('auth.php?action=signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, name: fullName }),
    });
  },

  signIn: async (email: string, password: string) => {
    return apiRequest<ApiResponse>('auth.php?action=signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signOut: async () => {
    return apiRequest<ApiResponse>('auth.php?action=signout', {
      method: 'POST',
    });
  },

  getSession: async () => {
    return apiRequest<ApiResponse>('auth.php?action=session', {
      method: 'GET',
    });
  },
};

/**
 * Família
 */
export const familyApi = {
  create: async (name: string) => {
    return apiRequest<{ id: string; name: string; message?: string }>('family.php?action=create', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  get: async () => {
    return apiRequest<{ family: any }>('family.php?action=get', {
      method: 'GET',
    });
  },

  getMembers: async (familyId: string) => {
    return apiRequest<{ members: any[] }>(`family.php?action=members&family_id=${familyId}`, {
      method: 'GET',
    });
  },

  inviteMember: async (data: {
    email: string;
    full_name?: string;
    role: 'user' | 'admin';
    invitation_type: 'pre_register' | 'full_register';
  }) => {
    return apiRequest<{ invitation: any; message?: string }>('family.php?action=invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getInvitations: async (familyId: string) => {
    return apiRequest<{ invitations: any[] }>(`family.php?action=invitations&family_id=${familyId}`, {
      method: 'GET',
    });
  },

  cancelInvitation: async (invitationId: string) => {
    return apiRequest<{ message?: string }>('family.php?action=cancel_invitation', {
      method: 'POST',
      body: JSON.stringify({ invitation_id: invitationId }),
    });
  },

  acceptInvitation: async (token: string, password?: string) => {
    return apiRequest<{ message?: string; user_id?: string }>('family.php?action=accept_invitation', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  checkInvitation: async (token: string) => {
    return apiRequest<{ email?: string; full_name?: string; invitation_type?: string; role?: string; error?: string }>(`family.php?action=check_invitation&token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });
  },

  resendInvitation: async (invitationId: string) => {
    return apiRequest<{ message?: string; email_sent?: boolean; email_error?: string }>('family.php?action=resend_invitation', {
      method: 'POST',
      body: JSON.stringify({ invitation_id: invitationId }),
    });
  },
};

/**
 * Configurações de E-mail
 */
export const emailApi = {
  get: async () => {
    return apiRequest<{ settings: any }>('email_settings.php?action=get', {
      method: 'GET',
    });
  },

  save: async (data: {
    smtp_host: string;
    smtp_user: string;
    smtp_password: string;
    smtp_port: number;
    smtp_encryption: 'none' | 'tls' | 'ssl';
    from_email: string;
    from_name: string;
  }) => {
    return apiRequest<{ message?: string; settings?: any }>('email_settings.php?action=save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  test: async (data: {
    smtp_host: string;
    smtp_user: string;
    smtp_password: string;
    smtp_port: number;
    smtp_encryption: 'none' | 'tls' | 'ssl';
    from_email: string;
    from_name: string;
  }) => {
    return apiRequest<{ message?: string }>('email_settings.php?action=test', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Perfil
 */
export const profileApi = {
  get: async () => {
    return apiRequest<{ profile: any }>('profile.php?action=get', {
      method: 'GET',
    });
  },

  update: async (updates: any) => {
    return apiRequest<{ profile: any }>('profile.php?action=update', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  },
};

/**
 * Role do Usuário
 */
export const userRoleApi = {
  get: async () => {
    return apiRequest<{ role: string | null }>('user_role.php', {
      method: 'GET',
    });
  },
};

/**
 * Transações
 */
export const transactionsApi = {
  list: async (filters?: { type?: string; status?: string; startDate?: string; endDate?: string; categoryId?: string; limit?: number; memberId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.memberId) params.append('memberId', filters.memberId);
    params.append('action', 'list');
    
    return apiRequest<{ transactions: any[] }>(`transactions.php?${params.toString()}`, {
      method: 'GET',
    });
  },

  create: async (data: any) => {
    return apiRequest<{ transaction: any }>('transactions.php?action=create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (data: any) => {
    return apiRequest<{ transaction: any }>('transactions.php?action=update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: string, status: string) => {
    return apiRequest<{ transaction: any }>('transactions.php?action=update', {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    });
  },

  delete: async (id: string, deleteAllOpen?: boolean) => {
    return apiRequest<{ message: string }>('transactions.php?action=delete', {
      method: 'POST',
      body: JSON.stringify({ id, delete_all_open: deleteAllOpen || false }),
    });
  },

  getSummary: async (startDate: string, endDate: string, memberId?: string) => {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (memberId) params.append('memberId', memberId);
    params.append('action', 'summary');
    return apiRequest<{ summary: { income: number; expense: number; investment: number } }>(`transactions.php?${params.toString()}`, {
      method: 'GET',
    });
  },

  getMonthlyTrends: async (startDate: string, endDate: string, memberId?: string) => {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (memberId) params.append('memberId', memberId);
    params.append('action', 'monthly_trends');
    return apiRequest<{ trends: any[] }>(`transactions.php?${params.toString()}`, {
      method: 'GET',
    });
  },

  getExpensesByCategory: async (startDate: string, endDate: string, memberId?: string) => {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (memberId) params.append('memberId', memberId);
    params.append('action', 'expenses_by_category');
    return apiRequest<{ expenses: any[] }>(`transactions.php?${params.toString()}`, {
      method: 'GET',
    });
  },
};

/**
 * Categorias
 */
export const categoriesApi = {
  list: async (type?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('action', 'list');
    
    return apiRequest<{ categories: any[] }>(`categories.php?${params.toString()}`, {
      method: 'GET',
    });
  },

  create: async (data: any) => {
    return apiRequest<{ category: any }>('categories.php?action=create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (data: any) => {
    return apiRequest<{ category: any }>('categories.php?action=update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`categories.php?action=delete&id=${id}`, {
      method: 'POST',
    });
  },
};

/**
 * Metas Financeiras
 */
export const goalsApi = {
  list: async (isCompleted?: boolean) => {
    const params = new URLSearchParams();
    if (isCompleted !== undefined) params.append('is_completed', isCompleted ? '1' : '0');
    params.append('action', 'list');
    
    return apiRequest<{ goals: any[] }>(`goals.php?${params.toString()}`, {
      method: 'GET',
    });
  },

  create: async (data: any) => {
    return apiRequest<{ goal: any }>('goals.php?action=create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (data: any) => {
    return apiRequest<{ goal: any }>('goals.php?action=update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`goals.php?action=delete&id=${id}`, {
      method: 'POST',
    });
  },
};

/**
 * Cartões de Crédito
 */
export const creditCardsApi = {
  list: async (isActive?: boolean, memberId?: string) => {
    const params = new URLSearchParams();
    if (isActive !== undefined) params.append('is_active', isActive ? '1' : '0');
    if (memberId) params.append('memberId', memberId);
    params.append('action', 'list');
    
    const response = await apiRequest<{ credit_cards?: any[]; error?: string }>(`credit_cards.php?${params.toString()}`, {
      method: 'GET',
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return { credit_cards: response.credit_cards || [] };
  },

  create: async (data: any) => {
    const response = await apiRequest<{ credit_card?: any; error?: string }>('credit_cards.php?action=create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (!response.credit_card) {
      throw new Error('Resposta inválida da API');
    }
    
    return { credit_card: response.credit_card };
  },

  update: async (data: any) => {
    const response = await apiRequest<{ credit_card?: any; error?: string }>('credit_cards.php?action=update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (!response.credit_card) {
      throw new Error('Resposta inválida da API');
    }
    
    return { credit_card: response.credit_card };
  },

  delete: async (id: string) => {
    const response = await apiRequest<{ message?: string; error?: string }>(`credit_cards.php?action=delete&id=${id}`, {
      method: 'POST',
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return { message: response.message || 'Cartão excluído com sucesso' };
  },

  getInvoice: async (cardId: string, month?: number, year?: number, memberId?: string) => {
    const params = new URLSearchParams();
    params.append('action', 'invoice');
    params.append('card_id', cardId);
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    if (memberId) params.append('memberId', memberId);
    
    const response = await apiRequest<{
      current_invoice?: { total: number; transaction_count: number; start_date: string; end_date: string };
      next_invoice?: { total: number; start_date: string; end_date: string };
      credit_limit?: number;
      available_balance?: number;
      total_open_amount?: number;
      used_percentage?: number;
      error?: string;
    }>(`credit_cards.php?${params.toString()}`, {
      method: 'GET',
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response;
  },
};

