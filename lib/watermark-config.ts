// Types and defaults only — no sharp import. Safe to import from client-side pages.

export interface WatermarkConfig {
  text: string
  font_size_percent: number   // 1–20, % of image width
  opacity: number             // 0–1
  position: 'center' | 'bottom-right' | 'top-left' | 'tile'
  rotation: number            // -90–90 degrees
  color: string               // hex, e.g. '#FFFFFF'
  shadow_enabled: boolean
  shadow_color: string        // hex, e.g. '#000000'
  font_weight: 'normal' | 'bold'
}

export const DEFAULT_CONFIG: WatermarkConfig = {
  text:              'Eiscafé Simonetti',
  font_size_percent: 7,
  opacity:           0.3,
  position:          'center',
  rotation:          -30,
  color:             '#FFFFFF',
  shadow_enabled:    true,
  shadow_color:      '#000000',
  font_weight:       'bold',
}
