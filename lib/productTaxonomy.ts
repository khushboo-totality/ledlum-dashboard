// ── Product Taxonomy ─────────────────────────────────────────────────
// Three-level hierarchy: Category → Subcategory → Product Type

export interface ProductType {
  id: string
  label: string
}

export interface Subcategory {
  id: string
  label: string
  types: ProductType[]
}

export interface TaxonomyCategory {
  id: string
  label: string
  icon: string         // SVG path string
  subcategories: Subcategory[]
}

export const TAXONOMY: TaxonomyCategory[] = [
  {
    id: 'indoor',
    label: 'Indoor Lighting',
    icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
    subcategories: [
      {
        id: 'indoor-downlights', label: 'Downlights',
        types: [
          { id: 'recessed-downlight',    label: 'Recessed Downlights'    },
          { id: 'surface-downlight',     label: 'Surface Downlights'     },
          { id: 'adjustable-downlight',  label: 'Adjustable Downlights'  },
          { id: 'slim-border-downlight', label: 'Slim Border Downlights' },
          { id: 'cob-downlight',         label: 'COB Downlights'         },
        ],
      },
      {
        id: 'indoor-spotlights', label: 'Spotlights',
        types: [
          { id: 'cob-spotlight',         label: 'COB Spotlights'         },
          { id: 'led-spotlight',         label: 'LED Spotlights'         },
          { id: 'gimbal-spotlight',      label: 'Gimbal Spotlights'      },
        ],
      },
      {
        id: 'indoor-panel', label: 'Panel Lights',
        types: [
          { id: 'flat-panel',            label: 'Flat Panel Lights'      },
          { id: 'edge-lit-panel',        label: 'Edge-Lit Panels'        },
          { id: 'back-lit-panel',        label: 'Back-Lit Panels'        },
        ],
      },
      {
        id: 'indoor-track', label: 'Track Lights',
        types: [
          { id: '1-phase-track',         label: '1-Phase Track'          },
          { id: '3-phase-track',         label: '3-Phase Track'          },
          { id: 'magnetic-track',        label: 'Magnetic Track'         },
        ],
      },
      {
        id: 'indoor-strip', label: 'Strip Lights & Profiles',
        types: [
          { id: 'led-strip',             label: 'LED Strip Lights'       },
          { id: 'neon-flex',             label: 'Neon Flex'              },
          { id: 'aluminium-profile',     label: 'Aluminium Profiles'     },
          { id: 'ip-rated-strip',        label: 'IP-Rated Strips'        },
        ],
      },
      {
        id: 'indoor-ceiling', label: 'Ceiling Lights',
        types: [
          { id: 'flush-ceiling',         label: 'Flush Mount'            },
          { id: 'pendant-ceiling',       label: 'Pendant Lights'         },
          { id: 'chandelier',            label: 'Chandeliers'            },
        ],
      },
      {
        id: 'indoor-wall', label: 'Wall Lights',
        types: [
          { id: 'sconce',                label: 'Wall Sconces'           },
          { id: 'picture-light',         label: 'Picture Lights'         },
          { id: 'wall-washer-indoor',    label: 'Wall Washers'           },
        ],
      },
    ],
  },
  {
    id: 'outdoor',
    label: 'Outdoor Lighting',
    icon: 'M12 3v1m0 16v1M4.22 4.22l.71.71m12.73 12.73.71.71M1 12h2m18 0h2M4.22 19.78l.71-.71M18.36 5.64l.71-.71 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    subcategories: [
      {
        id: 'outdoor-wall', label: 'Wall Lights',
        types: [
          { id: 'outdoor-bulkhead',      label: 'Bulkhead Lights'        },
          { id: 'outdoor-sconce',        label: 'Outdoor Sconces'        },
          { id: 'outdoor-wall-washer',   label: 'Wall Washers'           },
        ],
      },
      {
        id: 'outdoor-landscape', label: 'Landscape Lights',
        types: [
          { id: 'spike-light',           label: 'Spike Lights'           },
          { id: 'bollard-light',         label: 'Bollard Lights'         },
          { id: 'path-light',            label: 'Path Lights'            },
        ],
      },
      {
        id: 'outdoor-step', label: 'Step Lights',
        types: [
          { id: 'recessed-step',         label: 'Recessed Step Lights'   },
          { id: 'surface-step',          label: 'Surface Step Lights'    },
        ],
      },
      {
        id: 'outdoor-underground', label: 'Underground Lights',
        types: [
          { id: 'inground-uplight',      label: 'Inground Uplights'      },
          { id: 'drive-over',            label: 'Drive-Over Lights'      },
        ],
      },
      {
        id: 'outdoor-underwater', label: 'Underwater Lights',
        types: [
          { id: 'pool-light',            label: 'Pool Lights'            },
          { id: 'fountain-light',        label: 'Fountain Lights'        },
        ],
      },
      {
        id: 'outdoor-flood', label: 'Flood Lights',
        types: [
          { id: 'led-flood',             label: 'LED Flood Lights'       },
          { id: 'cob-flood',             label: 'COB Flood Lights'       },
          { id: 'solar-flood',           label: 'Solar Flood Lights'     },
        ],
      },
    ],
  },
  {
    id: 'architectural',
    label: 'Architectural Lighting',
    icon: 'M4 21V8l8-7 8 7v13 M9 21v-6h6v6',
    subcategories: [
      {
        id: 'arch-linear', label: 'Linear Systems',
        types: [
          { id: 'recessed-linear',       label: 'Recessed Linear'        },
          { id: 'surface-linear',        label: 'Surface Linear'         },
          { id: 'pendant-linear',        label: 'Pendant Linear'         },
        ],
      },
      {
        id: 'arch-cove', label: 'Cove & Indirect',
        types: [
          { id: 'cove-lighting',         label: 'Cove Lighting'          },
          { id: 'indirect-uplight',      label: 'Indirect Uplighting'    },
        ],
      },
      {
        id: 'arch-facade', label: 'Façade Lighting',
        types: [
          { id: 'grazing-light',         label: 'Grazing Lights'         },
          { id: 'facade-washer',         label: 'Façade Washers'         },
        ],
      },
    ],
  },
  {
    id: 'decorative',
    label: 'Decorative Lighting',
    icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    subcategories: [
      {
        id: 'deco-pendant', label: 'Pendant Lights',
        types: [
          { id: 'decorative-pendant',    label: 'Decorative Pendants'    },
          { id: 'cluster-pendant',       label: 'Cluster Pendants'       },
        ],
      },
      {
        id: 'deco-chandelier', label: 'Chandeliers',
        types: [
          { id: 'crystal-chandelier',    label: 'Crystal Chandeliers'    },
          { id: 'modern-chandelier',     label: 'Modern Chandeliers'     },
        ],
      },
      {
        id: 'deco-table', label: 'Table & Floor Lamps',
        types: [
          { id: 'table-lamp',            label: 'Table Lamps'            },
          { id: 'floor-lamp',            label: 'Floor Lamps'            },
        ],
      },
    ],
  },
  {
    id: 'smart',
    label: 'Smart Lighting',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z',
    subcategories: [
      {
        id: 'smart-wifi', label: 'Wi-Fi & App Control',
        types: [
          { id: 'wifi-bulb',             label: 'Smart Bulbs'            },
          { id: 'wifi-downlight',        label: 'Smart Downlights'       },
          { id: 'wifi-strip',            label: 'Smart Strip Lights'     },
        ],
      },
      {
        id: 'smart-dali', label: 'DALI & KNX Systems',
        types: [
          { id: 'dali-driver',           label: 'DALI Drivers'           },
          { id: 'knx-module',            label: 'KNX Modules'            },
        ],
      },
      {
        id: 'smart-sensor', label: 'Sensor & Motion',
        types: [
          { id: 'pir-light',             label: 'PIR Motion Lights'      },
          { id: 'daylight-sensor',       label: 'Daylight Sensors'       },
        ],
      },
    ],
  },
  {
    id: 'fans',
    label: 'Fans with Lights',
    icon: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
    subcategories: [
      {
        id: 'fan-ceiling', label: 'Ceiling Fans',
        types: [
          { id: 'decorative-fan',        label: 'Decorative Fans'        },
          { id: 'modern-fan',            label: 'Modern Fans'            },
          { id: 'smart-fan',             label: 'Smart Fans'             },
        ],
      },
      {
        id: 'fan-dc', label: 'DC Motor Fans',
        types: [
          { id: 'dc-fan',                label: 'DC Energy Saving Fans'  },
        ],
      },
    ],
  },
  {
    id: 'accessories',
    label: 'Accessories',
    icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    subcategories: [
      {
        id: 'acc-drivers', label: 'Drivers & Transformers',
        types: [
          { id: 'constant-current',      label: 'Constant Current Drivers' },
          { id: 'constant-voltage',      label: 'Constant Voltage Drivers' },
          { id: 'dimmable-driver',       label: 'Dimmable Drivers'         },
        ],
      },
      {
        id: 'acc-controls', label: 'Controllers & Dimmers',
        types: [
          { id: 'phase-dimmer',          label: 'Phase Dimmers'          },
          { id: 'pwm-controller',        label: 'PWM Controllers'        },
          { id: 'remote-control',        label: 'Remote Controls'        },
        ],
      },
      {
        id: 'acc-mounting', label: 'Mounting & Hardware',
        types: [
          { id: 'canopy-box',            label: 'Canopy & Junction Boxes' },
          { id: 'surface-box',           label: 'Surface Mount Boxes'    },
          { id: 'track-adapter',         label: 'Track Adapters'         },
        ],
      },
    ],
  },
]

export function getCategoryById(id: string) {
  return TAXONOMY.find(c => c.id === id) ?? null
}
export function getSubcategoryById(catId: string, subId: string) {
  return getCategoryById(catId)?.subcategories.find(s => s.id === subId) ?? null
}
