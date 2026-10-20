import { notFound } from "next/navigation";
import Link from "next/link";
import { sharedSelection } from "@/lib/mari/client-service";
import { SelectionPresentation } from "@/components/mari/selection-presentation";
export const metadata = { title: "Uma seleção para compartilhar", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const selection = await sharedSelection((await params).token);
  if (!selection) notFound();
  return (
    <div className="container section">
      {selection.items.length ? (
        <SelectionPresentation
          items={selection.items}
          title={selection.title}
        />
      ) : (
        <div className="empty-state">
          <h2>Nenhum imóvel disponível nesta seleção.</h2>
          <Link className="button" href="/buscar">
            Explorar imóveis
          </Link>
        </div>
      )}
    </div>
  );
}
