import { site } from "@/config/site";
import type { Property } from "@/domain/property";
export const whatsappLink = (
  message = "Olá! Gostaria de conversar com a Adim sobre locação anual.",
) => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
export function propertyMessage(
  p: Pick<Property, "code" | "title" | "slug" | "isDemo">,
  origin: string,
) {
  return `${p.isDemo ? "Olá! Vi um exemplo no site de demonstração da Adim (não é uma oferta real) e gostaria de conhecer opções reais semelhantes." : "Olá! Tenho interesse neste imóvel para locação anual."}\n${p.code} — ${p.title}\n${origin}/imovel/${p.slug}`;
}
export interface ContactDraft {
  name: string;
  email: string;
  phone: string;
  message: string;
}
export const draftMessage = (d: ContactDraft) =>
  `Olá, Adim! Meu nome é ${d.name.trim()}.\n${d.message.trim()}\nRetorno: ${[d.email.trim(), d.phone.trim()].filter(Boolean).join(" · ")}`;
