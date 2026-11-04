export const calculateProfileCompletion = (restaurant) => {
  if (!restaurant) return 0;

  let score = 0;

  // Onboarding basics (40 pts)
  if (restaurant.restaurantName) score += 10;
  if (restaurant.logo?.url) score += 10;
  if (restaurant.ownerName) score += 10;
  if (restaurant.ownerPhone) score += 10;

  // Description & Cover (15 pts)
  if (restaurant.description) score += 5;
  if (restaurant.coverImage?.url) score += 10;

  // Address completeness (15 pts)
  if (restaurant.address?.city && restaurant.address?.state) score += 10;
  if (restaurant.address?.pincode) score += 5;

  // Operating timings (10 pts)
  if (restaurant.timing?.openingTime && restaurant.timing?.closingTime) score += 10;

  // Legal / Tax info (10 pts)
  if (restaurant.taxInfo?.gstNumber || restaurant.taxInfo?.fssaiNumber) score += 10;

  // Bank Details (10 pts)
  if (restaurant.bankDetails?.accountNumber && restaurant.bankDetails?.ifscCode) score += 10;

  return Math.min(100, score);
};

