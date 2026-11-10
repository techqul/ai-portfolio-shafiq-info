"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@shafiq-info/ui";
import type { GalleryItem } from "@shafiq-info/types";

const PAGE_SIZE = 3;
const AUTO_ADVANCE_MS = 4000;

const NAV_BUTTON_CLASSES =
  "inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-foreground-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function GalleryCarousel({ items }: { items: GalleryItem[] }) {
  const pageCount = Math.ceil(items.length / PAGE_SIZE);
  const [[page, direction], setState] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  function go(delta: number) {
    setState(([p]) => [(p + delta + pageCount) % pageCount, delta]);
  }

  useEffect(() => {
    if (paused || pageCount <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => go(1), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, pageCount, page]);

  if (items.length === 0) return null;

  const start = page * PAGE_SIZE;
  const visible = items.slice(start, start + PAGE_SIZE);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative -m-2 overflow-hidden p-2">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            initial={{ x: direction >= 0 ? 80 : -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction >= 0 ? -80 : 80, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {visible.map((item) => (
              <div
                key={item.id}
                className="shadow-glow relative aspect-4/3 w-full overflow-hidden rounded-3xl"
              >
                <Image src={item.imageUrl} alt="Gallery photo" fill className="object-cover" />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show gallery page ${i + 1}`}
                onClick={() => setState([i, i > page ? 1 : -1])}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === page ? "bg-gradient-brand w-6" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous images"
              onClick={() => go(-1)}
              className={NAV_BUTTON_CLASSES}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next images"
              onClick={() => go(1)}
              className={NAV_BUTTON_CLASSES}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
