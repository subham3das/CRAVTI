import {
  FiGrid,
  FiShoppingBag,
  FiBookOpen,
  FiLayers,
  FiList,
  FiSquare,
  FiGrid as FiQR,
  FiBarChart2,
  FiSettings,
  FiUserCheck,
  FiCreditCard,
} from 'react-icons/fi';
import { MdQrCode2 } from 'react-icons/md';

export const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: FiGrid },
  { name: 'Orders', path: '/orders', icon: FiShoppingBag },
  {
    name: 'Menu',
    path: '/menu',
    icon: FiBookOpen,
    isExpandable: true,
    children: [
      { name: 'Categories', path: '/categories', icon: FiLayers },
      { name: 'Menu Items', path: '/menu', icon: FiList },
    ],
  },
  {
    name: 'Tables & QR',
    path: '/tables',
    icon: FiSquare,
    isExpandable: true,
    children: [
      { name: 'Tables', path: '/tables', icon: FiSquare },
      { name: 'QR Codes', path: '/qr-codes', icon: MdQrCode2 },
    ],
  },
  { name: 'Payments', path: '/payments', icon: FiCreditCard },
  { name: 'Analytics', path: '/analytics', icon: FiBarChart2 },
  { name: 'Restaurant Profile', path: '/profile', icon: FiUserCheck },
  { name: 'Settings', path: '/settings', icon: FiSettings },
];

export const RESTAURANT_INFO = {
  name: 'Spice Garden Bistro',
  branch: 'Main Downtown',
  logoText: 'CRAVITI',
};
