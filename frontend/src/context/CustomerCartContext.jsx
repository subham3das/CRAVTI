import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { safeNumber } from '../utils/formatters';

const CustomerCartContext = createContext(null);

export const CustomerCartProvider = ({ children, storageKey = 'craviti_cart' }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart, storageKey]);

  const addToCart = useCallback((item, quantity = 1, specialInstructions = '') => {
    if (!item?._id) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.menuItemId === item._id && (i.specialInstructions || '') === specialInstructions
      );

      const price = safeNumber(item.price);
      const sellingPrice = safeNumber(item.sellingPrice) || price;

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: safeNumber(next[existingIndex].quantity) + quantity,
        };
        return next;
      }

      return [
        ...prev,
        {
          menuItemId: item._id,
          name: item.itemName ?? 'Dish',
          itemName: item.itemName ?? 'Dish',
          price,
          sellingPrice,
          quantity: Math.max(1, quantity),
          specialInstructions,
          image: item.image?.url || '',
          foodType: item.foodType || 'veg',
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((menuItemId, quantity) => {
    const q = safeNumber(quantity);
    if (q <= 0) {
      setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: q } : i))
    );
  }, []);

  const removeFromCart = useCallback((menuItemId) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  // Fast O(1) quantity lookup map
  const quantityMap = useMemo(() => {
    const map = new Map();
    for (const item of cart) {
      map.set(item.menuItemId, safeNumber(item.quantity));
    }
    return map;
  }, [cart]);

  const getItemQuantity = useCallback((menuItemId) => {
    return quantityMap.get(menuItemId) || 0;
  }, [quantityMap]);

  /**
   * Reconciles cart items against latest live production menu items
   * Removes deleted/out-of-stock items, updates live prices and images
   */
  const syncCartWithLiveMenu = useCallback((liveMenuItems = []) => {
    if (!Array.isArray(liveMenuItems) || liveMenuItems.length === 0) return;
    const liveMap = new Map(liveMenuItems.map((item) => [String(item._id), item]));

    setCart((prevCart) => {
      let changed = false;
      const updatedCart = [];

      for (const cartItem of prevCart) {
        const liveItem = liveMap.get(String(cartItem.menuItemId));
        // Remove item if no longer in live menu, deleted, or out of stock
        if (!liveItem || liveItem.isDeleted || liveItem.availability === 'out_of_stock') {
          changed = true;
          continue;
        }

        const currentPrice = safeNumber(liveItem.price);
        const currentSellingPrice = safeNumber(liveItem.sellingPrice) || currentPrice;
        const currentName = liveItem.itemName || cartItem.name;
        const currentImage = liveItem.image?.url || cartItem.image;

        if (
          cartItem.price !== currentPrice ||
          cartItem.sellingPrice !== currentSellingPrice ||
          cartItem.name !== currentName ||
          cartItem.image !== currentImage
        ) {
          changed = true;
          updatedCart.push({
            ...cartItem,
            name: currentName,
            itemName: currentName,
            price: currentPrice,
            sellingPrice: currentSellingPrice,
            image: currentImage,
          });
        } else {
          updatedCart.push(cartItem);
        }
      }

      return changed ? updatedCart : prevCart;
    });
  }, []);

  const safeCart = useMemo(() => (Array.isArray(cart) ? cart : []), [cart]);

  const totalCount = useMemo(
    () => safeCart.reduce((sum, item) => sum + safeNumber(item.quantity), 0),
    [safeCart]
  );

  const subtotal = useMemo(
    () =>
      safeCart.reduce(
        (sum, item) => sum + safeNumber(item.price) * safeNumber(item.quantity),
        0
      ),
    [safeCart]
  );

  const grandTotal = useMemo(
    () =>
      safeCart.reduce(
        (sum, item) => sum + safeNumber(item.sellingPrice) * safeNumber(item.quantity),
        0
      ),
    [safeCart]
  );

  const discount = useMemo(() => Math.max(0, subtotal - grandTotal), [subtotal, grandTotal]);

  const contextValue = useMemo(
    () => ({
      cart: safeCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getItemQuantity,
      syncCartWithLiveMenu,
      totalCount,
      subtotal,
      discount,
      grandTotal,
    }),
    [
      safeCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getItemQuantity,
      syncCartWithLiveMenu,
      totalCount,
      subtotal,
      discount,
      grandTotal,
    ]
  );

  return (
    <CustomerCartContext.Provider value={contextValue}>
      {children}
    </CustomerCartContext.Provider>
  );
};

export const useCustomerCart = () => {
  const context = useContext(CustomerCartContext);
  if (!context) {
    throw new Error('useCustomerCart must be used within a CustomerCartProvider');
  }
  return context;
};

export default CustomerCartProvider;
