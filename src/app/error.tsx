"use client";
import Link from "next/link";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container error-state">
      <span className="eyebrow">VAMOS TENTAR NOVAMENTE</span>
      <h1>
        Não conseguimos carregar
        <br />
        esta página agora.
      </h1>
      <p>Você pode tentar novamente ou falar com a Mari.</p>
      <div>
        <button className="button button-dark" onClick={() => reset()}>
          Tentar novamente
        </button>
        <Link href="/contato" className="button button-outline">
          Falar com a Mari
        </Link>
      </div>
    </div>
  );
}
