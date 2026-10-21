import { Home } from "@/components/mari/site";
import { homeSuperFeatured, searchCatalog } from "@/lib/mari/catalog";
import { publicNews } from "@/lib/mari/news-service";
export default async function Page() {
  const [data, superFeatured, news] = await Promise.all([
    searchCatalog(new URLSearchParams({ featured: "true" })),
    homeSuperFeatured(),
    publicNews(4),
  ]);
  return <Home featured={data.items.slice(0, 6)} superFeatured={superFeatured} news={news.map((item) => ({ ...item, publishedAt: item.publishedAt.toISOString() }))}/>;
}
