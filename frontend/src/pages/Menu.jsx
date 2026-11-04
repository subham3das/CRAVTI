import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SearchBar } from '../components/SearchBar';
import { FoodTypeBadge } from '../components/FoodTypeBadge';
import { Badge } from '../components/Badge';
import { Loader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { MenuItemModal } from '../components/MenuItemModal';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/formatters';
import {
  fetchMenuItemsApi,
  fetchMenuStatsApi,
  createMenuItemApi,
  updateMenuItemApi,
  deleteMenuItemApi,
  duplicateMenuItemApi,
  toggleItemAvailabilityApi,
} from '../services/menuService';
import { fetchCategoriesApi } from '../services/categoryService';
import {
  FiPlus,
  FiEdit2,
  FiCopy,
  FiTrash2,
  FiBookOpen,
  FiLayers,
  FiStar,
  FiAlertCircle,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export const Menu = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    categoriesCount: 0,
    popularCount: 0,
    outOfStockCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [foodTypeFilter, setFoodTypeFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Menu Stats
  const loadStats = useCallback(async () => {
    try {
      const res = await fetchMenuStatsApi();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load menu stats:', err);
    }
  }, []);

  // Load Categories for dropdown filter & modal
  const loadCategories = useCallback(async () => {
    try {
      const res = await fetchCategoriesApi();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // Load Menu Items with filters
  const loadMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch,
        categoryId: categoryFilter,
        foodType: foodTypeFilter,
        availability: availabilityFilter,
        sort: sortOption,
        page: currentPage,
        limit: 10,
      };

      const res = await fetchMenuItemsApi(params);
      if (res.success && res.data) {
        setItems(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryFilter, foodTypeFilter, availabilityFilter, sortOption, currentPage]);

  useEffect(() => {
    loadCategories();
    loadStats();
  }, [loadCategories, loadStats]);

  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  // Handlers
  const handleOpenAdd = () => {
    if (categories.length === 0) {
      toast('Please create at least one category before adding dishes.', { icon: 'ℹ️' });
    }
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateMenuItemApi(editingItem._id, formData);
        toast.success(`Dish "${editingItem.itemName}" updated.`);
      } else {
        await createMenuItemApi(formData);
        toast.success('New menu item created.');
      }
      setModalOpen(false);
      loadMenuItems();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (item) => {
    try {
      await duplicateMenuItemApi(item._id);
      toast.success(`Duplicate of "${item.itemName}" added to menu.`);
      loadMenuItems();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to duplicate');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await toggleItemAvailabilityApi(item._id);
      const newStatus = item.availability === 'available' ? 'Out of Stock' : 'Available';
      toast.success(`"${item.itemName}" marked as ${newStatus}.`);
      loadMenuItems();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to toggle availability');
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMenuItemApi(itemToDelete._id);
      toast.success(`"${itemToDelete.itemName}" removed from menu.`);
      setDeleteConfirmOpen(false);
      loadMenuItems();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Management"
        description="Add, price, categorize, and control the availability of all restaurant dishes."
        actions={
          <Button
            size="md"
            variant="primary"
            leftIcon={FiPlus}
            onClick={handleOpenAdd}
          >
            Add Menu Item
          </Button>
        }
      />

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Items</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.totalItems}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
            <FiBookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Categories</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.categoriesCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FiLayers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Popular Dishes</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.popularCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <FiStar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Out of Stock</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.outOfStockCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <FiAlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <SearchBar
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search dishes by name..."
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Food Type Filter */}
          <div>
            <select
              value={foodTypeFilter}
              onChange={(e) => {
                setFoodTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Food Types</option>
              <option value="veg">Vegetarian (Veg)</option>
              <option value="non-veg">Non-Vegetarian</option>
              <option value="egg">Contains Egg</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div>
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Quick Availability Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium shrink-0">Availability:</span>
          {[
            { label: 'All Items', val: '' },
            { label: 'Available Only', val: 'available' },
            { label: 'Out of Stock Only', val: 'out_of_stock' },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                setAvailabilityFilter(tab.val);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                availabilityFilter === tab.val
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Loader size="lg" message="Loading menu items..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FiBookOpen}
          title="No menu items found"
          description={
            search || categoryFilter || foodTypeFilter || availabilityFilter
              ? 'No dishes matched your active filter criteria. Try resetting filters.'
              : 'Add your first dish to make it available for customers on table QR codes.'
          }
          actionText={!search && !categoryFilter ? 'Add First Dish' : undefined}
          actionIcon={FiPlus}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Data Table (hidden on mobile, visible on md+) */}
          <div className="hidden md:block">
            <Card padding="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Dish &amp; Type
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Category
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Original Price
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Discount
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Selling Price
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
                        Availability
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {items.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Dish with Thumbnail & Badges */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                              <ImageWithFallback
                                src={item?.image?.url}
                                alt={item?.itemName}
                                type="menu"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-1 left-1">
                                <FoodTypeBadge type={item.foodType} size="sm" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {item.itemName}
                                </p>
                                {item.popular && (
                                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                    ★ Popular
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                                {item.description || `${item.preparationTime || 15}m prep time`}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <Badge variant="neutral" size="sm">
                            {item.categoryId?.categoryName || 'Unassigned'}
                          </Badge>
                        </td>

                        {/* Original Price */}
                        <td className="px-6 py-4">
                          <span
                            className={`text-sm ${
                              item.discountType !== 'none'
                                ? 'line-through text-slate-400'
                                : 'font-medium text-slate-800'
                            }`}
                          >
                            {formatCurrency(item.price)}
                          </span>
                        </td>

                        {/* Discount */}
                        <td className="px-6 py-4">
                          {item.discountType === 'percentage' && (
                            <Badge variant="primary" size="sm">
                              {item.discountValue}% OFF
                            </Badge>
                          )}
                          {item.discountType === 'flat' && (
                            <Badge variant="primary" size="sm">
                              ₹{item.discountValue} OFF
                            </Badge>
                          )}
                          {item.discountType === 'none' && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Selling Price */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-[#16A34A]">
                            {formatCurrency(item.sellingPrice)}
                          </span>
                        </td>

                        {/* Availability Toggle */}
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(item)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                              item.availability === 'available'
                                ? 'bg-green-50 text-[#22C55E] border-green-200 hover:bg-green-100'
                                : 'bg-red-50 text-[#EF4444] border-red-200 hover:bg-red-100'
                            }`}
                            title="Click to toggle availability"
                          >
                            {item.availability === 'available' ? (
                              <>
                                <FiCheckCircle className="w-3.5 h-3.5" />
                                <span>Available</span>
                              </>
                            ) : (
                              <>
                                <FiXCircle className="w-3.5 h-3.5" />
                                <span>Out of Stock</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Edit item"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicate(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#16A34A] hover:bg-emerald-50 transition-colors"
                              title="Duplicate item"
                            >
                              <FiCopy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete item"
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
          </div>

          {/* Mobile Card Grid (visible on small screens < md) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {items.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <ImageWithFallback
                      src={item?.image?.url}
                      alt={item?.itemName}
                      type="menu"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1">
                      <FoodTypeBadge type={item.foodType} size="sm" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">
                        {item.itemName}
                      </h4>
                      {item.popular && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                          ★ Popular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.categoryId?.categoryName || 'Unassigned'} • {item.preparationTime || 15}m
                    </p>

                    {/* Pricing */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-bold text-[#16A34A]">
                        {formatCurrency(item.sellingPrice)}
                      </span>
                      {item.discountType !== 'none' && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(item.price)}
                        </span>
                      )}
                      {item.discountType === 'percentage' && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {item.discountValue}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Status and Quick Edit */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(item)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      item.availability === 'available'
                        ? 'bg-green-50 text-[#22C55E] border-green-200'
                        : 'bg-red-50 text-[#EF4444] border-red-200'
                    }`}
                  >
                    {item.availability === 'available' ? 'Available' : 'Out of Stock'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                      title="Duplicate"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100"
                      title="Edit"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(item)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Add / Edit Menu Item Modal */}
      <MenuItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        editingItem={editingItem}
        categories={categories}
        isLoading={isSubmitting}
      />

      {/* Delete Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remove Menu Item"
        message={`Are you sure you want to delete "${itemToDelete?.itemName}" from your restaurant menu?`}
        confirmText="Delete Item"
        isDangerous
        isLoading={isDeleting}
      />
    </div>
  );
};
