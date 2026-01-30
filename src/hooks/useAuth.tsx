import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authApi } from '@/lib/api';

// Tipo de usuário para autenticação
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session] = useState<null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão no servidor
    authApi.getSession()
      .then((response) => {
        if (response.user) {
          setUser(response.user);
        }
      })
      .catch(() => {
        // Sessão inválida ou não existe
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const response = await authApi.signUp(email, password, fullName);
      
      if (response.user) {
        setUser(response.user);
        return { error: null };
      }
      
      return { error: new Error(response.error || 'Erro ao criar conta') };
    } catch (e) {
      const error = e as Error;
      return { error: error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.signIn(email, password);
      
      if (response.user) {
        setUser(response.user);
        return { error: null };
      }
      
      return { error: new Error(response.error || 'Erro ao fazer login') };
    } catch (e) {
      const error = e as Error;
      return { error: error };
    }
  };

  const signOut = async () => {
    try {
      await authApi.signOut();
    } catch (e) {
      // Ignorar erros no logout
      console.error('Erro ao fazer logout:', e);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
