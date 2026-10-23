import { redirect } from "next/navigation";
import { Suspense } from "react";
import { adminSession, production } from "@/lib/mari/auth";
import { AdminPanel } from "@/components/mari/admin";
export const metadata = { title: "Administração", robots: { index: false, follow: false } };
export default async function Page() { const auth = await adminSession(); if (!auth?.admin) redirect("/admin/login"); return <Suspense fallback={<p>Carregando painel…</p>}><AdminPanel mustChangePassword={auth.admin.mustChangePassword} production={production()}/></Suspense>; }
