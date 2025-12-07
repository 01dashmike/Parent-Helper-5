/**
 * Content Security Policy configuration
 * Compatible with Stripe, Supabase, and Unsplash
 */

export function generateCSP(nonce?: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "";
  const stripeHost = "js.stripe.com";
  const unsplashHost = "images.unsplash.com";
  const openStreetMapHost = "tile.openstreetmap.org";

  // Nonce for inline scripts (if provided)
  const nonceSrc = nonce ? `'nonce-${nonce}'` : "";

  const directives = [
    // Default source - only same origin
    "default-src 'self'",

    // Scripts - allow self, Stripe, Supabase, and nonce for inline scripts
    `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://${stripeHost} https://${supabaseHost} ${nonceSrc}`,

    // Styles - allow self, inline styles (for Tailwind), and external fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Images - allow self, data URIs, Supabase storage, Unsplash, OpenStreetMap
    `img-src 'self' data: blob: https://${supabaseHost} https://${unsplashHost} https://${openStreetMapHost} https://*.openstreetmap.org`,

    // Fonts - allow self, Google Fonts, and data URIs
    "font-src 'self' data: https://fonts.gstatic.com",

    // Connect - allow self, Supabase, Stripe API, OpenAI
    `connect-src 'self' https://${supabaseHost} https://api.stripe.com https://api.openai.com wss://${supabaseHost}`,

    // Frames - allow Stripe Checkout and Supabase Auth
    `frame-src 'self' https://${stripeHost} https://checkout.stripe.com https://${supabaseHost}`,

    // Media - allow self and data URIs
    "media-src 'self' data: blob:",

    // Objects - deny all
    "object-src 'none'",

    // Base URI - self only
    "base-uri 'self'",

    // Form actions - self only
    "form-action 'self'",

    // Frame ancestors - deny (prevent clickjacking)
    "frame-ancestors 'none'",

    // Upgrade insecure requests in production
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ];

  return directives.join("; ");
}

/**
 * Generate a nonce for inline scripts
 */
export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

