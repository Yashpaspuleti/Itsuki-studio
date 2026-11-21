export type Product = {
  id: string; slug: string; name: string; tagline: string; description: string;
  pricePaise: number; image: string; alt: string; details: string[];
};

export const products: Product[] = [
  {
    id: 'wave-lamp', slug: 'wave-lamp', name: 'Wave Lamp', tagline: 'Soft curves. Gentle glow.',
    description: 'Flowing, sculptural lines create a soft ambient glow for slow evenings and thoughtful spaces.',
    pricePaise: 249900, image: '/images/wave-lamp.jpg', alt: 'Lavender glowing sculptural wave lamp with a dark base',
    details: ['Sculptural flowing texture', 'Warm ambient lighting', 'Designed for bedside tables and living spaces'],
  },
  {
    id: 'geometric-lamp', slug: 'geometric-lamp', name: 'Geometric Lamp', tagline: 'Bold patterns. Warm light.',
    description: 'A tactile geometric pattern turns a simple light into a distinctive accent for your home.',
    pricePaise: 249900, image: '/images/geometric-lamp.jpg', alt: 'Warm ivory geometric patterned cylindrical lamp with a red base',
    details: ['Intricate geometric surface', 'Warm ambient lighting', 'A distinctive accent for home or office'],
  },
];

export const formatPrice = (paise: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
