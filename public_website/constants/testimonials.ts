import { Testimonial } from '../types';

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'spice-garden',
    author: 'Chef Rajesh Sharma',
    role: 'Founder & Executive Chef',
    restaurant: 'Spice Garden Bistro',
    location: 'Mumbai, Maharashtra',
    avatar: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=200&auto=format&fit=crop&q=80',
    quote:
      'Before Craviti, our peak Friday dinner rush was chaos. Waiters ran around taking duplicate orders, and guests waited 20 minutes just to get their bill. Within 48 hours of deploying Craviti QR dining, our table turnover speed increased by 38%, and our average guest spend went up by ₹140 per ticket.',
    metrics: {
      stat: '+38%',
      label: 'Table Turnover Speed',
    },
    rating: 5,
  },
  {
    id: 'urban-dhaba',
    author: 'Priya Mehra',
    role: 'Co-Owner & Managing Director',
    restaurant: 'Urban Dhaba Lounge',
    location: 'Bengaluru, Karnataka',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    quote:
      'The real-time Kitchen Display System is a work of art. The synthesized kitchen chimes ensure our tandoor and grill masters never miss a modification. Our kitchen mistake rate dropped from 7% to virtually zero in week one.',
    metrics: {
      stat: '0.2%',
      label: 'Order Error Rate',
    },
    rating: 5,
  },
  {
    id: 'royal-dine',
    author: 'Vikramaditya Rao',
    role: 'Director of Hospitality',
    restaurant: 'Royal Dine Heritage',
    location: 'Jaipur, Rajasthan',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
    quote:
      'We run a 60-table heritage property. Managing billing during wedding banquets was a nightmare until Craviti introduced instant UPI settlement and automated receipt generation. Diners love the elegance of the mobile menu.',
    metrics: {
      stat: '₹18.4L',
      label: 'Monthly Online Volume',
    },
    rating: 5,
  },
];

export const RESTAURANT_LOGOS = [
  { name: 'Spice Garden Bistro', city: 'Mumbai', tables: '35 Tables' },
  { name: 'Urban Dhaba Lounge', city: 'Bengaluru', tables: '48 Tables' },
  { name: 'Royal Dine Heritage', city: 'Jaipur', tables: '60 Tables' },
  { name: 'The Coastal Catch', city: 'Goa', tables: '28 Tables' },
  { name: 'Cafe Moksha', city: 'Pune', tables: '20 Tables' },
  { name: 'Trattoria Roma', city: 'Delhi NCR', tables: '42 Tables' },
];

