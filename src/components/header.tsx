"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Menu,
  MessageCircle,
  Search,
  X,
} from "lucide-react";
import { site } from "@/config/site";
import { whatsappLink } from "@/lib/contact";
export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (!header.current?.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);
  const close = () => {
    setMenu(null);
    setOpen(false);
  };
  const links = (
    <>
      <Link onClick={close} href="/buscar">
        Todos os imóveis <ArrowUpRight size={16} />
      </Link>
      <Link onClick={close} href="/buscar?city=balneario-camboriu">
        Balneário Camboriú
      </Link>
      <Link onClick={close} href="/buscar?city=itajai">
        Itajaí e Praia Brava
      </Link>
      <Link onClick={close} href="/buscar?city=itapema">
        Itapema
      </Link>
      <Link onClick={close} href="/buscar?city=porto-belo">
        Porto Belo
      </Link>
    </>
  );
  return (
    <>
      <div className="demo-banner">
        <span className="demo-dot" /> Ambiente de demonstração{" "}
        <span className="demo-explanation">
          · Imóveis, imagens e valores ilustrativos, sem ofertas reais.
        </span>
      </div>
      <header
        ref={header}
        className="header"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            (
              header.current?.querySelector(
                'button[aria-expanded="true"]',
              ) as HTMLButtonElement | null
            )?.focus();
            setMenu(null);
          }
        }}
      >
        <div className="container header-inner">
          <Link
            href="/"
            onClick={close}
            className="brand"
            aria-label="Adim Aluguéis — início"
          >
            <Image
              src="/brand/adim-color.png"
              alt="Adim Aluguéis"
              width={150}
              height={64}
              priority
              unoptimized
            />
          </Link>
          <form className="header-search" action="/buscar">
            <label className="sr-only" htmlFor="header-query">
              Buscar por código ou localização
            </label>
            <input
              id="header-query"
              name="q"
              placeholder="Onde você quer morar?"
            />
            <button aria-label="Pesquisar imóveis">
              <Search size={18} />
            </button>
          </form>
          <nav aria-label="Navegação principal" className="desktop-nav">
            <div className="nav-dropdown">
              <button
                className={path === "/buscar" ? "active" : ""}
                aria-expanded={menu === "rent"}
                aria-controls="rent-menu"
                onClick={() => setMenu(menu === "rent" ? null : "rent")}
              >
                Imóveis para alugar <ChevronDown size={14} />
              </button>
              {menu === "rent" && (
                <div id="rent-menu" className="mega-menu">
                  <span className="eyebrow">Seu próximo endereço</span>
                  {links}
                </div>
              )}
            </div>
            <Link
              className={path === "/proprietarios" ? "active" : ""}
              href="/proprietarios"
              onClick={close}
            >
              Para proprietários
            </Link>
            <div className="nav-dropdown">
              <button
                aria-expanded={menu === "about"}
                aria-controls="content-menu"
                onClick={() => setMenu(menu === "about" ? null : "about")}
              >
                A Adim <ChevronDown size={14} />
              </button>
              {menu === "about" && (
                <div id="content-menu" className="mega-menu">
                  <Link onClick={close} href="/sobre">
                    Nossa história
                  </Link>
                  <Link onClick={close} href="/contato">
                    Fale com a gente
                  </Link>
                  <a href={site.blog}>
                    Blog da Adim <ArrowUpRight size={15} />
                  </a>
                  <a href={site.clientPortal}>
                    Área do cliente <ArrowUpRight size={15} />
                  </a>
                </div>
              )}
            </div>
          </nav>
          <a
            className="button button-orange header-cta"
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={17} /> Vamos conversar
          </a>
          <button
            className="icon-button mobile-menu-button"
            aria-label="Abrir menu"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
        </div>
      </header>
      <dialog
        ref={dialog}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        className="mobile-dialog"
        aria-label="Menu principal"
      >
        <div className="dialog-heading">
          <span>Explore a Adim</span>
          <button
            className="icon-button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X />
          </button>
        </div>
        <nav aria-label="Menu mobile" className="mobile-nav">
          {links}
          <Link href="/proprietarios" onClick={close}>
            Para proprietários
          </Link>
          <Link href="/sobre" onClick={close}>
            Sobre a Adim
          </Link>
          <Link href="/contato" onClick={close}>
            Contato
          </Link>
          <a href={site.clientPortal}>
            Área do cliente <ArrowUpRight size={16} />
          </a>
        </nav>
        <a
          className="button button-orange"
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={18} /> Falar com a Adim
        </a>
      </dialog>
    </>
  );
}
