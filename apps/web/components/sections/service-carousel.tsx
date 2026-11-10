"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, cn } from "@shafiq-info/ui";
import { ServiceIcon } from "@/components/common/service-icon";
import { handleSpotlightMove } from "@/lib/spotlight";
import type { Service } from "@shafiq-info/types";

const PAGE_SIZE = 2;

const NAV_BUTTON_CLASSES =
  "inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-foreground-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function ServiceCarousel({ services }: { services: Service[] }) {
  const pageCount = Math.ceil(services.length / PAGE_SIZE);
  const [[page, direction], setState] = useState<[number, number]>([0, 0]);
  const prefersReducedMotion = useReducedMotion();
  if (services.length === 0) return null;

  const start = page * PAGE_SIZE;
  const visible = services.slice(start, start + PAGE_SIZE);

  function go(delta: number) {
    setState(([p]) => [(p + delta + pageCount) % pageCount, delta]);
  }

  return (
    <div>
      <div className="relative -m-2 overflow-hidden p-2">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            initial={{ x: direction >= 0 ? 80 : -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction >= 0 ? -80 : 80, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-6 sm:grid-cols-2"
          >
            {visible.map((service) => (
              <Link key={service.slug} href={`/services/${service.slug}`}>
                <Card
                  className="min-h-50"
                  style={{ "--spotlight-size": "260px" } as React.CSSProperties}
                  onMouseMove={handleSpotlightMove}
                >
                  <div className="spotlight-effect" aria-hidden="true" />
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <ServiceIcon icon={service.icon} />
                        <CardTitle>{service.title}</CardTitle>
                      </div>
                     
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground-muted">{service.shortDescription}</p>
                  </CardContent>
                </Card>
              </Link>
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
                aria-label={`Show services page ${i + 1}`}
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
              aria-label="Previous services"
              onClick={() => go(-1)}
              className={NAV_BUTTON_CLASSES}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next services"
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
