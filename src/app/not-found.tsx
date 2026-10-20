import Link from "next/link";
import { ArrowRight } from "lucide-react";
export default function NotFound() {
  return (
    <div className="container error-state">
      <span className="big-404">404</span>
      <h1>Este endereço não foi encontrado.</h1>
      <p>Mas o seu próximo lar pode estar logo ali.</p>
      <Link className="button button-dark" href="/buscar">
        Explorar imóveis <ArrowRight size={18} />
      </Link>
    </div>
  );
}
