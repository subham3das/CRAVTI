# Craviti Public Marketing Website

Production marketing website for **Craviti — The Operating System for Modern Restaurants**.

## Tech Stack
* **Framework:** Next.js 15 (App Router)
* **UI:** React 19, TypeScript
* **Styling:** Tailwind CSS (Custom `#FF6B35` theme)
* **Animations:** Framer Motion
* **Icons:** Lucide React & React Icons
* **Optimization:** `next/image` and `next/font/google` (Inter & Outfit)

## Key Features & Pages
* `/` — High-converting SaaS Home Page (Hero, Problem vs. Solution, 6 Core Pillars, Walkthrough, Live Dashboard/KDS/Mobile previews, Chef Testimonials, Pricing Preview, FAQ, CTA Banner)
* `/features` — Comprehensive product deep dive into QR dining, Kitchen Display System (KDS), Razorpay settlements, visual floor maps, and platform administration
* `/pricing` — Transparent Starter, Growth, and Enterprise tiers with Monthly/Annual toggles and full comparison matrix
* `/about` — Mission, founding story, 4 core values, milestone stats, and leadership profiles
* `/contact` — Interactive restaurant inquiry form, direct phone hotlines, and headquarters details
* `/join` — Restaurant partner onboarding landing page with benefits, checklist requirements, and direct link to signup/login
* `/case-studies` & `/case-studies/[slug]` — Measured customer success stories (Spice Garden Bistro, Urban Dhaba Lounge, Royal Dine Heritage)
* `/blog` & `/blog/[slug]` — The Craviti Dispatch featuring articles on menu engineering, KDS operations, and cash flow
* `/resources` — Interactive Restaurant Margin & ROI Calculator, free operational playbooks (PDF)
* `/help` — Knowledge Base with searchable categories, tutorial guides, and troubleshooting steps
* `/security` — 256-bit AES encryption, strict multi-tenant isolation, 99.99% availability SLA, and 4-eye bank verification
* 13 Legal Pages with sticky Table of Contents and last-updated tracking:
  * `/privacy-policy`
  * `/terms-and-conditions`
  * `/refund-policy`
  * `/cancellation-policy`
  * `/cookie-policy`
  * `/data-processing-agreement`
  * `/security-policy`
  * `/merchant-agreement`
  * `/customer-terms`
  * `/acceptable-use-policy`
  * `/disclaimer`
  * `/gdpr`
  * `/ccpa`
* `/sitemap.xml` & `/robots.txt` — Automated SEO indexing across all 25+ routes

## Getting Started
```bash
# Navigate to the folder
cd public_website

# Install dependencies (already installed)
npm install

# Run development server on port 3000
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

