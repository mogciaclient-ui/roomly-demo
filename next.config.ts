import type {NextConfig} from "next";

const contentSecurityPolicy=[
 "default-src 'self'",
 "base-uri 'self'",
 "object-src 'none'",
 "frame-ancestors 'none'",
 "form-action 'self'",
 "script-src 'self' 'unsafe-inline'",
 "style-src 'self' 'unsafe-inline'",
 "img-src 'self' data: blob:",
 "font-src 'self' data:",
 "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com",
 "frame-src 'self' https://roomly-demo.firebaseapp.com",
 "worker-src 'self' blob:",
 "manifest-src 'self'",
 "upgrade-insecure-requests",
].join("; ");

const securityHeaders=[
 {key:"Content-Security-Policy",value:contentSecurityPolicy},
 {key:"Referrer-Policy",value:"no-referrer"},
 {key:"X-Content-Type-Options",value:"nosniff"},
 {key:"X-Frame-Options",value:"DENY"},
 {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()"},
 {key:"Cross-Origin-Opener-Policy",value:"same-origin-allow-popups"},
 {key:"Cross-Origin-Resource-Policy",value:"same-origin"},
 {key:"Origin-Agent-Cluster",value:"?1"},
 {key:"X-DNS-Prefetch-Control",value:"off"},
 {key:"Strict-Transport-Security",value:"max-age=63072000; includeSubDomains; preload"},
];

const nextConfig:NextConfig={
 poweredByHeader:false,
 productionBrowserSourceMaps:false,
 experimental:{serverSourceMaps:false},
 async headers(){return[
  {source:"/:path*",headers:securityHeaders},
  {source:"/api/:path*",headers:[{key:"Cache-Control",value:"private, no-store, max-age=0"},{key:"Pragma",value:"no-cache"}]},
  {source:"/r/:path*",headers:[{key:"Cache-Control",value:"private, no-store, max-age=0"}]},
  {source:"/console/:path*",headers:[{key:"Cache-Control",value:"private, no-store, max-age=0"}]},
 ];},
};

export default nextConfig;
