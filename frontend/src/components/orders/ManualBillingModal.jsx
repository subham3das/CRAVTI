import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiPrinter,
  FiCheck,
  FiAlertCircle,
  FiUser,
  FiPhone,
  FiTag,
  FiPercent,
  FiDollarSign,
  FiSend,
} from 'react-icons/fi';
import { MdOutlineTableRestaurant, MdDirectionsWalk } from 'react-icons/md';
import { fetchMenuItemsApi } from '../../services/menuService';
import { fetchCategoriesApi } from '../../services/categoryService';
import { fetchTablesApi } from '../../services/tableService';
import { fetchSettingsApi } from '../../services/settingsService';
import {
  createManualOrderApi,
  updateManualOrderApi,
  markManualOrderPaidApi,
  printManualOrderReceiptApi,
} from '../../services/orderService';
import { ImageWithFallback } from '../ImageWithFallback';
import { CustomerVegBadge } from '../customer/CustomerVegBadge';
import { formatCurrency, safeNumber } from '../../utils/formatters';
import { safeString, safeTrim, safeLower } from '../../utils/string';
import toast from 'react-hot-toast';

export const ManualBillingModal = ({
  isOpen,
  onClose,
  onSuccess,
  existingOrder = null,
  onOpenReceipt,
}) => {
  // Data State
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [foodTypeFilter, setFoodTypeFilter] = useState('all'); // all, veg, non-veg

  // Billing Form State
  const [billType, setBillType] = useState('walk_in'); // 'walk_in' | 'table'
  const [selectedTableId, setSelectedTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sendToKitchen, setSendToKitchen] = useState(false);
  const [cartItems, setCartItems] = useState([]); // [{ itemId, itemName, price, sellingPrice, quantity, notes, foodType, image }]

  // Discount State
  const [discountType, setDiscountType] = useState('none'); // 'none' | 'flat' | 'percentage'
  const [discountValue, setDiscountValue] = useState(0);

  // Packaging Charge State
  const [packagingCharge, setPackagingCharge] = useState(0);

  // Payment Mode
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'upi' | 'card' | 'split'
  const [splitCash, setSplitCash] = useState(0);
  const [splitUpi, setSplitUpi] = useState(0);
  const [splitCard, setSplitCard] = useState(0);

  // Bill Notes
  const [billNotes, setBillNotes] = useState('');

  // Track if current bill was created in this session
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState(null);

  // 1. Initial Load of Menu, Categories, Tables, and Settings
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [catRes, menuRes, tablesRes, setRes] = await Promise.all([
          fetchCategoriesApi().catch(() => ({ success: false, data: [] })),
          fetchMenuItemsApi({ limit: 1000 }).catch(() => ({ success: false, data: { items: [] } })),
          fetchTablesApi({ limit: 200 }).catch(() => ({ success: false, tables: [] })),
          fetchSettingsApi().catch(() => ({ success: false, data: null })),
        ]);

        if (isMounted) {
          if (catRes.success && catRes.data) {
            setCategories(Array.isArray(catRes.data) ? catRes.data : []);
          }
          if (menuRes.success && menuRes.data?.items) {
            setMenuItems(menuRes.data.items);
          }
          if (tablesRes.success && tablesRes.tables) {
            setTables(tablesRes.tables);
          }
          if (setRes.success && setRes.data) {
            setSettings(setRes.data);
            if (setRes.data.packagingCharge) {
              setPackagingCharge(setRes.data.packagingCharge);
            }
          }
        }
      } catch (err) {
        console.error('Error loading manual billing prerequisites:', err);
        toast.error('Failed to load menu items or tables');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // 2. Populate Existing Order if editing
  useEffect(() => {
    if (existingOrder && isOpen) {
      setCreatedOrderId(existingOrder._id);
      setCreatedOrderNumber(existingOrder.orderNumber);
      setBillType(existingOrder.billType || (existingOrder.tableId ? 'table' : 'walk_in'));
      setSelectedTableId(existingOrder.tableId || '');
      setCustomerName(existingOrder.customerName || '');
      setCustomerPhone(existingOrder.customerPhone || '');
      setSendToKitchen(Boolean(existingOrder.sendToKitchen));
      setBillNotes(existingOrder.notes || '');

      if (existingOrder.billDiscount) {
        setDiscountType(existingOrder.billDiscount.type || 'none');
        setDiscountValue(existingOrder.billDiscount.value || 0);
      }

      setPackagingCharge(existingOrder.packagingCharge || 0);
      setPaymentMethod(existingOrder.paymentMethod || 'cash');

      if (Array.isArray(existingOrder.items)) {
        setCartItems(
          existingOrder.items.map((i) => ({
            itemId: i.itemId || i.menuItemId || i._id,
            menuItemId: i.menuItemId || i.itemId || i._id,
            itemName: i.itemName || i.name,
            price: Number(i.price) || 0,
            sellingPrice: Number(i.sellingPrice) || Number(i.price) || 0,
            quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
            notes: i.specialInstructions || i.notes || '',
            foodType: i.foodType || 'veg',
            image: i.image?.url || i.image || '',
          }))
        );
      }
    } else if (isOpen) {
      // Reset form for fresh manual bill
      setCreatedOrderId(null);
      setCreatedOrderNumber(null);
      setBillType('walk_in');
      setSelectedTableId('');
      setCustomerName('');
      setCustomerPhone('');
      setSendToKitchen(false);
      setCartItems([]);
      setDiscountType('none');
      setDiscountValue(0);
      setPaymentMethod('cash');
      setSplitCash(0);
      setSplitUpi(0);
      setSplitCard(0);
      setBillNotes('');
    }
  }, [existingOrder, isOpen]);

  // 3. Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    let items = Array.isArray(menuItems) ? menuItems : [];

    // Filter by Category
    if (activeCategory !== 'ALL') {
      items = items.filter((item) => {
        const catId = item.categoryId?._id || item.categoryId;
        return catId === activeCategory;
      });
    }

    // Filter by Food Type (Veg / Non-Veg)
    if (foodTypeFilter !== 'all') {
      const ft = safeLower(foodTypeFilter);
      items = items.filter((item) => safeLower(item.foodType) === ft);
    }

    // Filter by Search Query
    const q = safeLower(searchQuery);
    if (q) {
      items = items.filter(
        (item) =>
          safeLower(item.itemName).includes(q) ||
          safeLower(item.description).includes(q)
      );
    }

    return items;
  }, [menuItems, activeCategory, foodTypeFilter, searchQuery]);

  // 4. Cart Modifiers
  const handleAddItem = (item) => {
    const existingIndex = cartItems.findIndex(
      (c) => (c.itemId || c.menuItemId) === (item._id || item.itemId)
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          itemId: item._id,
          menuItemId: item._id,
          itemName: item.itemName,
          price: Number(item.price) || 0,
          sellingPrice: Number(item.sellingPrice) || Number(item.price) || 0,
          quantity: 1,
          notes: '',
          foodType: item.foodType || 'veg',
          image: item.image?.url || item.image || '',
        },
      ]);
    }
  };

  const handleUpdateQuantity = (index, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...cartItems];
    updated[index].quantity = qty;
    setCartItems(updated);
  };

  const handleUpdateItemNotes = (index, notes) => {
    const updated = [...cartItems];
    updated[index].notes = notes;
    setCartItems(updated);
  };

  const handleRemoveItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const getItemQuantityInCart = (itemId) => {
    const match = cartItems.find((c) => (c.itemId || c.menuItemId) === itemId);
    return match ? match.quantity : 0;
  };

  // 5. Financial Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    let itemDiscountsTotal = 0;

    cartItems.forEach((item) => {
      const original = item.price || item.sellingPrice || 0;
      const selling = item.sellingPrice || item.price || 0;
      const discount = Math.max(0, (original - selling) * item.quantity);

      subtotal += original * item.quantity;
      itemDiscountsTotal += discount;
    });

    // Bill discount
    let billDiscountAmount = 0;
    const dVal = Number(discountValue) || 0;
    if (discountType === 'percentage') {
      billDiscountAmount = (subtotal * Math.min(100, Math.max(0, dVal))) / 100;
    } else if (discountType === 'flat') {
      billDiscountAmount = Math.min(subtotal, Math.max(0, dVal));
    }

    const totalDiscount = Math.round((itemDiscountsTotal + billDiscountAmount) * 100) / 100;
    const taxableAmount = Math.max(0, subtotal - totalDiscount);

    // GST
    const isGstEnabled = settings?.gstEnabled !== false;
    const gstRate = isGstEnabled ? Number(settings?.gstPercentage || 5) : 0;
    const gstAmount = Math.round(((taxableAmount * gstRate) / 100) * 100) / 100;

    // Service Charge
    const isServiceEnabled = Boolean(settings?.serviceChargeEnabled);
    const serviceRate = isServiceEnabled ? Number(settings?.serviceChargePercentage || 0) : 0;
    const serviceChargeAmount = Math.round(((taxableAmount * serviceRate) / 100) * 100) / 100;

    // Packaging Charge
    const pkgAmount = Number(packagingCharge) || 0;

    const grandTotal = Math.round(
      (taxableAmount + gstAmount + serviceChargeAmount + pkgAmount) * 100
    ) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      itemDiscounts: Math.round(itemDiscountsTotal * 100) / 100,
      billDiscount: Math.round(billDiscountAmount * 100) / 100,
      totalDiscount,
      taxableAmount,
      gstRate,
      gstAmount,
      serviceRate,
      serviceChargeAmount,
      packagingCharge: pkgAmount,
      grandTotal,
    };
  }, [cartItems, discountType, discountValue, packagingCharge, settings]);

  // Split payment remaining balance check
  const splitTotal = Number(splitCash || 0) + Number(splitUpi || 0) + Number(splitCard || 0);
  const splitRemaining = Math.round((calculations.grandTotal - splitTotal) * 100) / 100;

  // 6. Action Handlers (Save Draft, Generate Bill, Mark Paid)
  const handleSubmitBill = async (action) => {
    if (cartItems.length === 0) {
      toast.error('Please add at least one item to the bill');
      return;
    }

    if (billType === 'table' && !selectedTableId) {
      toast.error('Please select an active table for Table Order');
      return;
    }

    if (action === 'mark_paid' && paymentMethod === 'split') {
      if (Math.abs(splitRemaining) > 0.05) {
        toast.error(`Split amounts must match Grand Total. Remaining: ${formatCurrency(splitRemaining)}`);
        return;
      }
    }

    const payload = {
      action,
      billType,
      tableId: billType === 'table' ? selectedTableId : null,
      customerName: safeTrim(customerName),
      customerPhone: safeTrim(customerPhone),
      sendToKitchen,
      notes: safeTrim(billNotes),
      items: cartItems.map((c) => ({
        itemId: c.itemId || c.menuItemId,
        menuItemId: c.menuItemId || c.itemId,
        itemName: c.itemName,
        originalPrice: c.price,
        sellingPrice: c.sellingPrice,
        quantity: c.quantity,
        notes: c.notes || '',
        foodType: c.foodType,
        image: c.image,
      })),
      billDiscount: {
        type: discountType,
        value: Number(discountValue) || 0,
      },
      packagingCharge: Number(packagingCharge) || 0,
      paymentMethod: action === 'mark_paid' ? paymentMethod : 'none',
      splitPayments:
        action === 'mark_paid' && paymentMethod === 'split'
          ? [
              { method: 'cash', amount: Number(splitCash) || 0 },
              { method: 'upi', amount: Number(splitUpi) || 0 },
              { method: 'card', amount: Number(splitCard) || 0 },
            ].filter((s) => s.amount > 0)
          : [],
    };

    try {
      setSubmitting(true);
      let res;
      const targetId = createdOrderId || existingOrder?._id;

      if (targetId) {
        // Update existing draft / bill
        res = await updateManualOrderApi(targetId, payload);
      } else {
        // Create new bill
        res = await createManualOrderApi(payload);
      }

      if (res.success && res.order) {
        setCreatedOrderId(res.order._id);
        setCreatedOrderNumber(res.order.orderNumber);

        if (action === 'save_draft') {
          toast.success(`Draft saved (#${res.order.orderNumber})`);
          onSuccess && onSuccess(res.order);
        } else if (action === 'generate') {
          toast.success(`Bill generated (#${res.order.orderNumber})`);
          onSuccess && onSuccess(res.order);
        } else if (action === 'mark_paid') {
          toast.success(`Bill #${res.order.orderNumber} marked as PAID!`);
          onSuccess && onSuccess(res.order);
          // Auto-prompt thermal receipt
          handlePrintReceipt(res.order._id);
          onClose();
        }
      } else {
        toast.error(res.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Failed to submit manual order:', err);
      toast.error(err.response?.data?.message || err.message || 'Error processing bill');
    } finally {
      setSubmitting(false);
    }
  };

  // 7. Print Receipt
  const handlePrintReceipt = async (orderIdToPrint) => {
    const ordId = orderIdToPrint || createdOrderId || existingOrder?._id;
    if (!ordId) {
      toast.error('Please save or generate the bill first before printing receipt');
      return;
    }
    try {
      const res = await printManualOrderReceiptApi(ordId);
      if (res.success && res.receipt) {
        if (onOpenReceipt) {
          onOpenReceipt(res.receipt);
        } else {
          toast.success('Receipt ready for printing');
        }
      } else {
        toast.error(res.message || 'Receipt snapshot not ready');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching receipt');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Desktop-First Full Billing Console Dialog */}
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 10 }}
          className="relative bg-white w-full max-w-[1400px] h-[95vh] rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          {/* Top Bar */}
          <header className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
              <div>
                <h2 className="text-base font-black tracking-wide flex items-center gap-2">
                  <span>CRAVITI POS BILLING</span>
                  {createdOrderNumber && (
                    <span className="text-xs font-mono font-bold bg-[#16A34A] px-2 py-0.5 rounded text-white">
                      #{createdOrderNumber}
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-slate-400">
                  Fast Manual Billing & Table Settlements (Petpooja Style)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(createdOrderId || existingOrder?._id) && (
                <button
                  type="button"
                  onClick={() => handlePrintReceipt()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <FiPrinter className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Main 2-Column Split Area */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* ======================================================== */}
            {/* LEFT COLUMN: Menu Search, Categories & Interactive Cards */}
            {/* ======================================================== */}
            <div className="w-full lg:w-3/5 xl:w-2/3 flex flex-col border-r border-slate-200 overflow-hidden bg-slate-50/50">
              {/* Search & Food Type Filter Bar */}
              <div className="p-4 bg-white border-b border-slate-200/80 space-y-3">
                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search menu items (e.g. Paneer, Pizza, Burger, Cold Drink)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-10 pr-9 py-2.5 rounded-xl bg-slate-100/90 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/40 focus:bg-white transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        <FiX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Veg / Non-Veg Quick Switch */}
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
                    <button
                      type="button"
                      onClick={() => setFoodTypeFilter('all')}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        foodTypeFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFoodTypeFilter('veg')}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                        foodTypeFilter === 'veg'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-300" /> Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setFoodTypeFilter('non-veg')}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                        foodTypeFilter === 'non-veg'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-300" /> Non-Veg
                    </button>
                  </div>
                </div>

                {/* Category Horizontal Scroll Chips */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none no-scrollbar pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('ALL')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                      activeCategory === 'ALL'
                        ? 'bg-[#16A34A] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Items ({menuItems.length})
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => setActiveCategory(cat._id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                        activeCategory === cat._id
                          ? 'bg-[#16A34A] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.categoryName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-xs font-semibold">
                    Loading live restaurant menu...
                  </div>
                ) : filteredMenuItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <p className="text-slate-500 font-bold text-sm">No items found</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Try clearing search or selecting a different category.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredMenuItems.map((item) => {
                      const qty = getItemQuantityInCart(item._id);
                      const isOutOfStock = item.availability === 'out_of_stock';
                      const hasDiscount =
                        item.discountType &&
                        item.discountType !== 'none' &&
                        safeNumber(item.discountValue) > 0;

                      return (
                        <div
                          key={item._id}
                          className={`bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-[#16A34A]/50 transition-all flex flex-col justify-between select-none ${
                            isOutOfStock ? 'opacity-50 grayscale' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden relative bg-slate-100 shrink-0 border border-slate-100">
                              <ImageWithFallback
                                src={typeof item.image === 'string' ? item.image : (item.image?.url || '')}
                                alt={safeString(item.itemName)}
                                type="menu"
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <CustomerVegBadge type={item.foodType} />
                                <span className="text-[10px] font-semibold text-slate-400 uppercase truncate">
                                  {item.categoryId?.categoryName || 'Item'}
                                </span>
                              </div>

                              <h4
                                className="font-extrabold text-xs text-slate-900 leading-snug line-clamp-2 mt-0.5"
                                title={item.itemName}
                              >
                                {item.itemName}
                              </h4>

                              <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="font-extrabold text-xs text-slate-900">
                                  {formatCurrency(item.sellingPrice || item.price || 0)}
                                </span>
                                {hasDiscount && (
                                  <span className="text-[10px] text-slate-400 line-through">
                                    {formatCurrency(item.price || 0)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Add / Stepper Row */}
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                            {isOutOfStock ? (
                              <span className="text-[10px] font-bold text-rose-500 uppercase">
                                Sold Out
                              </span>
                            ) : qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => handleAddItem(item)}
                                className="w-full py-1.5 bg-emerald-50 hover:bg-[#16A34A] text-[#16A34A] hover:text-white border border-[#16A34A]/30 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <FiPlus className="w-3.5 h-3.5" /> ADD
                              </button>
                            ) : (
                              <div className="w-full flex items-center justify-between bg-[#16A34A] text-white rounded-lg px-2 py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const matchIdx = cartItems.findIndex(
                                      (c) => (c.itemId || c.menuItemId) === item._id
                                    );
                                    if (matchIdx > -1) {
                                      handleUpdateQuantity(matchIdx, qty - 1);
                                    }
                                  }}
                                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-emerald-700 transition-colors"
                                >
                                  <FiMinus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black px-2">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleAddItem(item)}
                                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-emerald-700 transition-colors"
                                >
                                  <FiPlus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* RIGHT COLUMN: POS Billing Console, Cart, Totals & Pay */}
            {/* ======================================================== */}
            <div className="w-full lg:w-2/5 xl:w-1/3 flex flex-col bg-white overflow-hidden">
              {/* Bill Details Header: Walk-in vs Table & Customer Info */}
              <div className="p-4 border-b border-slate-200/90 space-y-3 bg-slate-50/70">
                {/* Walk-in vs Assign Table Toggle */}
                <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setBillType('walk_in');
                      setSelectedTableId('');
                    }}
                    className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      billType === 'walk_in'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MdDirectionsWalk className="w-4 h-4 text-emerald-600" />
                    <span>Walk-In Customer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillType('table')}
                    className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      billType === 'table'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MdOutlineTableRestaurant className="w-4 h-4 text-[#16A34A]" />
                    <span>Assign Table</span>
                  </button>
                </div>

                {/* Table Picker if Table mode */}
                {billType === 'table' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Select Table <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/40 font-semibold text-slate-800"
                    >
                      <option value="">-- Choose Dining Table --</option>
                      {tables.map((t) => (
                        <option key={t._id} value={t._id}>
                          Table {t.tableNumber} {t.capacity ? `(${t.capacity} Seater)` : ''} • Floor {t.floor || '1'} {t.status === 'occupied' ? '[Occupied]' : '[Available]'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Customer Details & Kitchen Toggle */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <input
                      type="text"
                      placeholder="Customer Name (Optional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Phone (Optional)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
                    />
                  </div>
                </div>

                {/* Kitchen Order Ticket (KOT) Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FiSend className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Send to Kitchen (KOT)</span>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendToKitchen}
                      onChange={(e) => setSendToKitchen(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#16A34A]"></div>
                  </label>
                </div>
              </div>

              {/* Itemized Cart List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Billed Items ({cartItems.reduce((acc, c) => acc + c.quantity, 0)})
                  </span>
                  {cartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCartItems([])}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {cartItems.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <p className="text-xs font-bold text-slate-500">Cart is empty</p>
                    <p className="text-[11px] max-w-xs mx-auto text-slate-400">
                      Tap items on the left to add them to this manual bill.
                    </p>
                  </div>
                ) : (
                  cartItems.map((item, idx) => {
                    const lineTotal = (item.sellingPrice || item.price) * item.quantity;
                    return (
                      <div
                        key={idx}
                        className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/80 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <CustomerVegBadge type={item.foodType} />
                            <span className="font-extrabold text-xs text-slate-900 truncate">
                              {item.itemName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Quantity Controls with direct input */}
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                              >
                                <FiMinus className="w-2.5 h-2.5" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                max="99"
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(idx, e.target.value)}
                                className="w-8 text-center text-xs font-black bg-transparent focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                              >
                                <FiPlus className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            <span className="text-xs font-black text-slate-900 w-16 text-right">
                              {formatCurrency(lineTotal)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-500 p-1"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Item Notes input (e.g. Less spicy, extra cheese) */}
                        <input
                          type="text"
                          placeholder="Item notes (e.g. Less spicy, no onion)..."
                          value={item.notes}
                          onChange={(e) => handleUpdateItemNotes(idx, e.target.value)}
                          className="w-full text-[11px] px-2.5 py-1 rounded-md bg-white border border-slate-200/90 text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Financial Breakdown & Discounts */}
              <div className="p-4 border-t border-slate-200 space-y-2.5 bg-slate-50/70 shrink-0 text-xs">
                {/* Discount Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 font-semibold flex items-center gap-1">
                    <FiTag className="w-3.5 h-3.5 text-amber-600" /> Bill Discount:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="text-[11px] px-2 py-1 rounded bg-white border border-slate-200 font-bold"
                    >
                      <option value="none">None</option>
                      <option value="flat">Flat ₹</option>
                      <option value="percentage">% Percent</option>
                    </select>
                    {discountType !== 'none' && (
                      <input
                        type="number"
                        min="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                        placeholder="Value"
                        className="w-16 text-xs px-2 py-1 rounded bg-white border border-slate-200 font-bold text-right"
                      />
                    )}
                  </div>
                </div>

                {/* Subtotals & Taxes */}
                <div className="space-y-1 pt-1 border-t border-slate-200/80 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold">{formatCurrency(calculations.subtotal)}</span>
                  </div>

                  {calculations.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Total Discount:</span>
                      <span>-{formatCurrency(calculations.totalDiscount)}</span>
                    </div>
                  )}

                  {calculations.gstAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>GST ({calculations.gstRate}%):</span>
                      <span className="font-bold">{formatCurrency(calculations.gstAmount)}</span>
                    </div>
                  )}

                  {calculations.serviceChargeAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Service Charge ({calculations.serviceRate}%):</span>
                      <span className="font-bold">
                        {formatCurrency(calculations.serviceChargeAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm font-black pt-1.5 border-t border-slate-300 text-slate-900">
                    <span>GRAND TOTAL:</span>
                    <span className="text-base text-[#16A34A]">
                      {formatCurrency(calculations.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Payment Mode Selector */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                    Payment Mode
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['cash', 'upi', 'card', 'split'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                          paymentMethod === m
                            ? 'bg-[#16A34A] text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {/* Split Payment inputs if Split selected */}
                  {paymentMethod === 'split' && (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block">Cash (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={splitCash}
                            onChange={(e) => setSplitCash(Number(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 border border-slate-200 rounded font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block">UPI (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={splitUpi}
                            onChange={(e) => setSplitUpi(Number(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 border border-slate-200 rounded font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block">Card (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={splitCard}
                            onChange={(e) => setSplitCard(Number(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 border border-slate-200 rounded font-bold"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-[11px] pt-1">
                        <span className="text-slate-500">Remaining to allocate:</span>
                        <span
                          className={`font-black ${
                            Math.abs(splitRemaining) < 0.05 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {formatCurrency(splitRemaining)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    type="button"
                    disabled={submitting || cartItems.length === 0}
                    onClick={() => handleSubmitBill('save_draft')}
                    className="py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Save Draft
                  </button>

                  <button
                    type="button"
                    disabled={submitting || cartItems.length === 0}
                    onClick={() => handleSubmitBill('generate')}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Generate Bill
                  </button>

                  <button
                    type="button"
                    disabled={submitting || cartItems.length === 0}
                    onClick={() => handleSubmitBill('mark_paid')}
                    className="py-2.5 px-3 rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Mark Paid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ManualBillingModal;

