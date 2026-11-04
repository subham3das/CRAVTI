import { createContext, useContext, useState, useEffect } from 'react';
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

  const addToCart = (item, quantity = 1, specialInstructions = '') => {
    if (!item?._id) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.menuItemId === item._id && (i.specialInstructions || '') === specialInstructions
      );

      const price = safeNumber(item.price);
      const sellingPrice = safeNumber(item.sellingPrice) || price;

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity = safeNumber(next[existingIndex].quantity) + quantity;
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
  };

  const updateQuantity = (menuItemId, quantity) => {
    const q = safeNumber(quantity);
    if (q <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: q } : i))
    );
  };

  const removeFromCart = (menuItemId) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  };

  const getItemQuantity = (menuItemId) => {
    const item = (cart || []).find((i) => i.menuItemId === menuItemId);
    return item ? safeNumber(item.quantity) : 0;
  };

  const safeCart = Array.isArray(cart) ? cart : [];
  const totalCount = safeCart.reduce((sum, item) => sum + safeNumber(item.quantity), 0);

  const subtotal = safeCart.reduce(
    (sum, item) => sum + safeNumber(item.price) * safeNumber(item.quantity),
    0
  );

  const grandTotal = safeCart.reduce(
    (sum, item) => sum + safeNumber(item.sellingPrice) * safeNumber(item.quantity),
    0
  );

  const discount = Math.max(0, subtotal - grandTotal);

  return (
    <CustomerCartContext.Provider
      value={{
        cart: safeCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getItemQuantity,
        totalCount,
        subtotal,
        discount,
        grandTotal,
      }}
    >
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
