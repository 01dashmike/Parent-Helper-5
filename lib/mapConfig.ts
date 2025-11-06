/**
 * Map Configuration - Parent Helper Brand
 * 
 * Centralized configuration for map markers, clusters, and interactions.
 * Adjust these values to customize the map appearance and behavior.
 */

// ========================================
// BRAND COLORS
// ========================================
// Parent Helper brand palette for consistent styling

export const BRAND_COLORS = {
  // Sage green - primary brand color
  sage: "#9BAE82",
  sageLight: "#A8B8A8",
  sageDark: "#7C8F67",
  
  // Terracotta - accent color for highlights
  terracotta: "#C97C5C",
  terracottaLight: "#D89B85",
  
  // Cream - warm background
  cream: "#F5F3F0",
  creamDark: "#E8E5E0",
  
  // Neutral tones
  charcoal: "#3D3D3D",
  white: "#FFFFFF",
} as const;

// ========================================
// MARKER CONFIGURATION
// ========================================

export const MARKER_CONFIG = {
  // Default marker size (width x height in pixels)
  // Standard Leaflet marker is 25x41
  defaultSize: {
    width: 25,
    height: 41,
  },
  
  // Hovered marker - slightly larger for emphasis
  // Increase by ~12% for subtle hover effect
  hoverSize: {
    width: 28,
    height: 45,
  },
  
  // Selected marker - ~15% larger than default
  // Makes the selected location stand out clearly
  selectedSize: {
    width: 29,
    height: 47,
  },
  
  // Anchor point (where the marker "points" on the map)
  // Adjust if using custom marker images
  defaultAnchor: {
    x: 12,
    y: 41,
  },
  
  hoverAnchor: {
    x: 14,
    y: 45,
  },
  
  selectedAnchor: {
    x: 14,
    y: 47,
  },
  
  // Shadow size - should match marker size
  defaultShadowSize: {
    width: 41,
    height: 41,
  },
  
  hoverShadowSize: {
    width: 45,
    height: 45,
  },
  
  selectedShadowSize: {
    width: 47,
    height: 47,
  },
} as const;

// ========================================
// COLOR FILTERS FOR MARKER STATES
// ========================================
// CSS filter values to colorize markers
// Adjust hue-rotate, saturate, and brightness to match brand colors

export const MARKER_FILTERS = {
  // Hover state - soft sage green
  // hue-rotate: shifts color toward green
  // saturate: reduces color intensity for softer look
  // brightness: slightly brightens for visibility
  hover: "hue-rotate(60deg) saturate(0.7) brightness(1.1)",
  
  // Selected state - deeper sage green
  // More saturated and slightly darker than hover
  selected: "hue-rotate(80deg) saturate(0.9) brightness(0.95)",
} as const;

// ========================================
// ANIMATION CONFIGURATION
// ========================================

export const ANIMATION_CONFIG = {
  // Pulse animation when marker is clicked
  // Duration in milliseconds
  pulseDuration: 600,
  
  // Scale factor at peak of pulse (1.0 = normal size)
  // 1.2 = 20% larger at peak
  pulseScale: 1.2,
  
  // Transition timing for smooth state changes
  // cubic-bezier for natural, polished feel
  transitionTiming: "cubic-bezier(0.4, 0, 0.2, 1)",
  transitionDuration: "0.3s",
  
  // Cluster expansion animation duration
  clusterAnimationDuration: "0.4s",
} as const;

// ========================================
// CLUSTER CONFIGURATION
// ========================================

export const CLUSTER_CONFIG = {
  // Maximum radius (in pixels) to cluster markers
  // Smaller = more granular clusters
  // Larger = fewer, bigger clusters
  maxClusterRadius: 60,
  
  // Thresholds for cluster size variations
  // Adjust to change when clusters grow larger
  smallThreshold: 10,  // < 10 markers = small cluster
  mediumThreshold: 25, // 10-24 markers = medium cluster
                       // >= 25 markers = large cluster
  
  // Cluster icon sizes (in pixels)
  sizes: {
    small: 40,
    medium: 46,
    large: 52,
  },
  
  // Font sizes for cluster count
  fontSizes: {
    small: "14px",
    medium: "15px",
    large: "16px",
  },
  
  // Font weights
  fontWeights: {
    small: 600,
    medium: 600,
    large: 700,
  },
  
  // Background gradients using brand colors
  backgrounds: {
    small: `linear-gradient(135deg, ${BRAND_COLORS.sageLight} 0%, ${BRAND_COLORS.sage} 100%)`,
    medium: `linear-gradient(135deg, ${BRAND_COLORS.sageLight} 0%, ${BRAND_COLORS.sage} 100%)`,
    large: `linear-gradient(135deg, ${BRAND_COLORS.sage} 0%, ${BRAND_COLORS.sageDark} 100%)`,
  },
  
  // Shadow configurations
  shadows: {
    small: `0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 4px rgba(155, 174, 130, 0.2)`,
    medium: `0 3px 10px rgba(0, 0, 0, 0.18), 0 0 0 5px rgba(155, 174, 130, 0.22)`,
    large: `0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 6px rgba(124, 143, 103, 0.25)`,
  },
  
  // Hover shadows (slightly enhanced)
  hoverShadows: {
    small: `0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 6px rgba(155, 174, 130, 0.25)`,
    medium: `0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 6px rgba(155, 174, 130, 0.25)`,
    large: `0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 6px rgba(124, 143, 103, 0.25)`,
  },
  
  // Mobile sizes (slightly larger for better touch targets)
  mobileSizes: {
    small: 44,
    medium: 50,
    large: 56,
  },
} as const;

// ========================================
// MAP INTERACTION SETTINGS
// ========================================

export const MAP_SETTINGS = {
  // Default map center (Winchester, UK)
  defaultCenter: {
    lat: 51.2109,
    lng: -1.4821,
  },
  
  // Default zoom level
  defaultZoom: 11,
  
  // Auto-fit bounds settings
  boundsSettings: {
    padding: [50, 50] as [number, number],
    maxZoom: 13,
  },
  
  // Enable scroll wheel zoom
  scrollWheelZoom: true,
  
  // Cluster behavior
  spiderfyOnMaxZoom: true,      // Spread out markers when fully zoomed
  showCoverageOnHover: false,   // Don't show cluster coverage area on hover
  zoomToBoundsOnClick: true,    // Zoom to cluster contents on click
  chunkedLoading: true,         // Load markers in batches for performance
  animateAddingMarkers: true,   // Animate when markers appear
  removeOutsideVisibleBounds: true, // Only render markers in viewport
} as const;

// ========================================
// TOOLTIP CONFIGURATION
// ========================================

export const TOOLTIP_CONFIG = {
  // Background color (warm cream)
  backgroundColor: BRAND_COLORS.cream,
  
  // Border color (soft sage green)
  borderColor: BRAND_COLORS.sage,
  borderWidth: "1px",
  
  // Text colors
  titleColor: BRAND_COLORS.charcoal,
  subtitleColor: "#6B7280", // slate gray
  
  // Spacing and sizing
  padding: "8px 12px",
  borderRadius: "8px",
  fontSize: "13px",
  lineHeight: "1.4",
  
  // Shadow for depth
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  
  // Z-index to appear above markers
  zIndex: 1000,
} as const;

// ========================================
// LOCALSTORAGE KEYS
// ========================================

export const STORAGE_KEYS = {
  mapPreferences: "parenthelper_map_preferences",
} as const;


