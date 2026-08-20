/** @type {import('next').NextConfig} */

// Content-Security-Policy, expressed as an array so each directive can carry
// an inline comment explaining why it's there. Joined into one header below.
const cspDirectives = [
  // Default: only load anything (scripts, styles, fonts, etc.) from our own origin
  // unless a more specific directive below says otherwise.
  `default-src 'self'`,

  // 'unsafe-inline' is required here because next-themes injects a small inline
  // <script> (set in app/layout.tsx) that applies the saved theme before React
  // hydrates, to avoid a flash of the wrong theme. A stricter, nonce-based CSP
  // is possible (next-themes' ThemeProvider accepts a `nonce` prop) but needs
  // middleware to mint a per-request nonce - a bigger change than this file.
  `script-src 'self' 'unsafe-inline'`,

  // 'unsafe-inline' is required because the app relies heavily on inline
  // style={{ ... }} attributes for dynamic values (drag positions, scene tints,
  // weather animation offsets) and components/ui/chart.tsx injects a <style>
  // tag via dangerouslySetInnerHTML for chart theming.
  `style-src 'self' 'unsafe-inline'`,

  // 'self' for the app's own images/icons, images.unsplash.com for the scene
  // backdrops (lib/scenes.ts), data: for the small inline SVG/base64 assets
  // Next.js and some UI components use.
  `img-src 'self' https://images.unsplash.com data:`,

  // next/font self-hosts Inter at build time, so fonts are served from our own
  // origin - no external font host needs to be allowed.
  `font-src 'self' data:`,

  // 'self' for the app itself, api.open-meteo.com for the live weather feature
  // (lib/weather.ts calls it directly from the browser).
  `connect-src 'self' https://api.open-meteo.com`,

  // No <object>/<embed>/<applet> content anywhere in this app.
  `object-src 'none'`,

  // Blocks a common CSP-bypass technique (injecting a <base> tag to hijack
  // relative URLs).
  `base-uri 'self'`,

  // The app has no server-rendered <form action> endpoints to protect, but this
  // is a safe default that costs nothing.
  `form-action 'self'`,

  // Belt-and-suspenders with the X-Frame-Options header below: nothing may
  // embed this app in an <iframe>.
  `frame-ancestors 'none'`,

  // Auto-upgrade any accidental http:// sub-resource reference to https://.
  `upgrade-insecure-requests`,
]

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
  // Redundant with frame-ancestors 'none' above, kept for older browsers that
  // don't support CSP's frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  // Stops the browser from "sniffing" a response into a different MIME type
  // than the server declared (a classic vector for stored-XSS via uploads).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Sends the full URL to same-origin requests/links, but only the origin
  // (no path/query) cross-origin - avoids leaking event titles, search
  // queries, etc. via the Referer header when a link is clicked.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deny every sensitive browser capability by default except geolocation,
  // which the live-weather feature needs - and even that only for this
  // origin, never for anything embedded in it.
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()",
  },
  // Tells browsers to only ever reach this site over HTTPS for the next two
  // years, including subdomains. (Not submitted to the HSTS preload list -
  // that's a separate, harder-to-reverse opt-in you can make later at
  // https://hstspreload.org once you're confident every subdomain is HTTPS-only.)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
]

const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Apply to every route.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
