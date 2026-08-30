import type { NextConfig } from "next";

const publicSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key:"Content-Security-Policy", value:csp },
  { key:"X-Content-Type-Options", value:"nosniff" },
  { key:"Referrer-Policy", value:"strict-origin-when-cross-origin" },
  { key:"X-Frame-Options", value:"DENY" },
  { key:"Permissions-Policy", value:"camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key:"Strict-Transport-Security", value:"max-age=63072000; includeSubDomains; preload" },
  { key:"Cross-Origin-Opener-Policy", value:"same-origin" },
  { key:"Cross-Origin-Resource-Policy", value:"same-site" },
  { key:"X-DNS-Prefetch-Control", value:"off" },
  { key:"X-Permitted-Cross-Domain-Policies", value:"none" },
];

const nextConfig:NextConfig={
  poweredByHeader:false,
  env:{ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:publicSupabaseKey },
  images:{ unoptimized:true },
  async headers(){return [
    { source:"/:path*", headers:securityHeaders },
    { source:"/login", headers:[{key:"Cache-Control",value:"private, no-store, max-age=0"}] },
    { source:"/register", headers:[{key:"Cache-Control",value:"private, no-store, max-age=0"}] },
    { source:"/reset-password", headers:[{key:"Cache-Control",value:"private, no-store, max-age=0"}] },
    { source:"/dashboard/:path*", headers:[{key:"Cache-Control",value:"private, no-store, max-age=0"}] },
    { source:"/admin/:path*", headers:[{key:"Cache-Control",value:"private, no-store, max-age=0"}] },
  ];},
};
export default nextConfig;
