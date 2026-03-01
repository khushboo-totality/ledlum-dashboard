import type { ProductDetail } from '@/types'

// Keyed by product Codes (uppercase)
// Add rich detail here for any product that needs config/permutations
export const PRODUCT_DETAILS: Record<string, ProductDetail> = {
  'LLF-103': {
    productAbout: {
      category: 'LED COB Spotlight',
      name: 'LLF-103',
      description: 'Experience the perfect blend of form and function with the LLF-103. Sleek, modern, and versatile — designed for precision illumination in residential and commercial spaces.',
      image: 'https://placehold.co/800x800/1a1a1a/ffffff?text=LLF-103',
    },
    config: {
      models:      ['LLF-103', 'LLF-103-S', 'LLF-103-M'],
      voltage:     ['220-240V', '110-120V'],
      dimensions:  ['Ø100x92mm', 'Ø130x116mm'],
      watts:       ['7W', '12W', '15W'],
      cct: [
        { label: '2700K', color: '#F5E6BE' },
        { label: '3000K', color: '#F5D68C' },
        { label: '4000K', color: '#F0F0F0' },
      ],
      bodyColors:  ['Dark Gray', 'White'],
      beamAngles:  ['15°', '24°', '36°'],
      ipRating:    ['IP20'],
      cutoutSizes: ['Ø90mm'],
      ledChip:     ['CREE COB'],
      luminous:    ['800lm', '1200lm', '1500lm'],
      cri:         ['≥90'],
    },
    permutations: [
      { voltage: '220-240V', watts: '7W',  dimensions: 'Ø100x92mm',  bodyColor: 'White',     beamAngles: '15°', ledChip: 'CREE COB', luminous: '800lm',  cri: '≥90', cct: '2700K' },
      { voltage: '220-240V', watts: '12W', dimensions: 'Ø100x92mm',  bodyColor: 'Dark Gray', beamAngles: '24°', ledChip: 'CREE COB', luminous: '1200lm', cri: '≥90', cct: '3000K' },
      { voltage: '110-120V', watts: '15W', dimensions: 'Ø130x116mm', bodyColor: 'White',     beamAngles: '36°', ledChip: 'CREE COB', luminous: '1500lm', cri: '≥90', cct: '4000K' },
      { voltage: '110-120V', watts: '7W',  dimensions: 'Ø100x92mm',  bodyColor: 'Dark Gray', beamAngles: '15°', ledChip: 'CREE COB', luminous: '800lm',  cri: '≥90', cct: '3000K' },
    ],
    gallery: [
      'https://placehold.co/437x531/101010/ffffff?text=LLF-103+View+1',
      'https://placehold.co/437x531/101010/ffffff?text=LLF-103+View+2',
      'https://placehold.co/437x531/101010/ffffff?text=LLF-103+View+3',
    ],
  },

  'LB-175': {
    productAbout: {
      category: 'LED Batten',
      name: 'LB-175',
      description: 'The LB-175 is a high-efficiency LED batten designed for uniform ambient lighting in offices, retail, and institutional spaces.',
      image: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800',
    },
    config: {
      voltage:    ['220-240V'],
      watts:      ['18W', '24W', '36W'],
      cct: [
        { label: '3000K', color: '#F5D68C' },
        { label: '4000K', color: '#F0F0F0' },
        { label: '6500K', color: '#D6EFFF' },
      ],
      bodyColors: ['White'],
      ipRating:   ['IP20', 'IP40'],
      luminous:   ['1800lm', '2400lm', '3600lm'],
      cri:        ['≥80', '≥90'],
    },
    permutations: [
      { voltage: '220-240V', watts: '18W', bodyColor: 'White', luminous: '1800lm', cri: '≥80', cct: '3000K' },
      { voltage: '220-240V', watts: '24W', bodyColor: 'White', luminous: '2400lm', cri: '≥80', cct: '4000K' },
      { voltage: '220-240V', watts: '36W', bodyColor: 'White', luminous: '3600lm', cri: '≥90', cct: '6500K' },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1615873968403-89e068629265?w=437',
    ],
  },

  'LLO-006': {
    productAbout: {
      category: 'LED Wall Washer',
      name: 'LLO-006',
      description: 'The LLO-006 wall washer delivers smooth, even illumination across vertical surfaces, perfect for accent and architectural lighting.',
      image: 'https://placehold.co/800x800/0a0a0a/ffffff?text=LLO-006',
    },
    config: {
      voltage:    ['220-240V', '110-120V'],
      watts:      ['10W', '15W', '20W'],
      cct: [
        { label: '2700K', color: '#F5E6BE' },
        { label: '3000K', color: '#F5D68C' },
        { label: '4000K', color: '#F0F0F0' },
      ],
      bodyColors:  ['Black', 'White', 'Silver'],
      ipRating:    ['IP44'],
      ledChip:     ['Samsung'],
      luminous:    ['1000lm', '1500lm', '2000lm'],
      cri:         ['≥90'],
    },
    permutations: [
      { voltage: '220-240V', watts: '10W', bodyColor: 'Black',  luminous: '1000lm', cri: '≥90', cct: '2700K' },
      { voltage: '220-240V', watts: '15W', bodyColor: 'White',  luminous: '1500lm', cri: '≥90', cct: '3000K' },
      { voltage: '110-120V', watts: '20W', bodyColor: 'Silver', luminous: '2000lm', cri: '≥90', cct: '4000K' },
    ],
    gallery: [
      'https://placehold.co/437x531/0a0a0a/ffffff?text=LLO-006+View+1',
      'https://placehold.co/437x531/0a0a0a/ffffff?text=LLO-006+View+2',
    ],
  },
}

export function getProductDetail(code: string): ProductDetail | null {
  return PRODUCT_DETAILS[code.toUpperCase()] ?? PRODUCT_DETAILS[code] ?? null
}
