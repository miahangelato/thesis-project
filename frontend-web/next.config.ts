import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* React Compiler */
  reactCompiler: true,

  /* Security Headers */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // DNS Prefetch Control
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          // Strict Transport Security (HSTS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME-sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // XSS Protection
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Referrer Policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions Policy
          {
            key: "Permissions-Policy",
            value: "camera=(self), geolocation=(), microphone=()",
          },
          // Content Security Policy (CSP)
          {
            key: "Content-Security-Policy",
            value:
              process.env.NODE_ENV === "production"
                ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: http://localhost:5000 http://127.0.0.1:5000 ws://localhost:5000 ws://127.0.0.1:5000; frame-src https://www.google.com; frame-ancestors 'none';"
                : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http: https:; font-src 'self' data:; connect-src 'self' http: https: ws:; frame-src http://localhost:* https://www.google.com; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },

  /* Production Optimizations */
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression

  /* Environment Variables (for type checking) */
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SCANNER_URL: process.env.NEXT_PUBLIC_SCANNER_URL,
  },
};

export default nextConfig;
