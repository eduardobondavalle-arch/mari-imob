import { Home } from "@/components/mari/site";
import { homeFeatured, homeSuperFeatured } from "@/lib/mari/catalog";
import { publicNews } from "@/lib/mari/news-service";
export default async function Page() {
  const [featured, superFeatured, news] = await Promise.all([
    homeFeatured(),
    homeSuperFeatured(),
    publicNews(4),
  ]);
  return (
    <Home
      featured={featured}
      superFeatured={superFeatured}
      news={news.map((item) => ({
        ...item,
        publishedAt: item.publishedAt.toISOString(),
      }))}
    />
  );
}
