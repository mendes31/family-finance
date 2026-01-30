import type { LucideIcon } from 'lucide-react';
import {
  LineChart,
  UtensilsCrossed,
  ShoppingBag,
  Receipt,
  Bitcoin,
  GraduationCap,
  Laptop,
  PieChart,
  TrendingUp,
  Gamepad2,
  Home,
  Plus,
  Lock,
  Heart,
  Briefcase,
  Car,
} from 'lucide-react';

/**
 * Mapa de nomes de ícones (armazenados no banco) para componentes Lucide.
 * 
 * Os valores em `categories.icon` devem corresponder a estas chaves.
 * Ex.: 'ShoppingBag', 'UtensilsCrossed', etc.
 */
export const categoryIconMap: Record<string, LucideIcon> = {
  LineChart,
  UtensilsCrossed,
  ShoppingBag,
  Receipt,
  Bitcoin,
  GraduationCap,
  Laptop,
  PieChart,
  TrendingUp,
  Gamepad2,
  Home,
  Plus,
  Lock,
  Heart,
  Briefcase,
  Car,
};

/**
 * Retorna o componente de ícone correspondente ao nome salvo na categoria.
 * Se não encontrar, retorna null (sem quebrar o layout).
 */
export function getCategoryIcon(iconName?: string | null): LucideIcon | null {
  if (!iconName) return null;
  return categoryIconMap[iconName] || null;
}



