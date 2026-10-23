import { redirect } from "next/navigation";
import { adminSession } from "@/lib/mari/auth";
import { Home } from "@/components/mari/site";
import { searchCatalog } from "@/lib/mari/catalog";
import { PreviewTools } from "@/components/mari/preview-tools";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page() { if (!(await adminSession())) redirect("/admin/login"); const data = await searchCatalog(new URLSearchParams({ featured: "true" })); return <><Home featured={data.items.slice(0, 6)}/><PreviewTools/></>; }
