import { RevealGroup } from "@/components/common/reveal";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticleRow } from "@/components/articles/article-row";
import type { Article } from "@shafiq-info/types";

export function ArticlesGrid({ featured, rest }: { featured: Article; rest: Article[] }) {
  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <ArticleCard article={featured} featured />

      <div className="flex flex-col border-b border-border">
        <RevealGroup>
          {rest.map((article, index) => (
            <ArticleRow key={article.slug} article={article} index={index} />
          ))}
        </RevealGroup>
      </div>
    </div>
  );
}
