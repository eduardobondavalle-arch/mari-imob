import Image from "next/image";
import { OwnerForm } from "@/components/mari/owner-form";

export const metadata = { title: "Anuncie seu imóvel" };

export default function Page() {
  return <>
    <section className="owners-hero">
      <Image
        src="/images/owners-hero-v1.png"
        alt="Entrega das chaves de um imóvel com Balneário Camboriú ao fundo"
        fill
        priority
        sizes="100vw"
      />
      <span className="owners-hero-shade" aria-hidden="true" />
      <div className="container owners-hero-copy">
        <p className="eyebrow">PARA PROPRIETÁRIOS</p>
        <h1>Seu imóvel merece as melhores oportunidades.</h1>
        <p>Quer vender ou alugar seu imóvel? Conte um pouco sobre ele e vamos conversar sobre as melhores possibilidades.</p>
      </div>
    </section>
    <div className="container section owners-page">
      <OwnerForm />
    </div>
  </>;
}
