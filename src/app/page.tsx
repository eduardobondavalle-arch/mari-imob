import { Home } from "@/components/mari/site";
import { searchCatalog } from "@/lib/mari/catalog";
export default async function Page() { const data = await searchCatalog(new URLSearchParams({ featured: "true" })); return <Home featured={data.items.slice(0, 6)}/>; }
