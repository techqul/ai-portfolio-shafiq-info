import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal self-contained server output for the production Docker image
  // (docker/web.Dockerfile) — avoids shipping the full node_modules tree.
  output: "standalone",
  // The production host's image-optimization endpoint (/_next/image) has
  // been measured taking 6+ seconds per request (CPU-starved pod under its
  // Kubernetes/Istio setup — see docs/performance-image-delivery.md) and
  // intermittently 503ing. Source images are already compressed (see that
  // same doc), so serving them directly — no runtime transform — is both
  // faster and immune to that infra issue. Trade-off: no auto responsive
  // srcset / AVIF-WebP conversion.
  images: {
    unoptimized: true,
  },
  // Workspace packages ship raw TS/TSX source, not a prebuilt dist — Next
  // needs to compile them the same way it compiles apps/web's own code.
  transpilePackages: ["@shafiq-info/ui", "@shafiq-info/config", "@shafiq-info/types"],
  // Rewrites barrel imports (`import { X } from "lucide-react"`) to
  // per-icon paths at build time, so only the ~27 icons actually used ship
  // to the browser instead of the whole library's module graph.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
