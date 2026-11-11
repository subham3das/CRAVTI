import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiSearch,
  FiPrinter,
  FiTag,
  FiSend,
} from 'react-icons/fi';
import {
  MdOutlineTableRestaurant,
  MdDirectionsWalk,
  MdLocalFireDepartment,
} from 'react-icons/md';
import { fetchMenuItemsApi } from '../../services/menuService';
import { fetchCategoriesApi } from '../../services/categoryService';
import { fetchTablesApi } from '../../services/tableService';
import { fetchSettingsApi } from '../../services/settingsService';
import {
  createManualOrderApi,
  updateManualOrderApi,
  printManualOrderReceiptApi,
} from '../../services/orderService';
import { formatCurrency, safeNumber } from '../../utils/formatters';
import { safeTrim, safeLower } from '../../utils/string';
import { getImageUrl } from '../../utils/image';
import toast from 'react-hot-toast';

// Modular Subcomponents
import { PosMenuCard } from './pos/PosMenuCard';
import { PosTableSelector } from './pos/PosTableSelector';
import { PosOrderItem } from './pos/PosOrderItem';
import { PosPaymentSelector } from './pos/PosPaymentSelector';

export const ManualBillingModal = ({
  isOpen,
  onClose,
  onSuccess,
  existingOrder = null,
  onOpenReceipt,
}) => {
  // Input Ref for Autofocus & Shortcuts
  const searchInputRef = useRef(null);

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

    // Autofocus search on open
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
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
            image: getImageUrl(i.image),
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

  // Frequently Ordered (Popular / Recommended Items)
  const popularItems = useMemo(() => {
    const items = Array.isArray(menuItems) ? menuItems : [];
    const list = items.filter(
      (item) =>
        (item.popular || item.recommended) &&
        item.availability !== 'out_of_stock'
    );
    return list.slice(0, 6);
  }, [menuItems]);

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
          image: getImageUrl(item.image),
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

  // 8. Accessibility: Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Esc -> close
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Ctrl+F or Cmd+F -> Search Menu
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Ctrl+B or Cmd+B -> Generate Bill
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (!submitting && cartItems.length > 0) {
          handleSubmitBill('generate');
        }
        return;
      }

      // Ctrl+S or Cmd+S -> Save Draft
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!submitting && cartItems.length > 0) {
          handleSubmitBill('save_draft');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isOpen,
    submitting,
    cartItems,
    selectedTableId,
    billType,
    customerName,
    customerPhone,
    sendToKitchen,
    billNotes,
    discountType,
    discountValue,
    packagingCharge,
    paymentMethod,
    splitCash,
    splitUpi,
    splitCard,
  ]);

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
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
        />

        {/* Desktop-First Full Billing Console Dialog */}
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative bg-white w-full max-w-[1700px] h-[96vh] rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden border border-slate-200"
        >
          {/* Top Header Bar */}
          <header className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black tracking-wide uppercase font-mono">
                    Craviti POS Billing
                  </h2>
                  {createdOrderNumber && (
                    <span className="text-[11px] font-mono font-bold bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-emerald-300">
                      #{createdOrderNumber}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Fast Manual Billing & Table Settlements (Petpooja Style)
                </p>
              </div>
            </div>

            {/* Header Right Actions & Shortcuts Badge */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Keyboard shortcuts reminder pill */}
              <div className="hidden xl:flex items-center gap-2 text-[10px] font-medium text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-lg">
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-700 text-slate-200 rounded text-[9px] font-mono">
                    Ctrl+F
                  </kbd>{' '}
                  Search
                </span>
                <span className="opacity-40">•</span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-700 text-slate-200 rounded text-[9px] font-mono">
                    Ctrl+B
                  </kbd>{' '}
                  Generate
                </span>
                <span className="opacity-40">•</span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-700 text-slate-200 rounded text-[9px] font-mono">
                    Esc
                  </kbd>{' '}
                  Close
                </span>
              </div>

              {(createdOrderId || existingOrder?._id) && (
                <button
                  type="button"
                  onClick={() => handlePrintReceipt()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FiPrinter className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Receipt</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Main 2-Column Split Area */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* ======================================================== */}
            {/* LEFT COLUMN: Menu Search, Categories & Food Cards (70%) */}
            {/* ======================================================== */}
            <div className="w-full lg:w-[65%] xl:w-[70%] flex flex-col border-r border-slate-200/90 overflow-hidden bg-slate-50/60">
              {/* Sticky Top Header: Search & Food Type Filter */}
              <div className="p-3.5 sm:p-4 bg-white border-b border-slate-200 space-y-3 sticky top-0 z-20 shadow-2xs">
                <div className="flex gap-2.5 items-center">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search menu items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs font-medium pl-10 pr-9 py-2.5 rounded-xl bg-slate-100/90 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
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

                  {/* Veg / Non-Veg Quick Switch Filter */}
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0 border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setFoodTypeFilter('all')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
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
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                        foodTypeFilter === 'veg'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setFoodTypeFilter('non-veg')}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                        foodTypeFilter === 'non-veg'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-300" /> Non-Veg
                    </button>
                  </div>
                </div>

                {/* Category Horizontal Scroll Chips */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none no-scrollbar pt-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('ALL')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0 cursor-pointer ${
                      activeCategory === 'ALL'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    All Items ({menuItems.length})
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => setActiveCategory(cat._id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0 cursor-pointer ${
                        activeCategory === cat._id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {cat.categoryName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid & Frequently Ordered Section */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Frequently Ordered Section (If available & no search active) */}
                {!searchQuery && activeCategory === 'ALL' && popularItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <MdLocalFireDepartment className="w-4 h-4 text-amber-500" />
                      <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                        Frequently Ordered Quick Picks
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
                      {popularItems.map((item) => {
                        const qty = getItemQuantityInCart(item._id);
                        return (
                          <button
                            key={`quick-${item._id}`}
                            type="button"
                            onClick={() => handleAddItem(item)}
                            className="p-2 bg-white rounded-xl border border-slate-200/90 hover:border-slate-400 hover:shadow-sm text-left transition-all flex flex-col justify-between group cursor-pointer"
                          >
                            <span className="font-bold text-[11px] text-slate-800 line-clamp-1 group-hover:text-slate-950">
                              {item.itemName}
                            </span>
                            <div className="flex items-center justify-between mt-1 text-[11px]">
                              <span className="font-extrabold text-slate-900">
                                {formatCurrency(item.sellingPrice || item.price || 0)}
                              </span>
                              {qty > 0 && (
                                <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center">
                                  {qty}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Main Menu Cards Grid */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-52 text-slate-400 text-xs font-semibold space-y-2">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                    <span>Loading live restaurant menu...</span>
                  </div>
                ) : filteredMenuItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <p className="text-slate-700 font-bold text-sm">No items found</p>
                    <p className="text-slate-400 text-xs mt-1 max-w-xs">
                      Try clearing your search query or selecting a different category.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                    {filteredMenuItems.map((item) => {
                      const qty = getItemQuantityInCart(item._id);
                      return (
                        <PosMenuCard
                          key={item._id}
                          item={item}
                          quantity={qty}
                          onAdd={handleAddItem}
                          onUpdateQuantity={(newQty) => {
                            const matchIdx = cartItems.findIndex(
                              (c) => (c.itemId || c.menuItemId) === item._id
                            );
                            if (matchIdx > -1) {
                              handleUpdateQuantity(matchIdx, newQty);
                            } else if (newQty > 0) {
                              handleAddItem(item);
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* RIGHT COLUMN: POS Billing Console, Cart & Totals (30%)  */}
            {/* ======================================================== */}
            <div className="w-full lg:w-[35%] xl:w-[30%] flex flex-col bg-white overflow-hidden">
              {/* SECTION 1: Table & Customer Information Card (Compact) */}
              <div className="p-3.5 border-b border-slate-200/90 bg-slate-50/70 space-y-2.5 shrink-0">
                {/* Walk-in vs Assign Table Segmented Toggle */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setBillType('walk_in');
                      setSelectedTableId('');
                    }}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      billType === 'table'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MdOutlineTableRestaurant className="w-4 h-4 text-indigo-600" />
                    <span>Assign Table</span>
                  </button>
                </div>

                {/* Table Picker if Table mode */}
                {billType === 'table' && (
                  <PosTableSelector
                    tables={tables}
                    selectedTableId={selectedTableId}
                    onSelectTable={(id) => setSelectedTableId(id)}
                  />
                )}

                {/* Customer Details Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      placeholder="Customer Name (Optional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Phone (Optional)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                {/* Kitchen Order Ticket (KOT) with clean checkbox styling */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={sendToKitchen}
                      onChange={(e) => setSendToKitchen(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300 accent-slate-900 cursor-pointer"
                    />
                    <span className="flex items-center gap-1">
                      <FiSend className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Send to Kitchen (KOT)</span>
                    </span>
                  </label>

                  <span className="text-[10px] text-slate-400 font-medium">
                    {sendToKitchen ? 'Notify Cook' : 'Skip Kitchen'}
                  </span>
                </div>
              </div>

              {/* SECTION 2: Itemized Cart List (Scrolls Independently) */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Order Items ({cartItems.reduce((acc, c) => acc + c.quantity, 0)})
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
                  <div className="py-12 text-center text-slate-400 space-y-1.5">
                    <p className="text-xs font-bold text-slate-600">Cart is empty</p>
                    <p className="text-[11px] max-w-xs mx-auto text-slate-400">
                      Tap any menu item on the left to add it to this manual bill.
                    </p>
                  </div>
                ) : (
                  cartItems.map((item, idx) => (
                    <PosOrderItem
                      key={`${item.itemId || item.menuItemId}-${idx}`}
                      item={item}
                      index={idx}
                      onUpdateQuantity={handleUpdateQuantity}
                      onUpdateNotes={handleUpdateItemNotes}
                      onRemove={handleRemoveItem}
                    />
                  ))
                )}
              </div>

              {/* SECTIONS 3 & 4 + BOTTOM ACTIONS: Financials & Payment (Sticky Bottom) */}
              <div className="p-3.5 border-t border-slate-200 space-y-2.5 bg-slate-50/80 shrink-0 text-xs">
                {/* SECTION 3: Bill Discount Selector */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 font-bold flex items-center gap-1 text-[11px]">
                    <FiTag className="w-3.5 h-3.5 text-amber-600" /> Bill Discount:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="text-[11px] px-2 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900"
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
                        className="w-16 text-xs px-2 py-1 rounded-lg bg-white border border-slate-200 font-bold text-right text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    )}
                  </div>
                </div>

                {/* Subtotals & Taxes Hierarchy */}
                <div className="space-y-1 pt-1 border-t border-slate-200/80 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCurrency(calculations.subtotal)}
                    </span>
                  </div>

                  {calculations.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount Savings:</span>
                      <span className="font-mono">-{formatCurrency(calculations.totalDiscount)}</span>
                    </div>
                  )}

                  {calculations.gstAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>GST ({calculations.gstRate}%):</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatCurrency(calculations.gstAmount)}
                      </span>
                    </div>
                  )}

                  {calculations.serviceChargeAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Service Charge ({calculations.serviceRate}%):</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatCurrency(calculations.serviceChargeAmount)}
                      </span>
                    </div>
                  )}

                  {calculations.packagingCharge > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Packaging Charge:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatCurrency(calculations.packagingCharge)}
                      </span>
                    </div>
                  )}

                  {/* Grand Total: Dominant Typography */}
                  <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-slate-300">
                    <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                      Grand Total
                    </span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                      {formatCurrency(calculations.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* SECTION 4: Payment Selector */}
                <PosPaymentSelector
                  paymentMethod={paymentMethod}
                  onSelectPaymentMethod={setPaymentMethod}
                  splitCash={splitCash}
                  onSplitCashChange={setSplitCash}
                  splitUpi={splitUpi}
                  onSplitUpiChange={setSplitUpi}
                  splitCard={splitCard}
                  onSplitCardChange={setSplitCard}
                  grandTotal={calculations.grandTotal}
                />

                {/* BOTTOM ACTIONS: Primary Generate Bill, Secondary Mark Paid, Text Save Draft */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={submitting || cartItems.length === 0}
                    onClick={() => handleSubmitBill('save_draft')}
                    className="py-2.5 px-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Save Draft (Ctrl+S)"
                  >
                    Save Draft
                  </button>

                  <button
                    type="button"
                    disabled={submitting || cartItems.length === 0}
                    onClick={() => handleSubmitBill('generate')}
                    className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Generate Bill (Ctrl+B)"
                  >
                    Generate Bill
                  </button>

                  <button
                    type="button"
                    disabled={submitting || cartItems.length === 0}
                    onClick={() => handleSubmitBill('mark_paid')}
                    className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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
