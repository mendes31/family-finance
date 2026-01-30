import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, FolderTree, Edit, Trash2 } from 'lucide-react';
import { useCategories, useDeleteCategory, Category } from '@/hooks/useCategories';
import { CategoryModal } from '@/components/modals/CategoryModal';
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
import { toast } from 'sonner';
import { getCategoryIcon } from '@/lib/categoryIcons';

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const handleEdit = (category: Category) => {
    // Só permite editar categorias que não são padrão
    if (category.is_default) {
      toast.error('Não é possível editar categorias padrão');
      return;
    }
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    if (category.is_default) {
      toast.error('Não é possível deletar categorias padrão');
      return;
    }
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      await deleteCategory.mutateAsync(categoryToDelete.id);
      toast.success('Categoria excluída com sucesso!');
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir categoria');
    }
  };

  const userCategories = categories.filter(c => !c.is_default);
  const defaultCategories = categories.filter(c => c.is_default);

  return (
    <MainLayout>
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-1">
            Categorias
          </h1>
          <p className="text-muted-foreground">
            Organize as categorias usadas nos seus lançamentos.
          </p>
        </div>
        <Button onClick={() => {
          setSelectedCategory(null);
          setIsModalOpen(true);
        }} variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Nova categoria
        </Button>
      </header>

      {/* Categorias do usuário */}
      {userCategories.length > 0 && (
        <section className="bg-card border border-border rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <FolderTree className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Suas categorias
            </h2>
          </div>

          <ul className="space-y-2">
            {userCategories.map((category) => {
              const CategoryIcon = getCategoryIcon(category.icon);

              return (
                <li
                  key={category.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {category.color && (
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    {CategoryIcon && (
                      <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{category.name}</span>
                  </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">
                    {category.type}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(category)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Categorias padrão */}
      <section className="bg-card border border-border rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <FolderTree className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Categorias padrão
          </h2>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando categorias...</p>
        ) : defaultCategories.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhuma categoria padrão encontrada.
          </p>
        ) : (
          <ul className="space-y-2">
            {defaultCategories.map((category) => {
              const CategoryIcon = getCategoryIcon(category.icon);

              return (
                <li
                  key={category.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    {category.color && (
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    {CategoryIcon && (
                      <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{category.name}</span>
                  </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">
                  {category.type}
                </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CategoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        category={selectedCategory}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}


