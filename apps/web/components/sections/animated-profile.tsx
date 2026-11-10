"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@shafiq-info/ui";

const MAX_ORBIT_BADGES = 8;
const ORBIT_RADIUS_PERCENT = 54;
/** Degrees left clear at the bottom of the ring for the "Available" pill. */
const BOTTOM_GAP_DEGREES = 110;

/**
 * Evenly distributes `total` badges around the ring, leaving a gap centered
 * on the bottom (180°) clear for the "Available" pill. Angle 0° is straight
 * up, increasing clockwise.
 */
function getOrbitPosition(index: number, total: number) {
  const sweep = 360 - BOTTOM_GAP_DEGREES;
  const start = 180 + BOTTOM_GAP_DEGREES / 2;
  const step = total > 1 ? sweep / (total - 1) : 0;
  const angleDeg = start + index * step;
  const angleRad = (angleDeg * Math.PI) / 180;

  const left = 50 + ORBIT_RADIUS_PERCENT * Math.sin(angleRad);
  const top = 50 - ORBIT_RADIUS_PERCENT * Math.cos(angleRad);

  return { top: `${top}%`, left: `${left}%` };
}

export function AnimatedProfile({
  name,
  available,
  technologies,
}: {
  name: string;
  available: boolean;
  technologies: string[];
}) {
  const badges = technologies.slice(0, MAX_ORBIT_BADGES);
  // These are all continuous (repeat: Infinity) animations — exactly what
  // prefers-reduced-motion is meant to suppress, and the global CSS rule
  // doesn't reach motion's JS-driven animate props. Dropping `animate`
  // entirely leaves each element at its static resting values.
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="mx-auto w-full max-w-60 px-4 sm:max-w-sm sm:px-8">
      <div className="relative aspect-square w-full">
        {/* Ambient glow pulse */}
        <motion.div
          aria-hidden="true"
          className="bg-gradient-brand absolute inset-0 rounded-full opacity-30 blur-3xl"
          animate={prefersReducedMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Rotating gradient ring */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-3 rounded-full"
          style={{
            background: "var(--gradient-brand)",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))",
          }}
          animate={prefersReducedMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        />

        <div className="bg-background-elevated absolute inset-6 overflow-hidden rounded-full border border-border shadow-glow">
          <Image
            src="/images/hero_img.png"
            alt={name}
            fill
            priority
            sizes="(min-width: 640px) 384px, 240px"
            className="object-cover"
          />
        </div>

        {available && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <motion.div
              className="flex items-center gap-1.5 rounded-full border border-border bg-background-elevated px-2.5 py-0.5 shadow-glow sm:px-3 sm:py-1"
              animate={prefersReducedMotion ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="bg-accent relative inline-flex h-2 w-2 rounded-full" />
              </span>
              <span className="text-[10px] font-medium sm:text-xs">Available</span>
            </motion.div>
          </div>
        )}

        {badges.map((tech, index) => (
          <div
            key={tech}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={getOrbitPosition(index, badges.length)}
          >
            <motion.div
              animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }}
              transition={{
                duration: 3 + index * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3,
              }}
            >
              <Badge
                variant="accent"
                className="shadow-glow whitespace-nowrap px-2 py-1 text-xs sm:px-3"
              >
                {tech}
              </Badge>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
