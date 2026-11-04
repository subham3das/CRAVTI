import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Loader } from '../components/Loader';
import { Badge } from '../components/Badge';
import {
  fetchCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  toggleCategoryStatusApi,
} from '../services/categoryService';
import { FiPlus, FiEdit2, FiTrash2, FiLayers } from 'react-icons/fi';
import toast from 'react-hot-toast';

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      categoryName: '',
      displayOrder: 0,
      isActive: true,
    },
  });

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetchCategoriesApi();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    reset({
      categoryName: '',
      displayOrder: categories.length ? (categories.length + 1) * 10 : 10,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    reset({
      categoryName: cat.categoryName,
      displayOrder: cat.displayOrder || 0,
      isActive: cat.isActive !== false,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingCategory) {
        await updateCategoryApi(editingCategory._id, data);
        toast.success(`Category "${data.categoryName}" updated.`);
      } else {
        await createCategoryApi(data);
        toast.success(`Category "${data.categoryName}" created.`);
      }
      setModalOpen(false);
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Action failed');
    }
  };

  const handleToggleStatus = async (cat) => {
    try {
      await toggleCategoryStatusApi(cat._id);
      toast.success(`Category "${cat.categoryName}" ${cat.isActive ? 'disabled' : 'activated'}.`);
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update status');
    }
  };

  const handleDeleteClick = (cat) => {
    setCategoryToDelete(cat);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCategoryApi(categoryToDelete._id);
      toast.success(`Category "${categoryToDelete.categoryName}" deleted.`);
      setDeleteConfirmOpen(false);
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Categories"
        description="Organize your dishes into sections like Starters, Main Course, Breads, Drinks, and Desserts."
        actions={
          <Button
            size="md"
            variant="primary"
            leftIcon={FiPlus}
            onClick={handleOpenAdd}
          >
            Add Category
          </Button>
        }
      />

      {loading ? (
        <Loader size="lg" message="Loading menu categories..." />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FiLayers}
          title="No categories created"
          description="Create categories such as Breakfast, Pizza, Biryani, or Beverages to organize dishes on customer QR menus."
          actionText="Create First Category"
          actionIcon={FiPlus}
          onAction={handleOpenAdd}
        />
      ) : (
        <Card padding="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Category Name
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Items Count
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Display Order
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {(Array.isArray(categories) ? categories : []).map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-100">
                          {cat.categoryName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{cat.categoryName}</p>
                          <p className="text-[11px] text-slate-400">ID: {cat._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="neutral" size="sm">
                        {cat.itemCount || 0} items
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">
                      {cat.displayOrder || 0}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(cat)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          cat.isActive
                            ? 'bg-green-50 text-[#22C55E] border-green-200 hover:bg-green-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            cat.isActive ? 'bg-[#22C55E]' : 'bg-slate-400'
                          }`}
                        />
                        {cat.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Edit Category"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Category"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Starters, Biryani, Mocktails"
            error={errors.categoryName?.message}
            {...register('categoryName', {
              required: 'Category name is required',
              maxLength: { value: 60, message: 'Max 60 characters allowed' },
            })}
          />

          <Input
            label="Display Order"
            type="number"
            placeholder="e.g. 10"
            helperText="Lower numbers appear first on the customer digital menu."
            {...register('displayOrder')}
          />

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-800">Category Active</p>
              <p className="text-xs text-slate-400">Disabled categories will be hidden from customer menus</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                {...register('isActive')}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16A34A]" />
            </label>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isSubmitting}
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.categoryName}"? Any menu items in this category must be deleted or moved first.`}
        confirmText="Delete"
        isDangerous
        isLoading={isDeleting}
      />
    </div>
  );
};
