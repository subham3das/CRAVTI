import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { FoodTypeBadge } from './FoodTypeBadge';
import { formatCurrency } from '../utils/formatters';
import { getImageUrl } from '../utils/image';
import { FiUploadCloud, FiX, FiClock, FiStar, FiThumbsUp, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';

export const MenuItemModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingItem,
  categories = [],
  isLoading = false,
}) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      itemName: '',
      categoryId: '',
      description: '',
      price: '',
      discountType: 'none',
      discountValue: 0,
      foodType: 'veg',
      availability: 'available',
      preparationTime: 15,
      popular: false,
      recommended: false,
      displayOrder: 0,
    },
  });

  // Watch fields for live dynamic price calculation
  const watchedPrice = watch('price');
  const watchedDiscountType = watch('discountType');
  const watchedDiscountValue = watch('discountValue');
  const watchedFoodType = watch('foodType');

  // Populate form on edit or reset on create
  useEffect(() => {
    if (editingItem) {
      reset({
        itemName: editingItem.itemName || '',
        categoryId: editingItem.categoryId?._id || editingItem.categoryId || '',
        description: editingItem.description || '',
        price: editingItem.price || '',
        discountType: editingItem.discountType || 'none',
        discountValue: editingItem.discountValue || 0,
        foodType: editingItem.foodType || 'veg',
        availability: editingItem.availability || 'available',
        preparationTime: editingItem.preparationTime || 15,
        popular: editingItem.popular || false,
        recommended: editingItem.recommended || false,
        displayOrder: editingItem.displayOrder || 0,
      });
      setImagePreview(getImageUrl(editingItem.image) || null);
      setImageFile(null);
    } else {
      reset({
        itemName: '',
        categoryId: categories[0]?._id || '',
        description: '',
        price: '',
        discountType: 'none',
        discountValue: 0,
        foodType: 'veg',
        availability: 'available',
        preparationTime: 15,
        popular: false,
        recommended: false,
        displayOrder: 0,
      });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [editingItem, categories, reset, isOpen]);

  // Live Selling Price Calculation
  const calculateLiveSellingPrice = () => {
    const p = parseFloat(watchedPrice) || 0;
    const dVal = parseFloat(watchedDiscountValue) || 0;

    if (p <= 0) return 0;

    if (watchedDiscountType === 'percentage') {
      const discount = (p * Math.min(100, Math.max(0, dVal))) / 100;
      return Math.max(0, Number((p - discount).toFixed(2)));
    }

    if (watchedDiscountType === 'flat') {
      return Math.max(0, Number((p - Math.min(p, Math.max(0, dVal))).toFixed(2)));
    }

    return Number(p.toFixed(2));
  };

  const calculatedSellingPrice = calculateLiveSellingPrice();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (JPEG, PNG, WEBP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size cannot exceed 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (data) => {
    const formData = new FormData();
    formData.append('itemName', data.itemName);
    formData.append('categoryId', data.categoryId);
    formData.append('description', data.description || '');
    formData.append('price', data.price);
    formData.append('discountType', data.discountType);
    formData.append('discountValue', data.discountValue || 0);
    formData.append('foodType', data.foodType);
    formData.append('availability', data.availability);
    formData.append('preparationTime', data.preparationTime || 15);
    formData.append('popular', data.popular ? 'true' : 'false');
    formData.append('recommended', data.recommended ? 'true' : 'false');
    formData.append('displayOrder', data.displayOrder || 0);

    if (imageFile) {
      formData.append('image', imageFile);
    }

    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
        {/* Basic Info: Name & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Item Name"
            placeholder="e.g. Butter Paneer Masala"
            error={errors.itemName?.message}
            {...register('itemName', {
              required: 'Item name is required',
              maxLength: { value: 100, message: 'Max 100 characters' },
            })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20"
              {...register('categoryId', { required: 'Please select a category' })}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.categoryName} {!cat.isActive ? '(Disabled)' : ''}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>
            )}
          </div>
        </div>

        {/* Food Type Selectable Chips */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Food Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'veg', label: 'Vegetarian' },
              { type: 'non-veg', label: 'Non-Vegetarian' },
              { type: 'egg', label: 'Contains Egg' },
            ].map((option) => {
              const isSelected = watchedFoodType === option.type;
              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => setValue('foodType', option.type)}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    isSelected
                      ? option.type === 'veg'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : option.type === 'non-veg'
                        ? 'border-red-600 bg-red-50 text-red-800 ring-2 ring-red-500/20'
                        : 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FoodTypeBadge type={option.type} size="md" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing & Dynamic Discount Calculator */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FiTag className="w-3.5 h-3.5 text-[#16A34A]" />
              Pricing &amp; Discount System
            </span>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Calculated Selling Price</span>
              <span className="text-base font-bold text-[#16A34A]">
                {formatCurrency(calculatedSellingPrice)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Original Price (₹)"
              type="number"
              step="0.01"
              placeholder="e.g. 199"
              error={errors.price?.message}
              {...register('price', {
                required: 'Price is required',
                min: { value: 0.01, message: 'Price must be > 0' },
              })}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Type
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20"
                {...register('discountType')}
              >
                <option value="none">No Discount</option>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>

            {watchedDiscountType !== 'none' ? (
              <Input
                label={watchedDiscountType === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
                type="number"
                step="0.01"
                placeholder={watchedDiscountType === 'percentage' ? 'e.g. 5' : 'e.g. 50'}
                {...register('discountValue', {
                  min: { value: 0, message: 'Cannot be negative' },
                  validate: (val) => {
                    if (watchedDiscountType === 'percentage' && val > 100) {
                      return 'Cannot exceed 100%';
                    }
                    if (watchedDiscountType === 'flat' && parseFloat(val) > parseFloat(watchedPrice)) {
                      return 'Discount cannot exceed price';
                    }
                    return true;
                  },
                })}
              />
            ) : (
              <div className="flex flex-col justify-end pb-2">
                <span className="text-xs text-slate-400 italic">No discount applied</span>
              </div>
            )}
          </div>
        </div>

        {/* Preparation Time & Availability */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Preparation Time (mins)"
            type="number"
            leftIcon={FiClock}
            placeholder="15"
            {...register('preparationTime', {
              min: { value: 1, message: 'Minimum 1 minute' },
            })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Availability
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20"
              {...register('availability')}
            >
              <option value="available">Available (In Stock)</option>
              <option value="out_of_stock">Out Of Stock</option>
            </select>
          </div>
        </div>

        {/* Flags: Popular & Recommended */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              className="w-4 h-4 rounded text-[#16A34A] focus:ring-emerald-500"
              {...register('popular')}
            />
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
              <FiStar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Mark as Popular Item</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              className="w-4 h-4 rounded text-[#16A34A] focus:ring-emerald-500"
              {...register('recommended')}
            />
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
              <FiThumbsUp className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Chef Recommended</span>
            </div>
          </label>
        </div>

        {/* Item Image Upload with Live Preview */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Dish Image (Cloudinary)
          </label>
          <div className="flex items-center gap-4">
            {imagePreview ? (
              <div className="relative w-24 h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                <img src={imagePreview} alt="Dish Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#16A34A] flex flex-col items-center justify-center text-slate-400 hover:text-[#16A34A] cursor-pointer transition-colors bg-slate-50 shrink-0">
                <FiUploadCloud className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Upload</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}

            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-medium text-slate-700">Square 1:1 image recommended (PNG, JPG, WEBP)</p>
              <p>Max file size: 5MB. Preview appears immediately before upload.</p>
              {imagePreview && (
                <label className="inline-block text-xs text-[#16A34A] font-medium hover:underline cursor-pointer">
                  Replace image
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            rows={2}
            placeholder="Ingredients, spice level, serving portion..."
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20"
            {...register('description', {
              maxLength: { value: 500, message: 'Max 500 characters' },
            })}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {editingItem ? 'Save Changes' : 'Add Item to Menu'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

