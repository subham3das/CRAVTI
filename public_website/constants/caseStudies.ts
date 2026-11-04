import { CaseStudy } from '../types';

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'spice-garden-bistro',
    restaurantName: 'Spice Garden Bistro',
    tagline: 'How a 35-table Mumbai bistro unlocked ₹4.2L additional monthly revenue with Craviti QR dining',
    location: 'Bandra West, Mumbai',
    cuisine: 'Modern Indian & Fusion',
    tables: 35,
    heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
    summary:
      'Spice Garden Bistro was struggling with 35-minute dining bottlenecks during peak weekend lunch and dinner slots. By introducing Craviti QR dining and synchronized Kitchen Display tickets, they dramatically accelerated table turnover while elevating customer satisfaction.',
    challenges: [
      'Guests waited an average of 14 minutes just to place their initial beverage or appetizer order.',
      'Servers were overwhelmed handling both order taking and physical bill payment processing.',
      'Peak weekend table waitlists reached over 45 minutes, resulting in walkaway diner loss.',
    ],
    solutions: [
      'Placed engraved Craviti QR table stands across all 35 dining tables and garden patio booths.',
      'Enabled real-time Kitchen Display screens in the main tandoor section and beverage bar.',
      'Integrated Razorpay instant checkout for guest-directed self-checkout without waiter delay.',
    ],
    results: [
      { stat: '+38%', label: 'Increase in Weekend Table Turnovers' },
      { stat: '-19 min', label: 'Average Dining Duration per Table' },
      { stat: '+24%', label: 'Upselling on Appetizers & Cocktails' },
      { stat: '4.9/5', label: 'Google Review Score Post-Launch' },
    ],
    testimonialQuote:
      'Craviti paid for itself in the first 48 hours. Guests love being able to re-order drinks or bread without having to flag down a waiter across a noisy room.',
    author: 'Chef Rajesh Sharma, Founder',
  },
  {
    slug: 'urban-dhaba-lounge',
    restaurantName: 'Urban Dhaba Lounge',
    tagline: 'Zero kitchen order mistakes and 42% faster prep times for Bengaluru tech corridor hotspot',
    location: 'Indiranagar, Bengaluru',
    cuisine: 'North Indian & Craft Beverages',
    tables: 48,
    heroImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
    summary:
      'With high volumes of corporate dining groups and complex custom spice requests, Urban Dhaba suffered from frequent misheard tickets and paper order discrepancies. Craviti KDS and digital modifier prompts eliminated kitchen friction completely.',
    challenges: [
      'Paper KOTs (Kitchen Order Tickets) getting soaked, smeared, or misplaced during frantic rushes.',
      'Guest requests for custom dietary accommodations (vegan, gluten-free, no onion/garlic) lost in transit.',
      'Cashiers burdened with calculating split bills across large corporate dining parties.',
    ],
    solutions: [
      'Deployed dual KDS stations with synthesized audio chimes for new orders and modifications.',
      'Mandatory modifier steps in digital menus ensuring spice levels and food preferences are recorded.',
      'Digital receipt generation via PDF allowing diners to claim company reimbursements immediately.',
    ],
    results: [
      { stat: '99.8%', label: 'Kitchen Order Accuracy' },
      { stat: '11 mins', label: 'Average Kitchen Prep Time' },
      { stat: '₹140', label: 'Higher Average Spend per Head' },
      { stat: '0 hrs', label: 'Staff Overtime Tracking Disputes' },
    ],
    testimonialQuote:
      'Our chefs treat the KDS screens like their personal cockpit. The chime alerts let them focus on cooking rather than reading handwriting.',
    author: 'Priya Mehra, Co-Owner',
  },
  {
    slug: 'royal-dine-heritage',
    restaurantName: 'Royal Dine Heritage',
    tagline: 'Scaling banquet dining and luxury heritage hospitality across 60 tables in Jaipur',
    location: 'C-Scheme, Jaipur',
    cuisine: 'Rajasthani & Royal Mughlai',
    tables: 60,
    heroImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&auto=format&fit=crop&q=80',
    summary:
      'Operating across a sprawling multi-level heritage courtyard, Royal Dine needed a technological solution that preserved luxury hospitality standards while removing operational bottlenecks.',
    challenges: [
      'Massive courtyard distances meant waiters spent up to 40% of their shift simply walking back and forth.',
      'High-end tourists required multi-language menus and clear currency/tax transparency.',
      'Delay in bill generation created negative last impressions for otherwise flawless dining experiences.',
    ],
    solutions: [
      'QR menus in high-resolution photography with English and Hindi dietary descriptions.',
      'Instant mobile digital bill payment with auto-calculated service charges and GST invoices.',
      'Centralized admin dashboard monitoring dining durations across courtyard zones.',
    ],
    results: [
      { stat: '+31%', label: 'Beverage & Dessert Re-order Rate' },
      { stat: '-65%', label: 'Waiter Foot Transit Time' },
      { stat: '₹18.4L', label: 'Monthly Digital Transaction Volume' },
      { stat: '100%', label: 'GST Reconciliation Accuracy' },
    ],
    testimonialQuote:
      'Craviti enhanced our hospitality rather than detracting from it. Our servers now spend their time describing heritage recipes instead of running paper receipts.',
    author: 'Vikramaditya Rao, Director',
  },
];

