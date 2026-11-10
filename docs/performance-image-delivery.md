# Live-Site Slowness & Image Delivery — Diagnosis & Plan (not yet implemented)

> Captured from a diagnostic session on shafiq.info.bd. Nothing in this
> document has been implemented yet — saved here for later action.

## Context

The live site (shafiq.info.bd) was reported slow, with some images
intermittently failing to show. Live diagnostics (`curl`/`WebFetch` against
the production URL) found:

- **DNS confirms `shafiq.info.bd` → `194.238.18.90`** — the same VPS set up
  in the earlier Phase 9/15 work.
- **But `server: istio-envoy` on every response** — the site runs behind a
  Kubernetes + Istio service mesh, **not** the `docker-compose.prod.yml` +
  GitHub Actions pipeline built earlier in this project. Confirmed with the
  user: Kubernetes/Istio was set up separately on the same VPS, independent
  of the earlier Docker Compose work. That earlier pipeline is effectively
  superseded for this VPS.
- **A single `/_next/image` transform took 6.3s server-side**, confirmed via
  the `x-envoy-upstream-service-time: 6310` response header — for a resize
  of an already-small (612KB) source image. A w=3840 request (synthetic
  stress test) took 11s.
- **Plain static file requests (`/images/hero_img.png`, zero processing)
  intermittently returned 503**, then 200 moments later on retry — while the
  homepage itself (`/`) was consistently fast and healthy across 5 rapid
  requests (0.3–0.6s, all 200).
- The image **source files are already well-optimized** — confirmed via
  `git show --stat` on commit `76f04a6` ("optimize image and scroll"),
  already live in production (the raw static `hero_img.png` served is
  626300 bytes, matching the post-optimization size, not the old 2MB
  original). `sharp: true` is correctly set in `pnpm-workspace.yaml`.

**Conclusion**: this is no longer primarily a code/image-size problem (that
was already fixed and is live). The evidence — slow CPU-bound work,
intermittent failures even on zero-compute static requests, consistently-fine
SSR — points squarely at a **resource-starved pod** under the self-managed
Kubernetes/Istio layer (CPU throttling and/or memory pressure causing
restarts), which only the VPS/cluster owner can fix directly. Still, there is
a real, high-leverage **code-level mitigation**: stop asking that constrained
pod to do expensive on-demand image transforms at all.

**Decisions made (for when this is picked up):**
- **Image delivery: set `images.unoptimized: true`** in `next.config.ts` —
  serves the already-compressed static files directly from `/public`,
  eliminating the `/_next/image` route (and its proven 6+ second,
  failure-prone transform cost) entirely. Trade-off accepted: no automatic
  responsive `srcset` or WebP/AVIF conversion — acceptable since sources are
  already small (most under 450KB, hero 612KB) and reliability matters more
  right now than marginal format savings.
- **Include a Kubernetes/Istio diagnostic + remediation checklist** (below)
  for the user to run themselves, since that's the actual root cause of the
  intermittent 503s and slowness, and the image-delivery fix alone won't
  resolve non-image request failures.

## Changes (when implemented)

### 1. `apps/web/next.config.ts` — disable runtime image optimization

Add an `images` block:

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@shafiq-info/ui", "@shafiq-info/config", "@shafiq-info/types"],
};
```

No other code changes needed — every existing `next/image` usage
(`project-card.tsx`, `animated-profile.tsx`, `header.tsx`, `article-card.tsx`,
`article-row.tsx`, `gallery-carousel.tsx`, `service-media.tsx`,
`footer.tsx`) keeps its current props (`fill`, `sizes`, `priority`, etc.)
unchanged — `unoptimized` only changes how the `src` URL resolves at runtime
(direct static path instead of `/_next/image?url=...`), not the component
API. The earlier `priority` fix and image-compression pass stay exactly as
they are and remain the correct thing to have done — they're what makes
`unoptimized` safe to flip now (small, already-compressed sources) rather
than source-size being plain-served-as-is-huge.

### 2. `apps/web/public/images/` — no changes needed

Already optimized (commit `76f04a6`, verified live). Nothing further
required here.

### 3. Kubernetes/Istio diagnostic checklist (handoff — needs cluster access)

**Diagnose** (run on the VPS, wherever `kubectl` is configured):
```sh
kubectl get pods -A                                   # look for Restarts count, STATUS (CrashLoopBackOff/OOMKilled)
kubectl top pods -A                                    # live CPU/memory usage vs. limits
kubectl describe pod <web-pod-name>                     # Events section: OOMKilled? Throttling? Readiness probe failures?
kubectl logs <web-pod-name> --previous                  # logs from before the last restart, if any
kubectl get deployment <web-deployment> -o yaml | grep -A8 resources   # current requests/limits
kubectl get hpa -A                                      # autoscaling config, if any
free -h && nproc                                        # total VPS capacity vs. what's been allocated
```

**Likely findings**, given the measured symptoms (CPU-bound work taking
10-50x longer than expected + intermittent failures even on zero-compute
requests):
- **CPU/memory limits set too low** for the web deployment — Kubernetes CPU
  limits cause hard throttling (CFS), which explains an image resize taking
  6+ seconds instead of milliseconds. Consider raising to something like
  `requests: {cpu: 250m, memory: 256Mi}` / `limits: {cpu: "1", memory: 512Mi}`
  as a starting point, adjusted to what the VPS can actually spare.
- **Istio sidecar overhead** — the Envoy sidecar injected per-pod has its
  own non-trivial CPU/memory footprint; on a single budget VPS also running
  Postgres, Redis, the API, and istiod's own control-plane, this adds up
  fast. If service-mesh features (mTLS between internal services, traffic
  shaping) aren't actually needed for a small 2-service app, consider
  disabling sidecar injection for this namespace
  (`kubectl label namespace <ns> istio-injection=disabled`, or per-pod
  `sidecar.istio.io/inject: "false"` annotation) to reclaim that overhead.
- **Readiness/liveness probe tuning** — if probes are too aggressive (short
  `periodSeconds`/low `failureThreshold`) relative to how long the app
  actually takes to become ready, Istio will intermittently mark the pod
  unavailable (503) even when it's fine, or route traffic to a pod still
  starting up.
- **Single replica, no redundancy** — if there's only one pod for `web`,
  every restart is a full outage window until it's ready again. With
  `unoptimized: true` removing the heaviest CPU spikes, this should become
  rarer, but isn't eliminated — more RAM/CPU headroom or a second replica
  (if the VPS has spare capacity) would close the remaining gap.

## Verification (when implemented)

```
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build
pnpm --filter web dev
curl -s http://localhost:3000 | grep -o '"/images/[^"]*"' | head -5   # confirm image src URLs are direct /images/... paths, not /_next/image?url=...
```

After deploying (the user's own k8s deploy process — not controlled by
this repo's tooling):
```
curl -s -o /dev/null -w "status:%{http_code} time:%{time_total}s\n" https://shafiq.info.bd/images/hero_img.png
curl -s -o /dev/null -w "status:%{http_code} time:%{time_total}s\n" https://shafiq.info.bd/images/projects/alahazrat/banner_img.png
# repeat each 5x to confirm no more intermittent 503s and sub-second response times
```

## Next step (when picked back up)

Make the one-line `next.config.ts` change first (immediate, low-risk,
directly addresses the proven 6+ second transform cost) and verify locally.
Hand off the Kubernetes diagnostic checklist for whoever manages the cluster
to run against the live VPS — that's the only way to confirm and fix the
root cause of the intermittent 503s on non-image requests, which the code
change alone won't fully resolve.
