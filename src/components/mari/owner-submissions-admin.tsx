"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api, Busy, Notice } from "./ui";
import { phoneMask, priceLabel } from "@/lib/mari/types";

type Submission = {
  id: string;
  purpose: string;
  propertyType: string;
  city: string;
  neighborhood: string;
  location: string;
  area: number | null;
  bedrooms: number | null;
  askingPrice: number | string | null;
  notes: string;
  status: string;
  createdAt: string;
  lead: { firstName: string; phone: string };
  photos: { id: string; key: string }[];
  convertedProperty: { id: string; code: string; title: string } | null;
};

export function OwnerSubmissionsAdmin() {
  const [items, setItems] = useState<Submission[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    try { setItems(await api<Submission[]>("admin/owner-submissions")); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  if (busy) return <Busy />;
  return <section className="stack">
    <Notice error>{error}</Notice><Notice>{message}</Notice>
    <div className="admin-toolbar"><p>Imóveis enviados por proprietários pelo site.</p><Link className="button secondary" href="/proprietarios" target="_blank">Ver formulário público</Link></div>
    <div className="owner-submission-grid">
      {items.map((item) => <article className="admin-card owner-submission-card" key={item.id}>
        <div className="owner-submission-heading"><div><span className="eyebrow">{item.purpose === "rent" ? "LOCAÇÃO" : "VENDA"}</span><h2>{item.propertyType} em {item.neighborhood}</h2></div><span>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</span></div>
        <p><strong>{item.lead.firstName}</strong> · {phoneMask(item.lead.phone)}</p>
        <p>{item.city}{item.location ? ` · ${item.location}` : ""}</p>
        <label>Status do atendimento<select value={item.status} onChange={async (event) => { try { await api(`admin/owner-submissions/${item.id}`, { status: event.target.value }, "PATCH"); await load(); } catch(e) { setError((e as Error).message); } }}><option value="new">Nova</option><option value="contacted">Em contato</option><option value="converted">Convertida em imóvel</option><option value="archived">Arquivada</option></select></label>
        <div className="submission-facts"><span>{item.area ? `${item.area} m²` : "Área não informada"}</span><span>{item.bedrooms ?? "—"} quartos</span><span>{item.askingPrice ? priceLabel(Number(item.askingPrice)) : "Valor a definir"}</span><span>{item.photos.length} fotos</span></div>
        {item.photos.length > 0 && <div className="submission-photos">{item.photos.map((photo) => <div key={photo.id}><Image src={`/media/${photo.key}`} alt="Fotografia enviada pelo proprietário" fill sizes="140px" unoptimized /></div>)}</div>}
        {item.notes && <p className="preserve-lines">{item.notes}</p>}
        {item.convertedProperty ? <p className="success-text">Rascunho criado: {item.convertedProperty.code} · {item.convertedProperty.title}</p> : <button className="button" onClick={async () => { try { setError(""); await api(`admin/owner-submissions/${item.id}/convert`, {}, "POST"); setMessage("Rascunho criado. Revise-o na área de imóveis antes de publicar."); await load(); } catch(e) { setError((e as Error).message); } }}>Transformar em imóvel</button>}
      </article>)}
    </div>
    {!items.length && <div className="empty-admin">Nenhum imóvel foi enviado por proprietário.</div>}
  </section>;
}
