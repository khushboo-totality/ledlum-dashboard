// Mock product data keyed by product type ID
import type { Product } from '@/types'
import { TAXONOMY } from './productTaxonomy'

function makeProduct(overrides: Partial<Product> & { id: string; Codes: string; Category: string }): Product {
  return {
    zone: 'zone-a',
    source: 'internal',
    imageUrl: '',
    Price: '',
    Wattage: '',
    ColourTemp: '',
    BeamAngle: '',
    Finish: '',
    Dimensions: '',
    Description: '',
    ...overrides,
  }
}

export const MOCK_PRODUCTS_BY_TYPE: Record<string, Product[]> = {
  'recessed-downlight': [
    makeProduct({ id: 'rd-001', Codes: 'LLF-RD-12W',  Category: 'Downlights', Wattage: '12W', ColourTemp: '3000K/4000K', BeamAngle: '38°', Finish: 'White',        Description: 'Slim recessed downlight with anti-glare baffle' }),
    makeProduct({ id: 'rd-002', Codes: 'LLF-RD-18W',  Category: 'Downlights', Wattage: '18W', ColourTemp: '3000K/4000K/5000K', BeamAngle: '45°', Finish: 'Matt Black',   Description: 'Deep recessed downlight, UGR<19' }),
    makeProduct({ id: 'rd-003', Codes: 'LLF-RD-24W',  Category: 'Downlights', Wattage: '24W', ColourTemp: '2700K/3000K', BeamAngle: '38°', Finish: 'Brushed Gold', Description: 'High-lumen recessed with honeycomb louvre' }),
  ],
  'surface-downlight': [
    makeProduct({ id: 'sd-001', Codes: 'LLF-SD-10W',  Category: 'Downlights', Wattage: '10W', ColourTemp: '3000K', BeamAngle: '60°', Finish: 'White',      Description: 'Surface mount cylinder downlight' }),
    makeProduct({ id: 'sd-002', Codes: 'LLF-SD-15W',  Category: 'Downlights', Wattage: '15W', ColourTemp: '4000K', BeamAngle: '45°', Finish: 'Matt Black', Description: 'Surface cylinder with adjustable head' }),
  ],
  'adjustable-downlight': [
    makeProduct({ id: 'ad-001', Codes: 'LLF-ADJ-15W', Category: 'Downlights', Wattage: '15W', ColourTemp: '3000K/4000K', BeamAngle: '24°', Finish: 'White',          Description: '30° tilt adjustable anti-glare downlight' }),
    makeProduct({ id: 'ad-002', Codes: 'LLF-ADJ-20W', Category: 'Downlights', Wattage: '20W', ColourTemp: '2700K/3000K', BeamAngle: '15°', Finish: 'Brushed Nickel', Description: 'Precision adjustable with narrow beam optic' }),
    makeProduct({ id: 'ad-003', Codes: 'LLF-ADJ-25W', Category: 'Downlights', Wattage: '25W', ColourTemp: '3000K',       BeamAngle: '36°', Finish: 'Matt Black',     Description: 'Architectural adjustable, trimless option' }),
  ],
  'slim-border-downlight': [
    makeProduct({ id: 'sb-001', Codes: 'LLF-SB-12W',  Category: 'Downlights', Wattage: '12W', ColourTemp: '3000K/4000K', BeamAngle: '38°', Finish: 'White',      Description: '3mm border slim downlight, clean ceiling aesthetic' }),
    makeProduct({ id: 'sb-002', Codes: 'LLF-SB-18W',  Category: 'Downlights', Wattage: '18W', ColourTemp: '3000K',       BeamAngle: '38°', Finish: 'Matt Black', Description: 'Ultra-slim border, high CRI 97+' }),
  ],
  'cob-downlight': [
    makeProduct({ id: 'cd-001', Codes: 'LLF-COB-20W', Category: 'Downlights', Wattage: '20W', ColourTemp: '2700K/3000K/4000K', BeamAngle: '38°', Finish: 'White',        Description: 'COB downlight, natural warm glow' }),
    makeProduct({ id: 'cd-002', Codes: 'LLF-COB-30W', Category: 'Downlights', Wattage: '30W', ColourTemp: '3000K',             BeamAngle: '24°', Finish: 'Brushed Gold', Description: 'High power COB, Ra97, ideal for retail' }),
  ],
  'cob-spotlight': [
    makeProduct({ id: 'cs-001', Codes: 'LLF-SP-15W',  Category: 'Spotlights', Wattage: '15W', ColourTemp: '3000K',       BeamAngle: '24°', Finish: 'White',      Description: 'COB spotlight with replaceable module' }),
    makeProduct({ id: 'cs-002', Codes: 'LLF-SP-25W',  Category: 'Spotlights', Wattage: '25W', ColourTemp: '2700K/3000K', BeamAngle: '15°', Finish: 'Matt Black', Description: 'Accent spotlight for gallery lighting' }),
  ],
  'led-spotlight': [
    makeProduct({ id: 'ls2-001', Codes: 'LLF-LED-SP-12W', Category: 'Spotlights', Wattage: '12W', ColourTemp: '3000K/4000K', BeamAngle: '36°', Finish: 'White',      Description: 'Standard LED spotlight, low profile' }),
    makeProduct({ id: 'ls2-002', Codes: 'LLF-LED-SP-18W', Category: 'Spotlights', Wattage: '18W', ColourTemp: '3000K',       BeamAngle: '24°', Finish: 'Matt Black', Description: 'High-output LED spotlight, Ra95' }),
  ],
  'gimbal-spotlight': [
    makeProduct({ id: 'gs-001', Codes: 'LLF-GIM-18W', Category: 'Spotlights', Wattage: '18W', ColourTemp: '3000K/4000K', BeamAngle: '38°', Finish: 'White',          Description: '355° rotation, 35° tilt gimbal spotlight' }),
    makeProduct({ id: 'gs-002', Codes: 'LLF-GIM-22W', Category: 'Spotlights', Wattage: '22W', ColourTemp: '3000K',       BeamAngle: '24°', Finish: 'Brushed Nickel', Description: 'Precision gimbal, dual adjustable axes' }),
  ],
  'flat-panel': [
    makeProduct({ id: 'fp-001', Codes: 'LLF-PNL-36W-600',  Category: 'Panel Lights', Wattage: '36W', ColourTemp: '4000K',       Dimensions: '600×600mm',  Finish: 'White Frame', Description: 'Backlit LED panel, UGR<19, office grade' }),
    makeProduct({ id: 'fp-002', Codes: 'LLF-PNL-40W-1200', Category: 'Panel Lights', Wattage: '40W', ColourTemp: '3000K/4000K', Dimensions: '1200×300mm', Finish: 'White Frame', Description: 'Linear panel for corridor applications' }),
  ],
  'edge-lit-panel': [
    makeProduct({ id: 'el-001', Codes: 'LLF-EDGE-30W', Category: 'Panel Lights', Wattage: '30W', ColourTemp: '4000K', Dimensions: '600×600mm', Finish: 'White', Description: 'Edge-lit panel, ultra thin 10mm profile' }),
  ],
  'back-lit-panel': [
    makeProduct({ id: 'bl2-001', Codes: 'LLF-BACK-40W', Category: 'Panel Lights', Wattage: '40W', ColourTemp: '3000K/4000K', Dimensions: '600×600mm', Finish: 'White', Description: 'Backlit panel, even luminance, Ra80' }),
  ],
  '1-phase-track': [
    makeProduct({ id: 'tr-001', Codes: 'LLF-TR1-15W', Category: 'Track Lights', Wattage: '15W', ColourTemp: '3000K/4000K', BeamAngle: '38°', Finish: 'White',        Description: '1-phase track spotlight, adjustable' }),
    makeProduct({ id: 'tr-002', Codes: 'LLF-TR1-25W', Category: 'Track Lights', Wattage: '25W', ColourTemp: '3000K',       BeamAngle: '24°', Finish: 'Matt Black',   Description: 'Retail track light, Ra95' }),
    makeProduct({ id: 'tr-003', Codes: 'LLF-TR1-30W', Category: 'Track Lights', Wattage: '30W', ColourTemp: '2700K/3000K', BeamAngle: '15°', Finish: 'Brushed Gold', Description: 'High accent track with narrow optic' }),
  ],
  '3-phase-track': [
    makeProduct({ id: 'tr3-001', Codes: 'LLF-TR3-35W', Category: 'Track Lights', Wattage: '35W', ColourTemp: '3000K/4000K', BeamAngle: '24°', Finish: 'White',      Description: '3-phase track head, high output' }),
    makeProduct({ id: 'tr3-002', Codes: 'LLF-TR3-50W', Category: 'Track Lights', Wattage: '50W', ColourTemp: '3000K',       BeamAngle: '15°', Finish: 'Matt Black', Description: 'Commercial 3-phase, narrow beam optic' }),
  ],
  'magnetic-track': [
    makeProduct({ id: 'mt-001', Codes: 'LLF-MAG-8W',  Category: 'Track Lights', Wattage: '8W',  ColourTemp: '3000K/4000K', BeamAngle: '30°', Finish: 'White',      Description: 'Magnetic track spotlight, 48V system' }),
    makeProduct({ id: 'mt-002', Codes: 'LLF-MAG-12W', Category: 'Track Lights', Wattage: '12W', ColourTemp: '3000K',       BeamAngle: '24°', Finish: 'Matt Black', Description: 'Magnetic graze light, side-emitting' }),
  ],
  'led-strip': [
    makeProduct({ id: 'ls-001', Codes: 'LLF-STR-2835-24V', Category: 'Strip Lights', Wattage: '9.6W/m',  ColourTemp: '3000K/4000K/5000K', Finish: 'Flexible PCB', Description: '2835 SMD, 120LEDs/m, CRI>90' }),
    makeProduct({ id: 'ls-002', Codes: 'LLF-STR-5630-24V', Category: 'Strip Lights', Wattage: '14.4W/m', ColourTemp: '3000K/4000K',       Finish: 'Flexible PCB', Description: 'High output 5630 strip for cove lighting' }),
  ],
  'neon-flex': [
    makeProduct({ id: 'nf-001', Codes: 'LLF-NEON-10W', Category: 'Strip Lights', Wattage: '10W/m', ColourTemp: '3000K', Finish: 'Silicone', Description: 'Neon flex round profile, IP67' }),
  ],
  'aluminium-profile': [
    makeProduct({ id: 'ap-001', Codes: 'LLF-PRF-RECESS-2M',  Category: 'Strip Lights', Dimensions: '2000×13×8mm',  Finish: 'Anodised Silver',       Description: 'Recessed aluminium profile with opal diffuser' }),
    makeProduct({ id: 'ap-002', Codes: 'LLF-PRF-SURFACE-2M', Category: 'Strip Lights', Dimensions: '2000×17×8mm',  Finish: 'Anodised Silver/Black', Description: 'Surface mount profile, wide diffuser' }),
  ],
  'flush-ceiling': [
    makeProduct({ id: 'fc-001', Codes: 'LLF-CEIL-18W', Category: 'Ceiling Lights', Wattage: '18W', ColourTemp: '3000K/4000K', Dimensions: 'Ø300mm', Finish: 'White', Description: 'Flush mount LED ceiling light, dimmable' }),
    makeProduct({ id: 'fc-002', Codes: 'LLF-CEIL-24W', Category: 'Ceiling Lights', Wattage: '24W', ColourTemp: '3000K', Dimensions: 'Ø400mm', Finish: 'Matt Black', Description: 'Round flush light, architectural look' }),
  ],
  'pendant-ceiling': [
    makeProduct({ id: 'pc-001', Codes: 'LLF-PND-LED-15W', Category: 'Ceiling Lights', Wattage: '15W', ColourTemp: '2700K/3000K', Finish: 'Brushed Gold', Description: 'Pendant ceiling fixture, adjustable cord' }),
  ],
  'sconce': [
    makeProduct({ id: 'sc-001', Codes: 'LLF-WL-SCONCE-8W',  Category: 'Wall Lights', Wattage: '8W',  ColourTemp: '3000K',       Finish: 'Matt Black',  Description: 'Modern wall sconce, up/down light' }),
    makeProduct({ id: 'sc-002', Codes: 'LLF-WL-SCONCE-12W', Category: 'Wall Lights', Wattage: '12W', ColourTemp: '2700K/3000K', Finish: 'Brushed Gold', Description: 'Luxury wall sconce, dimmable' }),
  ],
  'wall-washer-indoor': [
    makeProduct({ id: 'ww-001', Codes: 'LLF-WW-15W', Category: 'Wall Lights', Wattage: '15W', ColourTemp: '3000K/4000K', BeamAngle: '45°', Finish: 'White', Description: 'Recessed wall washer, linear aperture' }),
  ],
  'outdoor-bulkhead': [
    makeProduct({ id: 'ob-001', Codes: 'LLF-BLK-10W', Category: 'Outdoor Wall', Wattage: '10W', ColourTemp: '4000K', Finish: 'Grey', Description: 'IP65 bulkhead, polycarbonate diffuser' }),
    makeProduct({ id: 'ob-002', Codes: 'LLF-BLK-15W', Category: 'Outdoor Wall', Wattage: '15W', ColourTemp: '4000K', Finish: 'Dark Anthracite', Description: 'Heavy duty IP66 bulkhead' }),
  ],
  'outdoor-wall-washer': [
    makeProduct({ id: 'oww-001', Codes: 'LLF-OWW-20W', Category: 'Outdoor Wall', Wattage: '20W', ColourTemp: '3000K/4000K', BeamAngle: '60°', Finish: 'Black', Description: 'IP65 outdoor wall washer, grazing effect' }),
  ],
  'spike-light': [
    makeProduct({ id: 'sk-001', Codes: 'LLF-SPK-5W',  Category: 'Landscape Lights', Wattage: '5W',  ColourTemp: '3000K',       BeamAngle: '15°', Finish: 'Black',       Description: 'IP67 spike light for garden uplighting' }),
    makeProduct({ id: 'sk-002', Codes: 'LLF-SPK-10W', Category: 'Landscape Lights', Wattage: '10W', ColourTemp: '3000K/4000K', BeamAngle: '24°', Finish: 'Dark Bronze', Description: 'Heavy duty spike with adjustable head' }),
  ],
  'bollard-light': [
    makeProduct({ id: 'bl-001', Codes: 'LLF-BOL-8W-600',  Category: 'Landscape Lights', Wattage: '8W',  ColourTemp: '3000K', Dimensions: '600mm H',  Finish: 'Dark Anthracite', Description: 'IP65 path bollard, 360° illumination' }),
    makeProduct({ id: 'bl-002', Codes: 'LLF-BOL-12W-800', Category: 'Landscape Lights', Wattage: '12W', ColourTemp: '3000K', Dimensions: '800mm H',  Finish: 'Corten Steel',    Description: 'Architectural bollard with louvred top' }),
  ],
  'path-light': [
    makeProduct({ id: 'pl-001', Codes: 'LLF-PATH-6W', Category: 'Landscape Lights', Wattage: '6W', ColourTemp: '3000K', Finish: 'Stainless Steel', Description: 'Low mushroom path light, IP67' }),
  ],
  'recessed-step': [
    makeProduct({ id: 'rs-001', Codes: 'LLF-STEP-REC-3W', Category: 'Step Lights', Wattage: '3W', ColourTemp: '3000K', Finish: 'Satin Nickel', Description: 'Recessed LED step light, IP54' }),
    makeProduct({ id: 'rs-002', Codes: 'LLF-STEP-REC-5W', Category: 'Step Lights', Wattage: '5W', ColourTemp: '3000K', Finish: 'Matt Black',   Description: 'Wide aperture recessed step, side-emitting' }),
  ],
  'inground-uplight': [
    makeProduct({ id: 'iu-001', Codes: 'LLF-IGR-10W', Category: 'Underground Lights', Wattage: '10W', ColourTemp: '3000K/4000K', BeamAngle: '24°', Finish: 'Stainless Steel', Description: 'IP67 inground uplight, tempered glass' }),
    makeProduct({ id: 'iu-002', Codes: 'LLF-IGR-20W', Category: 'Underground Lights', Wattage: '20W', ColourTemp: '3000K',       BeamAngle: '15°', Finish: 'Stainless Steel', Description: 'High-load drive-over inground fixture' }),
  ],
  'pool-light': [
    makeProduct({ id: 'pw-001', Codes: 'LLF-POOL-18W', Category: 'Underwater Lights', Wattage: '18W', ColourTemp: 'RGB+W', Finish: 'White', Description: 'IP68 pool light, RGBW colour changing' }),
    makeProduct({ id: 'pw-002', Codes: 'LLF-POOL-12W', Category: 'Underwater Lights', Wattage: '12W', ColourTemp: '3000K', Finish: 'White', Description: 'Warm white pool fixture, 12V DC' }),
  ],
  'led-flood': [
    makeProduct({ id: 'fl-001', Codes: 'LLF-FLD-50W',  Category: 'Flood Lights', Wattage: '50W',  ColourTemp: '4000K/5000K', BeamAngle: '120°', Finish: 'Grey',  Description: 'IP65 LED flood, die-cast aluminium' }),
    makeProduct({ id: 'fl-002', Codes: 'LLF-FLD-100W', Category: 'Flood Lights', Wattage: '100W', ColourTemp: '5000K',       BeamAngle: '120°', Finish: 'Grey',  Description: 'High-power flood for perimeter lighting' }),
    makeProduct({ id: 'fl-003', Codes: 'LLF-FLD-200W', Category: 'Flood Lights', Wattage: '200W', ColourTemp: '4000K/5000K', BeamAngle: '90°',  Finish: 'Black', Description: 'Stadium-grade narrow beam flood' }),
  ],
  'recessed-linear': [
    makeProduct({ id: 'rl-001', Codes: 'LLF-LIN-REC-20W', Category: 'Architectural', Wattage: '20W/m', ColourTemp: '3000K/4000K', Dimensions: '1200mm', Finish: 'White/Black',  Description: 'Trimless recessed linear, seamless join' }),
    makeProduct({ id: 'rl-002', Codes: 'LLF-LIN-REC-30W', Category: 'Architectural', Wattage: '30W/m', ColourTemp: '2700K/3000K', Dimensions: '600/1200mm', Finish: 'Plaster White', Description: 'Plaster-in linear, micro-optic diffuser' }),
  ],
  'surface-linear': [
    makeProduct({ id: 'sl-001', Codes: 'LLF-LIN-SUR-25W', Category: 'Architectural', Wattage: '25W/m', ColourTemp: '3000K/4000K', Dimensions: '1200mm', Finish: 'Anodised Silver', Description: 'Surface mount linear, continuous run' }),
  ],
  'cove-lighting': [
    makeProduct({ id: 'cl-001', Codes: 'LLF-COVE-15W', Category: 'Architectural', Wattage: '15W/m', ColourTemp: '2700K/3000K/4000K', Finish: 'Aluminium', Description: 'Wide-angle cove LED for indirect washing' }),
  ],
  'grazing-light': [
    makeProduct({ id: 'gl-001', Codes: 'LLF-GRAZE-12W', Category: 'Architectural', Wattage: '12W', ColourTemp: '3000K', BeamAngle: '10°', Finish: 'Dark Bronze', Description: 'Wall grazer for texture accentuation, IP65' }),
  ],
  'decorative-pendant': [
    makeProduct({ id: 'dp-001', Codes: 'LLF-PND-E27-BK',  Category: 'Decorative', Finish: 'Matt Black',   Description: 'Industrial pendant with E27 socket, adjustable cord' }),
    makeProduct({ id: 'dp-002', Codes: 'LLF-PND-E27-GLD', Category: 'Decorative', Finish: 'Brushed Gold', Description: 'Globe pendant, decorative filament compatible' }),
    makeProduct({ id: 'dp-003', Codes: 'LLF-PND-LED-10W', Category: 'Decorative', Wattage: '10W', ColourTemp: '2700K', Finish: 'Smoked Glass', Description: 'Integrated LED pendant, dimmable' }),
  ],
  'cluster-pendant': [
    makeProduct({ id: 'cp-001', Codes: 'LLF-CLUST-5H', Category: 'Decorative', Finish: 'Brass', Description: '5-head cluster pendant, adjustable heights' }),
  ],
  'crystal-chandelier': [
    makeProduct({ id: 'cc2-001', Codes: 'LLF-CHRYS-60W', Category: 'Decorative', Wattage: '60W', ColourTemp: '2700K', Finish: 'Chrome/Crystal', Description: 'Modern crystal chandelier, 900mm span' }),
  ],
  'table-lamp': [
    makeProduct({ id: 'tl-001', Codes: 'LLF-TBL-E27-BK', Category: 'Decorative', Finish: 'Matt Black', Description: 'Bedside table lamp, E27 socket, fabric shade' }),
    makeProduct({ id: 'tl-002', Codes: 'LLF-TBL-LED-8W', Category: 'Decorative', Wattage: '8W', ColourTemp: '2700K', Finish: 'Brass', Description: 'Integrated LED table lamp, touch dimmer' }),
  ],
  'wifi-downlight': [
    makeProduct({ id: 'wd-001', Codes: 'LLF-SWT-DL-10W', Category: 'Smart Lighting', Wattage: '10W', ColourTemp: 'Tunable 2700K–6500K', BeamAngle: '38°', Finish: 'White',  Description: 'Wi-Fi tunable downlight, voice control' }),
    makeProduct({ id: 'wd-002', Codes: 'LLF-SWT-DL-15W', Category: 'Smart Lighting', Wattage: '15W', ColourTemp: 'RGBW + Tunable',      BeamAngle: '38°', Finish: 'White',  Description: 'Smart RGBW downlight, Zigbee + Wi-Fi' }),
  ],
  'wifi-strip': [
    makeProduct({ id: 'ws-001', Codes: 'LLF-SWT-STR-RGBW', Category: 'Smart Lighting', Wattage: '12W/m', ColourTemp: 'RGBW', Finish: 'Flexible PCB', Description: 'RGBW smart strip, app controlled' }),
  ],
  'dali-driver': [
    makeProduct({ id: 'dd2-001', Codes: 'LLF-DALI-30W', Category: 'Smart Lighting', Wattage: '30W', Finish: 'Metal', Description: 'DALI2 compliant driver, push-dim fallback' }),
  ],
  'pir-light': [
    makeProduct({ id: 'pir-001', Codes: 'LLF-PIR-12W', Category: 'Smart Lighting', Wattage: '12W', ColourTemp: '4000K', Finish: 'White', Description: 'Built-in PIR motion sensor, 8m range' }),
  ],
  'decorative-fan': [
    makeProduct({ id: 'df-001', Codes: 'LLF-FAN-52-DEC', Category: 'Fans with Lights', Dimensions: '52" blade', Finish: 'Brushed Nickel', Description: 'Decorative ceiling fan with 3-light kit, 3 speeds' }),
    makeProduct({ id: 'df-002', Codes: 'LLF-FAN-48-DEC', Category: 'Fans with Lights', Dimensions: '48" blade', Finish: 'Antique Bronze', Description: 'Ornate fan with dimmable warm-white fixture' }),
  ],
  'modern-fan': [
    makeProduct({ id: 'mf-001', Codes: 'LLF-FAN-52-MOD', Category: 'Fans with Lights', Dimensions: '52" blade', Finish: 'Matt Black', Description: 'Minimalist fan with integrated LED panel' }),
  ],
  'dc-fan': [
    makeProduct({ id: 'dc-001', Codes: 'LLF-FAN-DC-52', Category: 'Fans with Lights', Dimensions: '52" blade', Finish: 'White', Description: 'DC motor, 6 speeds, ultra-quiet, 35W' }),
  ],
  'constant-current': [
    makeProduct({ id: 'cc-001', Codes: 'LLF-DRV-350mA-20W', Category: 'Accessories', Wattage: '20W', Finish: 'Metal', Description: 'IP20 constant current driver, 350mA output' }),
    makeProduct({ id: 'cc-002', Codes: 'LLF-DRV-700mA-40W', Category: 'Accessories', Wattage: '40W', Finish: 'Metal', Description: 'IP67 waterproof driver, 700mA outdoor use' }),
  ],
  'constant-voltage': [
    makeProduct({ id: 'cv-001', Codes: 'LLF-DRV-24V-60W',  Category: 'Accessories', Wattage: '60W',  Finish: 'Metal', Description: '24V constant voltage, IP20, for strips' }),
    makeProduct({ id: 'cv-002', Codes: 'LLF-DRV-24V-100W', Category: 'Accessories', Wattage: '100W', Finish: 'Metal', Description: '24V constant voltage, IP67 outdoor' }),
  ],
  'dimmable-driver': [
    makeProduct({ id: 'dd-001', Codes: 'LLF-DRV-DALI-30W',  Category: 'Accessories', Wattage: '30W', Finish: 'Metal', Description: 'DALI dimmable driver, 0-10V compatible' }),
    makeProduct({ id: 'dd-002', Codes: 'LLF-DRV-TRIAC-50W', Category: 'Accessories', Wattage: '50W', Finish: 'Metal', Description: 'Triac/phase cut dimmable driver' }),
  ],
  'phase-dimmer': [
    makeProduct({ id: 'pd-001', Codes: 'LLF-DIM-400W', Category: 'Accessories', Wattage: '400W max', Finish: 'White', Description: 'Trailing edge phase dimmer, rotary' }),
  ],
  'track-adapter': [
    makeProduct({ id: 'ta-001', Codes: 'LLF-TRK-ADP-1PH', Category: 'Accessories', Finish: 'White/Black', Description: '1-phase track adapter, fits all LLF track heads' }),
    makeProduct({ id: 'ta-002', Codes: 'LLF-TRK-ADP-3PH', Category: 'Accessories', Finish: 'White/Black', Description: '3-phase track adapter, universal mounting' }),
  ],
}

export function getProductsByType(typeId: string): Product[] {
  return MOCK_PRODUCTS_BY_TYPE[typeId] ?? []
}

/** All products under a category (aggregates all subcategories and types) */
export function getProductsByCategory(categoryId: string): Product[] {
  const cat = TAXONOMY.find(c => c.id === categoryId)
  if (!cat) return []
  return cat.subcategories.flatMap(sub =>
    sub.types.flatMap(type => getProductsByType(type.id))
  )
}

/** All products under a subcategory (aggregates all types within it) */
export function getProductsBySubcategory(subcategoryId: string): Product[] {
  for (const cat of TAXONOMY) {
    const sub = cat.subcategories.find(s => s.id === subcategoryId)
    if (sub) {
      return sub.types.flatMap(type => getProductsByType(type.id))
    }
  }
  return []
}
