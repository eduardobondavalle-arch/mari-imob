import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { newsBySlug } from "@/lib/mari/news-service";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const news = await newsBySlug((await params).slug);
    return {
      title: news.title,
      description: news.summary,
      openGraph: {
        title: news.title,
        description: news.summary,
        images: news.coverImage ? [{ url: news.coverImage }] : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function Page({ params }: Props) {
  let news;
  try {
    news = await newsBySlug((await params).slug);
  } catch {
    notFound();
  }
  return <article className="container section news-article">
    {news.coverImage && <div className="news-cover"><Image src={news.coverImage} alt={news.title} fill sizes="(max-width: 900px) 100vw, 900px" preload/></div>}
    <p className="eyebrow">{news.city} · {new Date(news.publishedAt).toLocaleDateString("pt-BR")}</p>
    <h1>{news.title}</h1>
    <p className="lead">{news.summary}</p>
    <div className="preserve-lines">{news.content}</div>
    {news.sourceUrl && <a className="button" href={news.sourceUrl} target="_blank" rel="noopener noreferrer">Ver fonte original</a>}
  </article>;
}
