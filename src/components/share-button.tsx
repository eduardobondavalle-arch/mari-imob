"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";
export function ShareButton({ title }: { title: string }) {
  const [status, setStatus] = useState("");
  return (
    <div className="share-control">
      <button
        className="button button-outline"
        onClick={async () => {
          const data = {
            title: `Demonstração Adim — ${title}`,
            text: "Imóvel fictício em ambiente de demonstração.",
            url: window.location.href,
          };
          try {
            if (navigator.share) await navigator.share(data);
            else {
              await navigator.clipboard.writeText(
                `${data.title}\n${data.text}\n${data.url}`,
              );
              setStatus("Link copiado!");
            }
          } catch (e) {
            if (e instanceof Error && e.name === "AbortError") return;
            setStatus(
              "Não foi possível compartilhar. Copie o endereço do navegador.",
            );
          }
        }}
      >
        <Share2 size={16} /> Compartilhar
      </button>
      <span role="status">{status}</span>
    </div>
  );
}
