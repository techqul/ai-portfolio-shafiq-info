"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@shafiq-info/ui";
import { ArticleRow } from "@/components/articles/article-row";
import type { Article } from "@shafiq-info/types";

const PAGE_SIZE = 3;

const NAV_BUTTON_CLASSES =
  "inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-foreground-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * Related-articles carousel: the home teaser's compact row design, flipped
 * PAGE_SIZE rows at a time with the same motion pattern as ServiceCarousel
 * (dot pagination + chevron arrows).
 */
export function RelatedArticlesCarousel({ articles }: { articles: Article[] }) {
  const pageCount = Math.ceil(articles.length / PAGE_SIZE);
  const [[page, direction], setState] = useState<[number, number]>([0, 0]);
  const prefersReducedMotion = useReducedMotion();
  if (articles.length === 0) return null;

  const start = page * PAGE_SIZE;
  const visible = articles.slice(start, start + PAGE_SIZE);

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
            className="flex flex-col"
          >
            {visible.map((article, index) => (
              <ArticleRow key={article.slug} article={article} index={start + index} />
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
                aria-label={`Show related articles page ${i + 1}`}
                onClick={() => setState([i, i > page ? 1 : -1])}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === page ? "bg-gradient-brand w-6" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous related articles" onClick={() => go(-1)} className={NAV_BUTTON_CLASSES}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" aria-label="Next related articles" onClick={() => go(1)} className={NAV_BUTTON_CLASSES}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
