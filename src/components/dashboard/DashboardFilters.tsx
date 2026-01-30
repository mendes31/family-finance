import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TransactionType } from '@/hooks/useTransactions';
import { Category } from '@/hooks/useCategories';
import { useCategories } from '@/hooks/useCategories';

export interface DashboardFilters {
  year: number;
  month?: number | 'all'; // 'all' para todos os meses
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  categoryId?: string;
}

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export function DashboardFilters({ filters, onFiltersChange }: DashboardFiltersProps) {
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const { data: categories = [] } = useCategories();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);
    const month = filters.month || 'all';
    updateDates(yearNum, month);
  };

  const handleMonthChange = (month: string) => {
    const monthValue = month === 'all' ? 'all' : parseInt(month);
    updateDates(filters.year, monthValue);
  };

  const updateDates = (year: number, month: number | 'all') => {
    let startDate: string;
    let endDate: string;

    if (month === 'all') {
      // Todos os meses do ano
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else {
      // Mês específico
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    }

    onFiltersChange({
      ...filters,
      year,
      month,
      startDate,
      endDate,
    });
  };

  const handleTypeChange = (type: string) => {
    if (type === 'all') {
      const { type: _, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      onFiltersChange({
        ...filters,
        type: type as TransactionType,
      });
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'all') {
      const { categoryId: _, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      onFiltersChange({
        ...filters,
        categoryId,
      });
    }
  };

  const clearFilters = () => {
    const year = currentYear;
    onFiltersChange({
      year,
      month: 'all',
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    });
  };

  const hasActiveFilters = filters.type || filters.categoryId;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Filtros:</span>
      </div>

      {/* Ano */}
      <div className="flex items-center gap-2">
        <Label htmlFor="year" className="text-sm text-muted-foreground whitespace-nowrap">
          Ano:
        </Label>
        <Select
          value={filters.year.toString()}
          onValueChange={handleYearChange}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mês */}
      <div className="flex items-center gap-2">
        <Label htmlFor="month" className="text-sm text-muted-foreground whitespace-nowrap">
          Mês:
        </Label>
        <Select
          value={filters.month === undefined || filters.month === 'all' ? 'all' : filters.month.toString()}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value.toString()}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Período personalizado */}
      <Popover open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[240px] justify-start text-left font-normal',
              !filters.startDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.startDate && filters.endDate ? (
              <>
                {format(new Date(filters.startDate), 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                {format(new Date(filters.endDate), 'dd/MM/yyyy', { locale: ptBR })}
              </>
            ) : (
              <span>Período personalizado</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div>
              <Label className="text-sm">Data inicial</Label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    onFiltersChange({
                      ...filters,
                      startDate: e.target.value,
                    });
                  }
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Data final</Label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    onFiltersChange({
                      ...filters,
                      endDate: e.target.value,
                    });
                  }
                }}
                className="mt-1"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Tipo de lançamento */}
      <div className="flex items-center gap-2">
        <Label htmlFor="type" className="text-sm text-muted-foreground whitespace-nowrap">
          Tipo:
        </Label>
        <Select
          value={filters.type || 'all'}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
            <SelectItem value="investment">Investimentos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Categoria */}
      <div className="flex items-center gap-2">
        <Label htmlFor="category" className="text-sm text-muted-foreground whitespace-nowrap">
          Categoria:
        </Label>
        <Select
          value={filters.categoryId || 'all'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Limpar filtros */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="gap-2"
        >
          <X className="w-4 h-4" />
          Limpar
        </Button>
      )}
    </div>
  );
}

