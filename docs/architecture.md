# Craviti System Architecture & API Documentation

## Overview
Craviti Restaurant Panel enables restaurant owners to self-onboard, manage restaurant profiles, view real-time orders, and configure table QR codes.

## Authentication & Onboarding Flow
1. **Signup** (`POST /api/auth/signup`):
   - Accepts `email`, `phone`, `password`, `confirmPassword`.
   - Hashes password using `bcrypt`.
   - Generates JWT and sets up `RestaurantUser`.
2. **Onboarding** (`POST /api/restaurants/onboard`):
   - Authenticated route.
   - Collects restaurant name, logo (uploaded to Cloudinary), owner name, phone, address.
   - Sets `profileCompleted=true`, `paymentEnabled=false`, `verificationStatus="pending"`.
   - Associates restaurant with `RestaurantUser`.
3. **Restaurant Profile** (`PUT /api/profile`):
   - Additional business information (Cover image, description, city, state, pincode, GST, FSSAI, timings).
   - Bank details (Account number, IFSC, UPI ID).
   - Once bank details are submitted, status becomes `Bank Details Submitted` requiring admin verification before `paymentEnabled=true`.

