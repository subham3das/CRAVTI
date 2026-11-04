export const calculateSellingPrice = (price, discountType = 'none', discountValue = 0) => {
  const numPrice = Number(price) || 0;
  const numDiscount = Number(discountValue) || 0;

  if (numPrice <= 0) {
    return 0;
  }

  if (discountType === 'percentage') {
    if (numDiscount < 0 || numDiscount > 100) {
      throw new Error('Percentage discount must be between 0% and 100%');
    }
    const discountAmount = (numPrice * numDiscount) / 100;
    return Math.max(0, Number((numPrice - discountAmount).toFixed(2)));
  }

  if (discountType === 'flat') {
    if (numDiscount < 0) {
      throw new Error('Discount amount cannot be negative');
    }
    if (numDiscount > numPrice) {
      throw new Error('Flat discount amount cannot exceed the original price');
    }
    return Math.max(0, Number((numPrice - numDiscount).toFixed(2)));
  }

  return Number(numPrice.toFixed(2));
};

